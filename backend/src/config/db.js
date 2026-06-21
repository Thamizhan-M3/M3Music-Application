import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;


// import mongoose from 'mongoose';

// const connectDB = async () => {
//   try {
//     const conn = await mongoose.connect(process.env.MONGODB_URI, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,

//       // ✅ REQUIRED for DocumentDB
//       retryWrites: false,
//       tls: true,
//       tlsAllowInvalidCertificates: true,

//       // ✅ Recommended (avoid hanging connections)
//       serverSelectionTimeoutMS: 5000
//     });

//     console.log(`DocumentDB Connected: ${conn.connection.host}`);
//   } catch (error) {
//     console.error(`Error connecting to DocumentDB: ${error.message}`);
//     process.exit(1);
//   }
// };

// export default connectDB;
