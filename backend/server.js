const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// ── Core Middleware ────────────────────────────────────────────────────────
app.use(cors()); // Allow all origins in dev — restrict in production
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve uploaded images as static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Health Check ──────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 TechLine Computers API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ────────────────────────────────────────────────────────────
app.use('/api/auth',            require('./routes/authRoutes'));
app.use('/api/users',           require('./routes/userRoutes'));
app.use('/api/products',        require('./routes/productRoutes'));
app.use('/api/warranty',        require('./routes/warrantyRoutes'));
app.use('/api/service-tickets', require('./routes/serviceTicketRoutes'));
app.use('/api/orders',          require('./routes/orderRoutes'));
app.use('/api/notifications',   require('./routes/notificationRoutes'));
app.use('/api/admin',           require('./routes/adminRoutes'));
app.use('/api/suppliers',       require('./routes/supplierRoutes'));
app.use('/api/purchase-orders', require('./routes/purchaseOrderRoutes'));
app.use('/api/upload',          require('./routes/uploadRoutes'));
app.use('/api/chatbot',         require('./routes/chatbotRoutes'));

// ── Error Handling ────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 TechLine Backend Server`);
  console.log(`   Environment: ${process.env.NODE_ENV}`);
  console.log(`   Port:        ${PORT}`);
  console.log(`   URL:         http://localhost:${PORT}\n`);
});
