const router = require("express").Router();
const pool = require("../config/db");
const { protect } = require("../middleware/auth");

router.get("/", protect, async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM dependents WHERE user_id=$1",
    [req.user.id]
  );
  res.json(result.rows);
});

router.post("/", protect, async (req, res) => {
  const { name, age, relationship } = req.body;

  const result = await pool.query(
    `INSERT INTO dependents (user_id, name, age, relationship)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.user.id, name, age, relationship]
  );

  res.status(201).json(result.rows[0]);
});

module.exports = router;
