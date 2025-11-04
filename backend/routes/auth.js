import express from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { query } from '../config/database.js';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();

// 註冊新使用者
router.post('/register',
  [
    body('username').trim().isLength({ min: 3 }).withMessage('使用者名稱至少3個字元'),
    body('password').isLength({ min: 6 }).withMessage('密碼至少6個字元'),
    body('role').isIn(['president', 'advisor', 'officer', 'member', 'alumni']).withMessage('無效的角色'),
    body('name').trim().notEmpty().withMessage('姓名不能為空'),
    body('email').isEmail().withMessage('無效的電子郵件'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, password, role, name, email, student_id, department, grade, position, department_id, generation, phone } = req.body;

      // 檢查使用者是否已存在
      const userCheck = await query('SELECT id FROM users WHERE username = $1', [username]);
      if (userCheck.rows.length > 0) {
        return res.status(409).json({ error: '使用者名稱已被使用' });
      }

      // 加密密碼
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // 開始交易
      const client = await query('BEGIN');

      try {
        // 創建使用者
        const userResult = await query(
          'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role',
          [username, passwordHash, role]
        );

        const userId = userResult.rows[0].id;

        // 創建社員資料
        await query(
          `INSERT INTO members 
           (user_id, name, student_id, department, grade, position, department_id, generation, phone, email, status, joined_date) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_DATE)`,
          [userId, name, student_id, department, grade, position, department_id, generation, phone, email, 'active']
        );

        await query('COMMIT');

        // 生成 token
        const token = generateToken({
          id: userId,
          username: userResult.rows[0].username,
          role: userResult.rows[0].role,
          department_id: department_id
        });

        res.status(201).json({
          message: '註冊成功',
          user: userResult.rows[0],
          token
        });
      } catch (error) {
        await query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: '註冊失敗' });
    }
  }
);

// 登入
router.post('/login',
  [
    body('username').trim().notEmpty().withMessage('請輸入使用者名稱'),
    body('password').notEmpty().withMessage('請輸入密碼'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, password } = req.body;

      // 查找使用者
      const result = await query(
        `SELECT u.id, u.username, u.password_hash, u.role, u.is_active, m.department_id, m.name
         FROM users u
         LEFT JOIN members m ON u.id = m.user_id
         WHERE u.username = $1`,
        [username]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: '使用者名稱或密碼錯誤' });
      }

      const user = result.rows[0];

      // 檢查帳號是否啟用
      if (!user.is_active) {
        return res.status(403).json({ error: '帳號已被停用' });
      }

      // 驗證密碼
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: '使用者名稱或密碼錯誤' });
      }

      // 生成 token
      const token = generateToken({
        id: user.id,
        username: user.username,
        role: user.role,
        department_id: user.department_id
      });

      res.json({
        message: '登入成功',
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          department_id: user.department_id
        },
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: '登入失敗' });
    }
  }
);

// 獲取當前使用者資訊
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: '未提供認證令牌' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ error: '無效的令牌' });
    }

    const result = await query(
      `SELECT u.id, u.username, u.role, m.*
       FROM users u
       LEFT JOIN members m ON u.id = m.user_id
       WHERE u.id = $1 AND u.is_active = true`,
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '使用者不存在' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({ error: '獲取使用者資訊失敗' });
  }
});

export default router;
