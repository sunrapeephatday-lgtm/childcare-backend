// backend/routes/files.routes.js
const express = require('express');
const path = require('path');
const router = express.Router();

// ใช้ path แบบ relative จากไฟล์นี้ไปยัง backend/data/carechild_db.sql
const UPLOADED_SQL = path.resolve(__dirname, '..', 'data', 'carechild_db.sql');

router.get('/sql', (req, res) => {
  res.download(UPLOADED_SQL, 'carechild_db.sql', (err) => {
    if (err) {
      console.error('download error', err);
      res.status(500).send('Cannot download file');
    }
  });
});

module.exports = router;
