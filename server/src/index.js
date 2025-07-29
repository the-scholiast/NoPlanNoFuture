import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes/index.js';

// Load environment variables
dotenv.config();

const app = express();

// Enable CORS with specific configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'], // Allow both frontend and backend
  credentials: true,
  optionsSuccessStatus: 200
}));

// Enable parsing of JSON request bodies
app.use(express.json());

// Use the routes
app.use('/api', routes);

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});