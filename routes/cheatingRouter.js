const router = require('express').Router();
const authMiddleware = require('../middleware/authMiddleware');
const CheatingLog = require('../models/cheatingLogModel');

router.post('/log-cheating', authMiddleware, async (req, res) => {
  try {
    const { exam, type, detail, timestamp } = req.body;

    const newCheatingLog = new CheatingLog({
      user: req.body.userId,
      exam,
      type,
      detail,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    });

    await newCheatingLog.save();

    res.send({
      message: 'Cheating event logged successfully',
      success: true,
    });
  } catch (error) {
    res.status(500).send({
      message: error.message,
      data: error,
      success: false,
    });
  }
});

module.exports = router;
