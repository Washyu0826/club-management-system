import express from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../config/database.js';
import { authenticate, canEditFile, isFullAccess } from '../middleware/auth.js';

const router = express.Router();

// 所有路由都需要認證
router.use(authenticate);

// 獲取檔案列表（支援篩選）
router.get('/', async (req, res) => {
  try {
    const { year, department_id, category_id, search, tags } = req.query;

    let queryText = `
      SELECT f.*, 
             fc.name as category_name,
             d.name as department_name,
             u.username as uploaded_by_name
      FROM files f
      LEFT JOIN file_categories fc ON f.category_id = fc.id
      LEFT JOIN departments d ON f.department_id = d.id
      LEFT JOIN users u ON f.uploaded_by = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;

    if (year) {
      queryText += ` AND f.year = $${paramCount}`;
      params.push(year);
      paramCount++;
    }

    if (department_id) {
      queryText += ` AND f.department_id = $${paramCount}`;
      params.push(department_id);
      paramCount++;
    }

    if (category_id) {
      queryText += ` AND f.category_id = $${paramCount}`;
      params.push(category_id);
      paramCount++;
    }

    if (search) {
      queryText += ` AND (f.title ILIKE $${paramCount} OR f.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (tags) {
      queryText += ` AND f.tags && $${paramCount}`;
      params.push(tags.split(','));
      paramCount++;
    }

    queryText += ' ORDER BY f.year DESC, f.created_at DESC';

    const result = await query(queryText, params);

    res.json({
      files: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ error: '獲取檔案列表失敗' });
  }
});

// 獲取單一檔案資訊
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT f.*, 
              fc.name as category_name,
              d.name as department_name,
              u.username as uploaded_by_name
       FROM files f
       LEFT JOIN file_categories fc ON f.category_id = fc.id
       LEFT JOIN departments d ON f.department_id = d.id
       LEFT JOIN users u ON f.uploaded_by = u.id
       WHERE f.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '檔案不存在' });
    }

    res.json({ file: result.rows[0] });
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({ error: '獲取檔案資訊失敗' });
  }
});

// 新增檔案
router.post('/',
  canEditFile,
  [
    body('title').trim().notEmpty().withMessage('標題不能為空'),
    body('category_id').isInt().withMessage('請選擇分類'),
    body('year').isInt({ min: 2000, max: 2100 }).withMessage('請輸入有效年份'),
    body('google_drive_url').isURL().withMessage('請提供有效的 Google Drive 連結'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.canEdit) {
        return res.status(403).json({ error: '您沒有新增檔案的權限' });
      }

      const {
        title, category_id, year, department_id,
        google_drive_url, file_type, description, tags
      } = req.body;

      // 如果是幹部，只能新增自己組別的檔案
      if (req.user.role === 'officer' && department_id !== req.user.department_id) {
        return res.status(403).json({ error: '您只能新增自己組別的檔案' });
      }

      const result = await query(
        `INSERT INTO files 
         (title, category_id, year, department_id, google_drive_url, file_type, description, tags, uploaded_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [title, category_id, year, department_id, google_drive_url, file_type, description, tags, req.user.id]
      );

      res.status(201).json({
        message: '檔案新增成功',
        file: result.rows[0]
      });
    } catch (error) {
      console.error('Create file error:', error);
      res.status(500).json({ error: '新增檔案失敗' });
    }
  }
);

// 更新檔案資訊
router.put('/:id', canEditFile, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title, category_id, year, department_id,
      google_drive_url, file_type, description, tags
    } = req.body;

    // 檢查檔案是否存在
    const fileCheck = await query('SELECT department_id FROM files WHERE id = $1', [id]);
    
    if (fileCheck.rows.length === 0) {
      return res.status(404).json({ error: '檔案不存在' });
    }

    // 如果是幹部，只能編輯自己組別的檔案
    if (req.user.role === 'officer') {
      if (fileCheck.rows[0].department_id !== req.user.department_id) {
        return res.status(403).json({ error: '您只能編輯自己組別的檔案' });
      }
    }

    const result = await query(
      `UPDATE files SET
        title = COALESCE($1, title),
        category_id = COALESCE($2, category_id),
        year = COALESCE($3, year),
        department_id = COALESCE($4, department_id),
        google_drive_url = COALESCE($5, google_drive_url),
        file_type = COALESCE($6, file_type),
        description = COALESCE($7, description),
        tags = COALESCE($8, tags),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *`,
      [title, category_id, year, department_id, google_drive_url, file_type, description, tags, id]
    );

    res.json({
      message: '檔案更新成功',
      file: result.rows[0]
    });
  } catch (error) {
    console.error('Update file error:', error);
    res.status(500).json({ error: '更新檔案失敗' });
  }
});

// 刪除檔案
router.delete('/:id', canEditFile, async (req, res) => {
  try {
    const { id } = req.params;

    // 檢查檔案是否存在
    const fileCheck = await query('SELECT department_id FROM files WHERE id = $1', [id]);
    
    if (fileCheck.rows.length === 0) {
      return res.status(404).json({ error: '檔案不存在' });
    }

    // 如果是幹部，只能刪除自己組別的檔案
    if (req.user.role === 'officer') {
      if (fileCheck.rows[0].department_id !== req.user.department_id) {
        return res.status(403).json({ error: '您只能刪除自己組別的檔案' });
      }
    }

    const result = await query('DELETE FROM files WHERE id = $1 RETURNING *', [id]);

    res.json({ message: '檔案已刪除', file: result.rows[0] });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: '刪除檔案失敗' });
  }
});

// 獲取所有分類
router.get('/categories/list', async (req, res) => {
  try {
    const result = await query('SELECT * FROM file_categories ORDER BY name');
    res.json({ categories: result.rows });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: '獲取分類列表失敗' });
  }
});

// 新增分類（僅社長和顧問）
router.post('/categories', isFullAccess, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: '分類名稱不能為空' });
    }

    const result = await query(
      'INSERT INTO file_categories (name, description) VALUES ($1, $2) RETURNING *',
      [name, description]
    );

    res.status(201).json({
      message: '分類新增成功',
      category: result.rows[0]
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: '新增分類失敗' });
  }
});

// 統計資料
router.get('/stats/overview', async (req, res) => {
  try {
    const totalFiles = await query('SELECT COUNT(*) as count FROM files');
    const byYear = await query('SELECT year, COUNT(*) as count FROM files GROUP BY year ORDER BY year DESC');
    const byDepartment = await query(
      `SELECT d.name, COUNT(f.id) as count 
       FROM departments d 
       LEFT JOIN files f ON d.id = f.department_id
       GROUP BY d.name`
    );
    const byCategory = await query(
      `SELECT fc.name, COUNT(f.id) as count 
       FROM file_categories fc 
       LEFT JOIN files f ON fc.id = f.category_id
       GROUP BY fc.name`
    );

    res.json({
      total: parseInt(totalFiles.rows[0].count),
      byYear: byYear.rows,
      byDepartment: byDepartment.rows,
      byCategory: byCategory.rows
    });
  } catch (error) {
    console.error('Get file stats error:', error);
    res.status(500).json({ error: '獲取統計資料失敗' });
  }
});

export default router;
