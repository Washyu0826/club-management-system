import express from 'express';
import { query } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

// 獲取所有組別
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT d.*,
             (SELECT COUNT(*) FROM members WHERE department_id = d.id AND status = 'active') as member_count,
             (SELECT COUNT(*) FROM files WHERE department_id = d.id) as file_count
      FROM departments d
      ORDER BY d.id
    `);

    res.json({
      departments: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ error: '獲取組別列表失敗' });
  }
});

// 獲取單一組別詳細資訊
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const departmentResult = await query(
      'SELECT * FROM departments WHERE id = $1',
      [id]
    );

    if (departmentResult.rows.length === 0) {
      return res.status(404).json({ error: '組別不存在' });
    }

    // 獲取組員
    const membersResult = await query(
      `SELECT m.*, u.username
       FROM members m
       LEFT JOIN users u ON m.user_id = u.id
       WHERE m.department_id = $1 AND m.status = 'active'
       ORDER BY m.position, m.name`,
      [id]
    );

    // 獲取最近的檔案
    const filesResult = await query(
      `SELECT f.*, fc.name as category_name
       FROM files f
       LEFT JOIN file_categories fc ON f.category_id = fc.id
       WHERE f.department_id = $1
       ORDER BY f.created_at DESC
       LIMIT 10`,
      [id]
    );

    res.json({
      department: departmentResult.rows[0],
      members: membersResult.rows,
      recentFiles: filesResult.rows
    });
  } catch (error) {
    console.error('Get department error:', error);
    res.status(500).json({ error: '獲取組別資訊失敗' });
  }
});

export default router;
