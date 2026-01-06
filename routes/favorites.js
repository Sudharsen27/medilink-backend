

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  addFavorite,
  removeFavorite,
  isFavorite,
  getUserFavorites,
  getFavoriteCount,
} = require('../models/favorites');

/* ======================================================
   Favorites Routes
   NOTE:
   - User ID is ALWAYS read from JWT (req.user.id)
   - Route order matters: static routes before params
====================================================== */

/**
 * @route   GET /api/favorites
 * @desc    Get all favorite doctors for logged-in user
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const favorites = await getUserFavorites(userId);
    return res.status(200).json(favorites);
  } catch (error) {
    console.error('❌ GET /api/favorites:', error);
    return res.status(500).json({
      message: 'Failed to fetch favorites',
    });
  }
});

/**
 * @route   GET /api/favorites/count
 * @desc    Get favorite doctors count
 * @access  Private
 */
router.get('/count', protect, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const count = await getFavoriteCount(userId);
    return res.status(200).json({ count });
  } catch (error) {
    console.error('❌ GET /api/favorites/count:', error);
    return res.status(500).json({
      message: 'Failed to fetch favorite count',
    });
  }
});

/**
 * @route   GET /api/favorites/check/:doctorId
 * @desc    Check if doctor is favorited
 * @access  Private
 */
router.get('/check/:doctorId', protect, async (req, res) => {
  try {
    const userId = req.user?.id;
    const doctorId = Number(req.params.doctorId);

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!doctorId || Number.isNaN(doctorId)) {
      return res.status(400).json({ message: 'Invalid doctor ID' });
    }

    const favorite = await isFavorite(userId, doctorId);
    return res.status(200).json({ isFavorite: Boolean(favorite) });
  } catch (error) {
    console.error('❌ GET /api/favorites/check/:doctorId:', error);
    return res.status(500).json({
      message: 'Failed to check favorite status',
    });
  }
});

/**
 * @route   POST /api/favorites/:doctorId
 * @desc    Add doctor to favorites
 * @access  Private
 */
router.post('/:doctorId', protect, async (req, res) => {
  try {
    const userId = req.user?.id;
    const doctorId = Number(req.params.doctorId);

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!doctorId || Number.isNaN(doctorId)) {
      return res.status(400).json({ message: 'Invalid doctor ID' });
    }

    const favorite = await addFavorite(userId, doctorId);

    return res.status(201).json({
      message: 'Doctor added to favorites',
      favorite,
    });
  } catch (error) {
    console.error('❌ POST /api/favorites/:doctorId:', error);

    if (error.message === 'Doctor is already in favorites') {
      return res.status(409).json({ message: error.message });
    }

    return res.status(500).json({
      message: 'Failed to add favorite',
    });
  }
});

/**
 * @route   DELETE /api/favorites/:doctorId
 * @desc    Remove doctor from favorites
 * @access  Private
 */
router.delete('/:doctorId', protect, async (req, res) => {
  try {
    const userId = req.user?.id;
    const doctorId = Number(req.params.doctorId);

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!doctorId || Number.isNaN(doctorId)) {
      return res.status(400).json({ message: 'Invalid doctor ID' });
    }

    const removed = await removeFavorite(userId, doctorId);

    if (!removed) {
      return res.status(404).json({ message: 'Favorite not found' });
    }

    return res.status(200).json({
      message: 'Doctor removed from favorites',
      removed,
    });
  } catch (error) {
    console.error('❌ DELETE /api/favorites/:doctorId:', error);
    return res.status(500).json({
      message: 'Failed to remove favorite',
    });
  }
});

module.exports = router;
