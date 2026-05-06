// backend/routes/announcement.routes.js
const express = require('express');
const router = express.Router();
const pool = require('../db.js');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

/* MULTER */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safe = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
    cb(null, safe);
  }
});
const upload = multer({ storage });

/* GET ALL */
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        a.*,
        u.username AS created_by_name
      FROM announcements a
      LEFT JOIN users u
        ON a.created_by = u.user_id
      ORDER BY a.created_at DESC
    `);

    for (const row of rows) {
      const [images] = await pool.query(
        `SELECT image_id, image_url
         FROM images
         WHERE ref_type='announcement'
         AND ref_id=?`,
        [row.announcement_id]
      );
      row.images = images;
    }

    res.json({ ok: true, rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

/* GET SINGLE */
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;

    const [[row]] = await pool.query(
      `SELECT * FROM announcements WHERE announcement_id=?`,
      [id]
    );
    if (!row) return res.status(404).json({ error: 'not found' });

    const [images] = await pool.query(
      `SELECT image_id, image_url
       FROM images
       WHERE ref_type='announcement'
       AND ref_id=?`,
      [id]
    );

    res.json({ ok: true, announcement: row, images });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* CREATE */
router.post('/', upload.array('images', 10), async (req, res) => {
  try {
    const { title, content, created_by } = req.body;

    const [r] = await pool.query(
      `INSERT INTO announcements (title,content,created_by,created_at)
       VALUES (?,?,?,NOW())`,
      [title, content, created_by]
    );

    const id = r.insertId;

    if (req.files?.length) {
      const values = req.files.map(f => [
        'announcement',
        id,
        '/uploads/' + f.filename
      ]);

      await pool.query(
        `INSERT INTO images (ref_type,ref_id,image_url)
         VALUES ?`,
        [values]
      );
    }

    res.json({ ok: true, announcement_id: id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* UPDATE */
router.put('/:id', upload.array('images', 10), async (req, res) => {
  try {
    const id = req.params.id;
    const { title, content } = req.body;

    await pool.query(
      `UPDATE announcements SET title=?,content=? WHERE announcement_id=?`,
      [title, content, id]
    );

    if (req.files?.length) {
      const values = req.files.map(f => [
        'announcement',
        id,
        '/uploads/' + f.filename
      ]);

      await pool.query(
        `INSERT INTO images (ref_type,ref_id,image_url)
         VALUES ?`,
        [values]
      );
    }

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* DELETE */
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;

    const [images] = await pool.query(
      `SELECT image_url FROM images
       WHERE ref_type='announcement'
       AND ref_id=?`,
      [id]
    );

    await pool.query(
      `DELETE FROM announcements WHERE announcement_id=?`,
      [id]
    );

    images.forEach(img => {
      const p = path.join(UPLOAD_DIR, path.basename(img.image_url));
      if (fs.existsSync(p)) fs.unlinkSync(p);
    });

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
