const express = require("express");
const router = express.Router();
const pool = require("../db");
const { authMiddleware, permit } = require("../middlewares/auth");

/* CREATE / UPDATE */
router.post(
  "/",
  authMiddleware,
  permit("admin"),
  async (req, res) => {
    try {
      const {
        menu_date,
        main_menu,
        stir_menu,
        soup_menu,
        fried_menu,
        dessert_menu,
        note
      } = req.body;

      const teacher_id = req.user.teacher_id || null;

      const [exists] = await pool.query(
        "SELECT daily_menu_id FROM daily_menu WHERE menu_date = ?",
        [menu_date]
      );

      if (exists.length > 0) {
        await pool.query(
          `UPDATE daily_menu SET
            main_menu = ?, stir_menu = ?, soup_menu = ?,
            fried_menu = ?, dessert_menu = ?, note = ?,
            teacher_id = ?, updated_at = NOW()
           WHERE menu_date = ?`,
          [
            main_menu,
            stir_menu,
            soup_menu,
            fried_menu,
            dessert_menu,
            note,
            teacher_id,
            menu_date
          ]
        );
      } else {
        await pool.query(
          `INSERT INTO daily_menu
           (menu_date, main_menu, stir_menu, soup_menu, fried_menu, dessert_menu, note, teacher_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            menu_date,
            main_menu,
            stir_menu,
            soup_menu,
            fried_menu,
            dessert_menu,
            note,
            teacher_id
          ]
        );
      }

      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "cannot save daily menu" });
    }
  }
);

/* GET */
router.get("/", async (req, res) => {
  const [rows] = await pool.query(
    "SELECT * FROM daily_menu ORDER BY menu_date DESC"
  );
  res.json(rows);
});

/* DELETE */
router.delete("/:id", authMiddleware, permit("admin"), async (req, res) => {
  await pool.query("DELETE FROM daily_menu WHERE daily_menu_id = ?", [
    req.params.id
  ]);
  res.json({ ok: true });
});

module.exports = router;
