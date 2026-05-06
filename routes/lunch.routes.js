// backend/routes/lunch.routes.js
const express = require('express');
const router = express.Router();
const pool = require('../db.js');

/**
 * GET /api/lunch/menus
 * - ดึงรายการเมนูจากตาราง menus (รวมชื่อเมนูและประเภทถ้ามี)
 */
router.get('/menus', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT m.menu_id, m.name, m.notes, mt.menu_type
       FROM menus m
       LEFT JOIN menu_types mt ON m.menu_type_id = mt.menu_type_id
       ORDER BY mt.menu_type, m.name`
    );
    res.json({ menus: rows });
  } catch (err) {
    console.error('GET /api/lunch/menus err', err);
    res.status(500).json({ error: 'failed to fetch menus' });
  }
});

/**
 * GET /api/lunch/summaries?date=YYYY-MM-DD&teacher_id=#
 * - ดึงสรุปอาหารของวันนั้น (โดย teacher หรือ ทั้งศูนย์ถ้าไม่ส่ง teacher_id)
 */
router.get('/summaries', async (req, res) => {
  const date = req.query.date || (new Date()).toISOString().slice(0,10);
  const teacher_id = req.query.teacher_id ? parseInt(req.query.teacher_id, 10) : null;

  try {
    let q = `SELECT ls.*, m.name as menu_name, t.first_name as teacher_first, t.last_name as teacher_last
             FROM lunch_summaries ls
             LEFT JOIN menus m ON ls.menu_id = m.menu_id
             LEFT JOIN teachers t ON ls.teacher_id = t.teacher_id
             WHERE DATE(ls.summary_date) = ?`;
    const params = [date];

    if (teacher_id) {
      q += ` AND ls.teacher_id = ?`;
      params.push(teacher_id);
    }

    q += ` ORDER BY ls.created_at DESC`;

    const [rows] = await pool.query(q, params);
    res.json({ date, rows });
  } catch (err) {
    console.error('GET /api/lunch/summaries err', err);
    res.status(500).json({ error: 'failed to fetch summaries' });
  }
});

/**
 * POST /api/lunch/summaries
 * payload: { menu_id, summary_date (YYYY-MM-DD, optional), teacher_id, note }
 * - insert new summary (one row per request)
 */
router.post('/summaries', async (req, res) => {
  const { menu_id, summary_date, teacher_id, note } = req.body;
  if (!menu_id) return res.status(400).json({ error: 'menu_id required' });
  if (!teacher_id) return res.status(400).json({ error: 'teacher_id required' });

  const date = summary_date || (new Date()).toISOString().slice(0,10);

  try {
    const [ins] = await pool.query(
      `INSERT INTO lunch_summaries (menu_id, summary_date, teacher_id, note, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [menu_id, date, teacher_id, note || null, teacher_id]
    );
    res.json({ ok: true, summary_id: ins.insertId });
  } catch (err) {
    console.error('POST /api/lunch/summaries err', err);
    res.status(500).json({ error: 'failed to save summary' });
  }
});

module.exports = router;
