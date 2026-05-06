const express = require('express');
const router = express.Router();
const pool = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

/* ===== upload config ===== */
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safe = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
    cb(null, safe);
  }
});
const upload = multer({ storage });

/* ======================
   GET list users
====================== */
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
 SELECT 
  u.user_id,
  u.username,
  u.email,
  u.role,
  u.center_id,
  u.created_at,
  t.classroom_id,

  COALESCE(t.prefix, p.prefix) AS prefix,
  COALESCE(t.first_name, p.first_name) AS first_name,
  COALESCE(t.last_name, p.last_name) AS last_name,
  COALESCE(t.phone, p.phone) AS phone

FROM users u

LEFT JOIN teachers t
  ON u.user_id = t.user_id

LEFT JOIN parents p
  ON u.user_id = p.user_id

ORDER BY u.created_at DESC
`);
    res.json({ rows });
  } catch (err) {
    console.error('GET /api/admin/users error:', err);
    res.status(500).json({ error: err.message || 'internal error' });
  }
});

/* ======================
   GET single user profile
====================== */
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    const [[user]] = await pool.query(
  `
  SELECT
    u.user_id,
    u.username,
    u.role,
    u.created_at,

    COALESCE(t.prefix, p.prefix) AS prefix,
    COALESCE(t.first_name, p.first_name) AS first_name,
    COALESCE(t.last_name, p.last_name) AS last_name

  FROM users u

  LEFT JOIN teachers t
    ON t.user_id = u.user_id

  LEFT JOIN parents p
    ON p.user_id = u.user_id

  WHERE u.user_id = ?
  `,
  [id]
);

    if (!user) {
      return res.status(404).json({ error: 'not found' });
    }

    const [[img]] = await pool.query(
      "SELECT image_url FROM images WHERE ref_type='user' AND ref_id=?",
      [id]
    );

    user.avatar = img?.image_url || null;

    res.json(user);
  } catch (err) {
    console.error('GET /api/admin/users/:id error:', err);
    res.status(500).json({ error: err.message || 'internal error' });
  }
});

/* ======================
   GET centers
====================== */
router.get('/centers/list', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT center_id, name FROM centers ORDER BY name'
    );
    res.json({ rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* ======================
   POST create user
====================== */
router.post('/', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const {
      username,
      password,
      role,
      center_id,
      classroom_id,
      prefix,
      first_name,
      last_name,
      phone,
      email
    } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ error: 'username password role required' });
    }

    await conn.beginTransaction();

    // check username
    const [exists] = await conn.query(
      'SELECT user_id FROM users WHERE username=?',
      [username]
    );

    if (exists.length) {
      await conn.rollback();
      return res.status(400).json({ error: 'username already exists' });
    }

    // create login
    const [u] = await conn.query(
      'INSERT INTO users (username,email,password,role,center_id,created_at) VALUES (?,?,?,?,?,NOW())',
      [username, email, password, role, center_id || null]
    );

    const user_id = u.insertId;

    // create teacher profile (เฉพาะ role teacher)
    if (role === 'teacher') {
      await conn.query(
  `INSERT INTO teachers
(user_id, center_id, classroom_id, prefix, first_name, last_name, phone, created_at)
VALUES (?,?,?,?,?,?,?,NOW())`,
  [
    user_id,
    center_id || null,
    classroom_id || null,
    prefix || null,
    first_name || null,
    last_name || null,
    phone || null
  ]
);
    }

    await conn.commit();

    res.json({ ok: true, user_id });

  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

/* ======================
   PUT update user
====================== */
router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const {
  username,
  password,
  role,
  center_id,
  classroom_id,
  prefix,
  first_name,
  last_name,
  phone,
  email
} = req.body;

if (password) {
  await pool.query(
    `UPDATE users
     SET username=?, password=?, role=?, email=?, center_id=?
     WHERE user_id=?`,
    [username, password, role, email, center_id || null, id]
  );
} else {
  await pool.query(
    `UPDATE users
     SET username=?, role=?, email=?, center_id=?
     WHERE user_id=?`,
    [username, role, email, center_id || null, id]
  );
}

await pool.query(
  `UPDATE teachers
SET center_id=?, classroom_id=?, prefix=?, first_name=?, last_name=?, phone=?
WHERE user_id=?`,
  [
    center_id || null,
    classroom_id || null,
    prefix || null,
    first_name || null,
    last_name || null,
    phone || null,
    id
  ]
);

    res.json({ ok: true });
  } catch (err) {
    console.error('PUT /api/admin/users/:id error:', err);
    res.status(500).json({ error: err.message || 'internal error' });
  }
});

/* ======================
   DELETE user
====================== */
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    await pool.query('DELETE FROM users WHERE user_id = ?', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/admin/users/:id error:', err);
    res.status(500).json({ error: err.message || 'internal error' });
  }
});

/* ======================
   POST upload avatar
====================== */
router.post('/:id/avatar', upload.single('avatar'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const url = '/uploads/' + req.file.filename;

    // ลบรูปเก่า
    await pool.query(
      "DELETE FROM images WHERE ref_type='user' AND ref_id=?",
      [id]
    );

    // ใส่รูปใหม่
    await pool.query(
      "INSERT INTO images (ref_type, ref_id, image_url, created_at) VALUES ('user', ?, ?, NOW())",
      [id, url]
    );

    res.json({ ok: true, image_url: url });
  } catch (err) {
    console.error('POST /api/admin/users/:id/avatar error:', err);
    res.status(500).json({ error: err.message || 'internal error' });
  }
});

module.exports = router;
