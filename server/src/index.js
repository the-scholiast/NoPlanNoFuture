const express = require('express');
const cors = require('cors');
// Load environment variables from a .env file into process.env
require('dotenv').config();

const app = express();
// Enable CORS for all routes (helps the frontend communicate with the backend)
app.use(cors());
// Enable parsing of JSON request bodies (e.g., from POST requests)
app.use(express.json());

// TESTING
app.get('/api/status', (req, res) => {
  res.json({ status: 'Server is up!' });
});


const PORT = process.env.PORT || 5000;
// Start the Express server and listen on the specified port
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
