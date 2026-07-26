require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const routes = require('./routes/index');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Connect DB
connectDB();

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', routes);

// Health check
app.get('/', (req, res) => res.json({ message: 'MiniBank API is running ✓', version: '1.0.0' }));

// 404 handler
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🏦 MiniBank server running on port ${PORT}`));
