import express from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

// ========== 公告相關 ==========

// 獲取公告列表
router.get('/announcements', async (req, res) => {
  try {
    const { department_id, limit = 50 } = req.query;

    let queryText = `
      SELECT a.*, 
             u.username as author_name,
             d.name as department_name,
             (SELECT COUNT(*) FROM comments WHERE announcement_id = a.id) as comment_count
      FROM announcements a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN departments d ON a.department_id = d.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;

    if (department_id) {
      queryText += ` AND (a.department_id = $${paramCount} OR a.department_id IS NULL)`;
      params.push(department_id);
      paramCount++;
    }

    queryText += ` ORDER BY a.is_pinned DESC, a.created_at DESC LIMIT $${paramCount}`;
    params.push(limit);

    const result = await query(queryText, params);

    res.json({
      announcements: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ error: '獲取公告列表失敗' });
  }
});

// 獲取單一公告
router.get('/announcements/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT a.*, 
              u.username as author_name,
              d.name as department_name
       FROM announcements a
       LEFT JOIN users u ON a.author_id = u.id
       LEFT JOIN departments d ON a.department_id = d.id
       WHERE a.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '公告不存在' });
    }

    // 獲取留言
    const comments = await query(
      `SELECT c.*, u.username as author_name
       FROM comments c
       LEFT JOIN users u ON c.author_id = u.id
       WHERE c.announcement_id = $1
       ORDER BY c.created_at ASC`,
      [id]
    );

    res.json({
      announcement: result.rows[0],
      comments: comments.rows
    });
  } catch (error) {
    console.error('Get announcement error:', error);
    res.status(500).json({ error: '獲取公告失敗' });
  }
});

// 新增公告（幹部以上）
router.post('/announcements',
  authorize('president', 'advisor', 'officer'),
  [
    body('title').trim().notEmpty().withMessage('標題不能為空'),
    body('content').trim().notEmpty().withMessage('內容不能為空'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, content, department_id, is_pinned = false } = req.body;

      // 幹部只能發佈自己組別的公告
      if (req.user.role === 'officer' && department_id !== req.user.department_id) {
        return res.status(403).json({ error: '您只能發佈自己組別的公告' });
      }

      const result = await query(
        `INSERT INTO announcements (title, content, author_id, department_id, is_pinned)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [title, content, req.user.id, department_id, is_pinned]
      );

      res.status(201).json({
        message: '公告發佈成功',
        announcement: result.rows[0]
      });
    } catch (error) {
      console.error('Create announcement error:', error);
      res.status(500).json({ error: '發佈公告失敗' });
    }
  }
);

// 更新公告
router.put('/announcements/:id', authorize('president', 'advisor', 'officer'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, is_pinned } = req.body;

    // 檢查權限
    const announcementCheck = await query(
      'SELECT author_id, department_id FROM announcements WHERE id = $1',
      [id]
    );

    if (announcementCheck.rows.length === 0) {
      return res.status(404).json({ error: '公告不存在' });
    }

    const announcement = announcementCheck.rows[0];
    const canEdit = 
      ['president', 'advisor'].includes(req.user.role) ||
      (req.user.role === 'officer' && announcement.department_id === req.user.department_id);

    if (!canEdit) {
      return res.status(403).json({ error: '權限不足' });
    }

    const result = await query(
      `UPDATE announcements SET
        title = COALESCE($1, title),
        content = COALESCE($2, content),
        is_pinned = COALESCE($3, is_pinned),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *`,
      [title, content, is_pinned, id]
    );

    res.json({
      message: '公告更新成功',
      announcement: result.rows[0]
    });
  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({ error: '更新公告失敗' });
  }
});

// 刪除公告
router.delete('/announcements/:id', authorize('president', 'advisor', 'officer'), async (req, res) => {
  try {
    const { id } = req.params;

    const announcementCheck = await query(
      'SELECT author_id, department_id FROM announcements WHERE id = $1',
      [id]
    );

    if (announcementCheck.rows.length === 0) {
      return res.status(404).json({ error: '公告不存在' });
    }

    const announcement = announcementCheck.rows[0];
    const canDelete = 
      ['president', 'advisor'].includes(req.user.role) ||
      (req.user.role === 'officer' && announcement.department_id === req.user.department_id);

    if (!canDelete) {
      return res.status(403).json({ error: '權限不足' });
    }

    await query('DELETE FROM announcements WHERE id = $1', [id]);

    res.json({ message: '公告已刪除' });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ error: '刪除公告失敗' });
  }
});

