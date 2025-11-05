import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export const generateToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

export const verifyToken = (token) =>
  jwt.verify(token, process.env.JWT_SECRET);

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer '))
      return res.status(401).json({ error: '未提供或無效的認證令牌' });
    req.user = verifyToken(authHeader.split(' ')[1]);
    next();
  } catch {
    return res.status(401).json({ error: '無效或過期的令牌' });
  }
};

export const authorize = (roles = []) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: '尚未登入' });
  if (roles.length && !roles.includes(req.user.role))
    return res.status(403).json({ error: '權限不足' });
  next();
};

export const isFullAccess = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: '尚未登入' });
  if (!['president', 'advisor'].includes(req.user.role))
    return res.status(403).json({ error: '權限不足' });
  next();
};
