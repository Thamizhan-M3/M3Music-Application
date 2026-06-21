import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middlewares/errorHandler.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import musicRoutes from './routes/musicRoutes.js';
import playlistRoutes from './routes/playlistRoutes.js';

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/music', musicRoutes);
app.use('/api/playlists', playlistRoutes);

// Health check
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
