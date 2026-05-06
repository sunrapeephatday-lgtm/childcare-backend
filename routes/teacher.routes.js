const express = require('express');
const router = express.Router();
const pool = require('../db.js');

const { authMiddleware, permit } = require('../middlewares/auth');
const ExcelJS = require('exceljs');
const { Document, Packer, Paragraph, TextRun } = require('docx');

// POST /api/teacher/attendance
router.post('/attendance', authMiddleware, permit('teacher'), async (req, res) => {
  const records = req.body.records || [];
  try {
    // basic: insert into attendance table (child_id, date, status, recorded_by)
    const promises = records.map(r => pool.query(
      `INSERT INTO attendance (child_id, att_date, status, recorded_by, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [r.child_id, r.date, r.status, req.user.id]
    ));
    await Promise.all(promises);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'save attendance failed' });
  }
});

// GET /api/teacher/attendance/export?date=YYYY-MM-DD
router.get('/attendance/export', authMiddleware, permit('teacher'), async (req, res) => {
  const date = req.query.date;
  try {
    const [rows] = await pool.query(
      `SELECT a.*, c.first_name as child_name FROM attendance a
       JOIN children c ON a.child_id = c.child_id WHERE a.att_date = ? AND a.recorded_by = ?`,
      [date, req.user.id]
    );

    // Excel
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Attendance');
    ws.addRow(['Child', 'Date', 'Status', 'RecordedBy']);
    rows.forEach(r => {
      ws.addRow([r.child_name, r.att_date, r.status, req.user.username || req.user.id]);
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=attendance-${date}.xlsx`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'export failed' });
  }
});

// Optional: Word export (simple)
router.get('/attendance/export-word', authMiddleware, permit('teacher'), async (req, res) => {
  const date = req.query.date;
  try {
    const [rows] = await pool.query(
      `SELECT a.*, c.first_name as child_name FROM attendance a
       JOIN children c ON a.child_id = c.child_id WHERE a.att_date = ? AND a.recorded_by = ?`,
      [date, req.user.id]
    );

    const doc = new Document();
    doc.addSection({
      children: [
        new Paragraph({ children: [ new TextRun({ text: `Attendance report ${date}`, bold: true }) ] }),
        ...rows.map(r => new Paragraph(`${r.child_name} — ${r.status}`))
      ]
    });

    const b = await Packer.toBuffer(doc);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename=attendance-${date}.docx`);
    res.send(b);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'export word failed' });
  }
});

module.exports = router;