// 新增留言
router.post('/announcements/:id/comments',
  [body('content').trim().notEmpty().withMessage('留言內容不能為空')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { content, parent_id = null } = req.body;

      const result = await query(
        `INSERT INTO comments (announcement_id, author_id, content, parent_id)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [id, req.user.id, content, parent_id]
      );

      res.status(201).json({
        message: '留言成功',
        comment: result.rows[0]
      });
    } catch (error) {
      console.error('Create comment error:', error);
      res.status(500).json({ error: '留言失敗' });
    }
  }
);

// ========== 活動相關 ==========

// 獲取活動列表
router.get('/events', async (req, res) => {
  try {
    const { department_id, status, upcoming = false } = req.query;

    let queryText = `
      SELECT e.*, 
             d.name as department_name,
             u.username as created_by_name,
             (SELECT COUNT(*) FROM registrations WHERE event_id = e.id AND status = 'registered') as registered_count
      FROM events e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN users u ON e.created_by = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;

    if (department_id) {
      queryText += ` AND e.department_id = $${paramCount}`;
      params.push(department_id);
      paramCount++;
    }

    if (status) {
      queryText += ` AND e.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (upcoming === 'true') {
      queryText += ` AND e.start_time > CURRENT_TIMESTAMP`;
    }

    queryText += ' ORDER BY e.start_time ASC';

    const result = await query(queryText, params);

    res.json({
      events: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: '獲取活動列表失敗' });
  }
});

// 獲取單一活動
router.get('/events/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT e.*, 
              d.name as department_name,
              u.username as created_by_name
       FROM events e
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN users u ON e.created_by = u.id
       WHERE e.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '活動不存在' });
    }

    // 獲取報名名單
    const registrations = await query(
      `SELECT r.*, m.name, m.phone, m.email
       FROM registrations r
       LEFT JOIN members m ON r.member_id = m.id
       WHERE r.event_id = $1
       ORDER BY r.registered_at ASC`,
      [id]
    );

    res.json({
      event: result.rows[0],
      registrations: registrations.rows
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ error: '獲取活動資訊失敗' });
  }
});

// 新增活動（幹部以上）
router.post('/events',
  authorize('president', 'advisor', 'officer'),
  [
    body('title').trim().notEmpty().withMessage('活動名稱不能為空'),
    body('start_time').isISO8601().withMessage('請提供有效的開始時間'),
    body('end_time').isISO8601().withMessage('請提供有效的結束時間'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        title, description, department_id, start_time, end_time,
        location, max_participants
      } = req.body;

      const result = await query(
        `INSERT INTO events 
         (title, description, department_id, start_time, end_time, location, max_participants, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [title, description, department_id, start_time, end_time, location, max_participants, req.user.id]
      );

      res.status(201).json({
        message: '活動建立成功',
        event: result.rows[0]
      });
    } catch (error) {
      console.error('Create event error:', error);
      res.status(500).json({ error: '建立活動失敗' });
    }
  }
);

// 報名活動
router.post('/events/:id/register', async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    // 獲取使用者的 member_id
    const memberResult = await query(
      'SELECT id FROM members WHERE user_id = $1',
      [req.user.id]
    );

    if (memberResult.rows.length === 0) {
      return res.status(404).json({ error: '找不到社員資料' });
    }

    const memberId = memberResult.rows[0].id;

    // 檢查活動是否存在和是否已滿
    const eventCheck = await query(
      `SELECT max_participants, 
              (SELECT COUNT(*) FROM registrations WHERE event_id = $1 AND status = 'registered') as current_count
       FROM events WHERE id = $1`,
      [id]
    );

    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ error: '活動不存在' });
    }

    const event = eventCheck.rows[0];
    if (event.max_participants && event.current_count >= event.max_participants) {
      return res.status(400).json({ error: '活動報名已額滿' });
    }

    // 報名
    const result = await query(
      `INSERT INTO registrations (event_id, member_id, notes)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [id, memberId, notes]
    );

    res.status(201).json({
      message: '報名成功',
      registration: result.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: '您已經報名過此活動' });
    }
    console.error('Register event error:', error);
    res.status(500).json({ error: '報名失敗' });
  }
});

// 取消報名
router.delete('/events/:id/register', async (req, res) => {
  try {
    const { id } = req.params;

    const memberResult = await query(
      'SELECT id FROM members WHERE user_id = $1',
      [req.user.id]
    );

    if (memberResult.rows.length === 0) {
      return res.status(404).json({ error: '找不到社員資料' });
    }

    const memberId = memberResult.rows[0].id;

    const result = await query(
      'DELETE FROM registrations WHERE event_id = $1 AND member_id = $2 RETURNING *',
      [id, memberId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '找不到報名記錄' });
    }

    res.json({ message: '已取消報名' });
  } catch (error) {
    console.error('Cancel registration error:', error);
    res.status(500).json({ error: '取消報名失敗' });
  }
});

export default router;
