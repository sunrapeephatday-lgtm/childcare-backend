const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET all centers
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM centers ORDER BY created_at DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE center
router.post("/", async (req, res) => {
  const {
    school_id,
    name,
    district,
    province,
    phone,
    email,
    LGO,
    ORG_code
  } = req.body;
if (!req.body.name || !req.body.school_id) {
  return res.status(400).json({ error: "กรอกข้อมูลให้ครบ" });
}
  try {
    const [result] = await pool.query(
      `
      INSERT INTO centers
      (school_id, name, district, province, phone, email, LGO, ORG_code)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [school_id, name, district, province, phone, email, LGO, ORG_code]
    );

    res.json({ ok: true, center_id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE center
router.put("/:id", async (req, res) => {
  const id = req.params.id;
  const {
    school_id,
    name,
    district,
    province,
    phone,
    email,
    LGO,
    ORG_code
  } = req.body;
if (!req.body.name || !req.body.school_id) {
  return res.status(400).json({ error: "ห้ามบันทึกข้อมูลว่าง" });
}
  try {
    await pool.query(
      `
      UPDATE centers SET
      school_id=?, name=?, district=?, province=?,
      phone=?, email=?, LGO=?, ORG_code=?
      WHERE center_id=?
      `,
      [school_id, name, district, province, phone, email, LGO, ORG_code, id]
    );

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE center
router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM centers WHERE center_id=?", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
