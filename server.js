require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const { createServer } = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/database');
const activityLogger = require('./utils/activityLogger');
const path = require('path');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.COOKIE_SECURE !== 'false', // Set to 'false' for HTTP access
    httpOnly: true,
    sameSite: 'lax', // Allows cookies on same-site navigation
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Connect to MongoDB
connectDB();

// Initialize Socket.IO for real-time activity logs
io.on('connection', (socket) => {
  console.log('📡 Admin client connected to activity logs');
  
  // Join admin room for activity logs
  socket.join('admin-room');
  
  socket.on('disconnect', () => {
    console.log('📡 Admin client disconnected');
  });
});

// Initialize activity logger with Socket.IO
activityLogger.initialize(io);

// Routes
app.use('/api', require('./routes/director.routes'));
app.use('/admin', require('./routes/admin.routes'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Root redirect
app.get('/', (req, res) => {
  res.redirect('/admin');
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 Admin panel: http://localhost:${PORT}/admin`);
  console.log(`🔗 API endpoint: http://localhost:${PORT}/api/hotnode`);
});

