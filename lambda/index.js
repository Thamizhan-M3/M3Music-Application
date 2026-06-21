import { MongoClient, ObjectId } from "mongodb";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";


const bedrock = new BedrockRuntimeClient({
    region: "ap-south-1",
});

const secretsManager = new SecretsManagerClient({});
const dynamodb = DynamoDBDocumentClient.from( new DynamoDBClient({}) );

export const handler = async (event) => {
    let client;
    try {
        // SQS body contains the original S3 event
        const sqsRecord = event.Records[0];

        let record;

        try {
            const body = JSON.parse(sqsRecord.body);

            if (!body.Records || !Array.isArray(body.Records)) {
                console.warn("Invalid SQS message format:", body);
                return;
            }

            record = body.Records[0];

        } catch (err) {
            console.error("Failed to parse SQS message:", sqsRecord.body);
            return;
        }


        if (!record.s3) {
            console.warn("Message is not an S3 event:", record);
            return;
        }
        const bucketName = record.s3.bucket.name;
        const objectKey = decodeURIComponent(
            record.s3.object.key.replace(/\+/g, " ")
        );
        
        console.log( `Upload detected: ${objectKey}` );
        
        if (!objectKey.startsWith("audio/")) {
            console.log( `Skipping non-audio file: ${objectKey}` );
            return { statusCode: 200 };
        }
        const secretResponse = await secretsManager.send( new GetSecretValueCommand({ SecretId: process.env.MONGO_SECRET_NAME }) );
        const secret = JSON.parse(secretResponse.SecretString);
        const mongoUri = `mongodb://${secret.MONGO_USERNAME}:${secret.MONGO_PASSWORD}` + `@${process.env.DATABASE_IP}:${process.env.DATABASE_PORT}` + `/?authSource=admin`;

        client = new MongoClient(mongoUri);
        await client.connect();

        const db = client.db(process.env.MONGO_DB_NAME);
        const songs = db.collection("songcaches");
        const users = db.collection("users");

        console.log( `Searching for song: ${objectKey}` );
        const song = await songs.findOne({ cloudinaryId: objectKey });

        if (!song) {
            console.warn( `Song not found for key: ${objectKey}` );
            return {
                statusCode: 404,
                body: JSON.stringify({ message: "Song not found" })
            };
        }
        console.log( `Song found: ${song.title}` );

        console.log("Calling Bedrock for AI enrichment...");

        let aiResult = {
            mood: "unknown",
            energy: 5,
            tags: []
        };

        try {
            const prompt = `
                You are a music analysis AI.

                Analyze the song metadata and return STRICT JSON only.
                Do NOT include explanations.

                Song:
                    Title: ${song.title}
                    Album: ${song.album}

                Return format:
                {
                    "mood": "happy | sad | energetic | calm | romantic | etc",
                    "energy": number (1-10),
                    "tags": ["tag1", "tag2"]
                }
            `;

            const response = await bedrock.send(
                new InvokeModelCommand({
                    modelId: process.env.BEDROCK_MODEL,
                    body: JSON.stringify({
                        messages: [
                            {
                                role: "user",
                                content: [
                                    {
                                        text: prompt
                                    }
                                ]
                            }
                        ]
                    })
                })
            );

            const responseBody = JSON.parse(
                new TextDecoder().decode(response.body)
            );

            console.log("Bedrock full response:", responseBody);

            const rawText =
                responseBody.outputText ||
                responseBody.content?.[0]?.text ||
                JSON.stringify(responseBody);

            console.log("Bedrock raw response:", rawText);

            // Try to extract JSON safely
            try {
                const jsonMatch = rawText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    aiResult = JSON.parse(jsonMatch[0]);
                }
            } catch (err) {
                console.warn("AI response parsing failed, using fallback");
            }
            
        } catch (err) {
            console.error("Bedrock call failed:", err);
        }

        let uploaderName = "Unknown";
        if (song.uploadedBy) {
            const uploader = await users.findOne({ _id: typeof song.uploadedBy === "string" ? new ObjectId(song.uploadedBy) : song.uploadedBy });
            if (uploader) {
                uploaderName = uploader.username;
            }
        }
        const analyticsRecord = {
            songId: song._id.toString(),
            title: song.title || "",
            album: song.album || "",
            duration: song.duration || 0,
            fileSize: song.fileSize || 0,
            url: song.url || "",
            uploadedAt: song.createdAt ? song.createdAt.toISOString() : null,
            uploadedBy: uploaderName,
            bucket: bucketName,
            uploadId: objectKey,
            processedAt: new Date().toISOString(),
            mood: aiResult.mood,
            energy: aiResult.energy,
            tags: aiResult.tags

        };

        await dynamodb.send(
            new PutCommand({
                TableName: process.env.DYNAMODB_TABLE,
                Item: analyticsRecord
            })
        );

        console.log( "Analytics record stored successfully" );

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                songId: analyticsRecord.songId
            })
        };
    } catch (error) {
        console.error( "Lambda execution failed:", error );
        throw error;
    } finally {
        if (client) {
            await client.close();
        }
    }
};