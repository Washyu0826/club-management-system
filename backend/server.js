import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/database.js';

// 路由匯入
import authRoutes from './routes/auth.js';
import memberRoutes from './routes/members.js';
import fileRoutes from './routes/files.js';
import communityRoutes from './routes/community.js';
import departmentRoutes from './routes/departments.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 中介層
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 請求日誌
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/departments', departmentRoutes);

// 健康檢查
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy', 
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// 根路徑
app.get('/', (req, res) => {
  res.json({
    message: '社團管理系統 API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      members: '/api/members',
      files: '/api/files',
      community: '/api/community',
      departments: '/api/departments',
      health: '/health'
    }
  });
});

// 404 處理
app.use((req, res) => {
  res.status(404).json({ error: '找不到此路徑' });
});

// 錯誤處理中介層
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: '未授權' });
  }
  
  res.status(500).json({ 
    error: '伺服器內部錯誤',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`
🚀 Server is running!
📡 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
🔗 API: http://localhost:${PORT}
📚 Health: http://localhost:${PORT}/health
  `);
});

// 優雅關閉
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing server...');
  await pool.end();
  process.exit(0);
});

export default app;
