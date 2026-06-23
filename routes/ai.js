const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const handleValidationErrors = require('../middleware/validation');
const { chat, isConfigured } = require('../services/ai.service');

const router = express.Router();

const rateLimitMap = new Map();
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60 * 60 * 1000;

function checkRateLimit(userId) {
  const now = Date.now();
  const entry = rateLimitMap.get(userId) || { count: 0, resetAt: now + RATE_WINDOW_MS };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + RATE_WINDOW_MS;
  }
  entry.count += 1;
  rateLimitMap.set(userId, entry);
  return entry.count <= RATE_LIMIT;
}

router.use(protect);

router.get(
  '/status',
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: {
        configured: isConfigured(),
        provider: isConfigured() ? 'gemini' : 'fallback',
        model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
      },
    });
  })
);

router.post(
  '/chat',
  [
    body('messages')
      .isArray({ min: 1, max: 20 })
      .withMessage('messages must be an array with 1-20 items'),
    body('messages.*.role')
      .isIn(['user', 'assistant'])
      .withMessage('message role must be user or assistant'),
    body('messages.*.content')
      .isString()
      .trim()
      .isLength({ min: 1, max: 2000 })
      .withMessage('message content required (max 2000 chars)'),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    if (!checkRateLimit(req.user.id)) {
      return res.status(429).json({
        success: false,
        message: 'Too many AI requests. Please try again in an hour.',
      });
    }

    const result = await chat(req.user.id, req.body.messages);

    res.json({
      success: true,
      data: {
        reply: result.reply,
        urgency: result.urgency || 'none',
        suggested_specialty: result.suggested_specialty || null,
        actions: result.actions || [],
        provider: result.provider,
        disclaimer:
          'AI guidance is for informational purposes only and is not medical advice. For emergencies, call 108.',
      },
    });
  })
);

module.exports = router;
