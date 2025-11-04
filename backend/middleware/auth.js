import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '7d';

// 生成 JWT Token
export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// 驗證 JWT Token
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// 認證中介層
export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未提供認證令牌' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: '無效或過期的令牌' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: '認證失敗' });
  }
};

// 權限檢查中介層
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '未認證' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: '權限不足' });
    }

    next();
  };
};

// 檢查是否為社長或顧問（完整權限）
export const isFullAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: '未認證' });
  }

  if (!['president', 'advisor'].includes(req.user.role)) {
    return res.status(403).json({ error: '需要社長或顧問權限' });
  }

  next();
};

// 檢查檔案編輯權限
export const canEditFile = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: '未認證' });
  }

  // 社長和顧問有完整權限
  if (['president', 'advisor'].includes(req.user.role)) {
    req.canEdit = true;
    return next();
  }

  // 幹部只能編輯自己組別的檔案
  if (req.user.role === 'officer') {
    req.canEdit = true;
    req.departmentRestriction = req.user.department_id;
    return next();
  }

  // 其他人沒有編輯權限
  req.canEdit = false;
  next();
};
