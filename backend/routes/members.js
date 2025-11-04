import express from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../config/database.js';
import { authenticate, authorize, isFullAccess } from '../middleware/auth.js';

const router = express.Router();

// 所有路由都需要認證
router.use(authenticate);

// 獲取所有社員列表（支援篩選和搜尋）
router.get('/', async (req, res) => {
  try {
    const { 
      generation, 
      department_id, 
      status = 'active', 
      search,
      industry,
      job_role 
    } = req.query;

    let queryText = `
      SELECT m.*, u.username, u.role, d.name as department_name
      FROM members m
      LEFT JOIN users u ON m.user_id = u.id
      LEFT JOIN departments d ON m.department_id = d.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;

    if (status) {
      queryText += ` AND m.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (generation) {
      queryText += ` AND m.generation = $${paramCount}`;
      params.push(generation);
      paramCount++;
    }

    if (department_id) {
      queryText += ` AND m.department_id = $${paramCount}`;
      params.push(department_id);
      paramCount++;
    }

    if (industry) {
      queryText += ` AND m.industry = $${paramCount}`;
      params.push(industry);
      paramCount++;
    }

    if (job_role) {
      queryText += ` AND m.job_role = $${paramCount}`;
      params.push(job_role);
      paramCount++;
    }

    if (search) {
      queryText += ` AND (m.name ILIKE $${paramCount} OR m.student_id ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    queryText += ' ORDER BY m.generation DESC, m.name ASC';

    const result = await query(queryText, params);

    res.json({
      members: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ error: '獲取社員列表失敗' });
  }
});

// 獲取單一社員資料
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT m.*, u.username, u.role, u.is_active, d.name as department_name
       FROM members m
       LEFT JOIN users u ON m.user_id = u.id
       LEFT JOIN departments d ON m.department_id = d.id
       WHERE m.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '社員不存在' });
    }

    res.json({ member: result.rows[0] });
  } catch (error) {
    console.error('Get member error:', error);
    res.status(500).json({ error: '獲取社員資料失敗' });
  }
});

// 更新社員資料
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, student_id, department, grade, position,
      department_id, generation, phone, email,
      skills, interests, industry, job_role, status
    } = req.body;

    // 檢查權限：只有社長、顧問或本人可以編輯
    const memberCheck = await query('SELECT user_id FROM members WHERE id = $1', [id]);
    
    if (memberCheck.rows.length === 0) {
      return res.status(404).json({ error: '社員不存在' });
    }

    const canEdit = 
      ['president', 'advisor'].includes(req.user.role) || 
      req.user.id === memberCheck.rows[0].user_id;

    if (!canEdit) {
      return res.status(403).json({ error: '權限不足' });
    }

    const result = await query(
      `UPDATE members SET
        name = COALESCE($1, name),
        student_id = COALESCE($2, student_id),
        department = COALESCE($3, department),
        grade = COALESCE($4, grade),
        position = COALESCE($5, position),
        department_id = COALESCE($6, department_id),
        generation = COALESCE($7, generation),
        phone = COALESCE($8, phone),
        email = COALESCE($9, email),
        skills = COALESCE($10, skills),
        interests = COALESCE($11, interests),
        industry = COALESCE($12, industry),
        job_role = COALESCE($13, job_role),
        status = COALESCE($14, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $15
      RETURNING *`,
      [name, student_id, department, grade, position, department_id, generation, 
       phone, email, skills, interests, industry, job_role, status, id]
    );

    res.json({
      message: '社員資料更新成功',
      member: result.rows[0]
    });
  } catch (error) {
    console.error('Update member error:', error);
    res.status(500).json({ error: '更新社員資料失敗' });
  }
});

// 刪除社員（僅社長和顧問）
router.delete('/:id', isFullAccess, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query('DELETE FROM members WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '社員不存在' });
    }

    res.json({ message: '社員已刪除', member: result.rows[0] });
  } catch (error) {
    console.error('Delete member error:', error);
    res.status(500).json({ error: '刪除社員失敗' });
  }
});

// 統計資料
router.get('/stats/overview', async (req, res) => {
  try {
    const totalMembers = await query('SELECT COUNT(*) as count FROM members WHERE status = $1', ['active']);
    const byGeneration = await query('SELECT generation, COUNT(*) as count FROM members WHERE status = $1 GROUP BY generation ORDER BY generation DESC', ['active']);
    const byDepartment = await query(
      `SELECT d.name, COUNT(m.id) as count 
       FROM departments d 
       LEFT JOIN members m ON d.id = m.department_id AND m.status = 'active'
       GROUP BY d.name`
    );
    const byIndustry = await query(
      `SELECT industry, COUNT(*) as count 
       FROM members 
       WHERE status = 'active' AND industry IS NOT NULL 
       GROUP BY industry 
       ORDER BY count DESC`
    );

    res.json({
      total: parseInt(totalMembers.rows[0].count),
      byGeneration: byGeneration.rows,
      byDepartment: byDepartment.rows,
      byIndustry: byIndustry.rows
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: '獲取統計資料失敗' });
  }
});

export default router;
