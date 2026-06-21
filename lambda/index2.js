import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const dynamodb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const sns = new SNSClient({});

export const handler = async () => {
    try {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));
        const result = await dynamodb.send( new ScanCommand({ TableName: process.env.DYNAMODB_TABLE }));
        const uploads = result.Items.filter(item => {
            const uploadedAt = new Date(item.uploadedAt);
            return ( uploadedAt >= oneHourAgo && uploadedAt <= now );
        });
        const totalUploads = uploads.length;
        let totalSize = 0;
        uploads.forEach(item => { totalSize += item.fileSize || 0; });
        const uploaders = [...new Set(uploads.map( x => x.uploadedBy ))];
        let report = `
            Hourly Upload Report
            Time Window:
            ${oneHourAgo.toISOString()}
            to
            ${now.toISOString()}
            Total Uploads: ${totalUploads}
            Total Upload Size:
            ${(totalSize / 1024 / 1024).toFixed(2)} MB
            Uploaders:
            ${uploaders.join("\n")}
            ==================================`;
        uploads.forEach(song => {
            report += `
            Title: ${song.title}
            Album: ${song.album}
            Duration: ${song.duration} sec
            Size: ${(song.fileSize / 1024 / 1024).toFixed(2)} MB
            Uploader: ${song.uploadedBy}
            Uploaded At: ${song.uploadedAt}`;
        });
        await sns.send(
            new PublishCommand({
                TopicArn: process.env.SNS_TOPIC_ARN,
                Subject: "M3 Music Hourly Upload Report",
                Message:  report
            })
        );

        return {
            statusCode: 200,
            body: JSON.stringify({ uploads: totalUploads })
        };
    } catch (error) {
        console.error(error);
        throw error;
    }
};