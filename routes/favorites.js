
// routes/favorites.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  addFavorite,
  removeFavorite,
  isFavorite,
  getUserFavorites,
  getFavoriteCount,
} = require('../models/favorites');

/**
 * @route   POST /api/favorites/:doctorId
 * @desc    Add a doctor to the user's favorites
 * @access  Private
 */
router.post('/:doctorId', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const doctorId = parseInt(req.params.doctorId);

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: user not found' });
    }

    if (isNaN(doctorId)) {
      return res.status(400).json({ message: 'Invalid doctor ID' });
    }

    const favorite = await addFavorite(userId, doctorId);
    return res.status(201).json({
      message: 'Doctor added to favorites successfully',
      favorite,
    });
  } catch (err) {
    console.error('❌ Error in POST /api/favorites/:doctorId:', err.message);

    if (err.message === 'Doctor is already in favorites') {
      return res.status(409).json({ message: err.message });
    }

    return res.status(500).json({ message: 'Server error while adding favorite' });
  }
});

/**
 * @route   DELETE /api/favorites/:doctorId
 * @desc    Remove a doctor from the user's favorites
 * @access  Private
 */
router.delete('/:doctorId', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const doctorId = parseInt(req.params.doctorId);

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: user not found' });
    }

    if (isNaN(doctorId)) {
      return res.status(400).json({ message: 'Invalid doctor ID' });
    }

    const result = await removeFavorite(userId, doctorId);

    if (!result) {
      return res.status(404).json({ message: 'Favorite not found' });
    }

    return res.json({
      message: 'Doctor removed from favorites successfully',
      removed: result,
    });
  } catch (err) {
    console.error('❌ Error in DELETE /api/favorites/:doctorId:', err.message);
    return res.status(500).json({ message: 'Server error while removing favorite' });
  }
});

/**
 * @route   GET /api/favorites/check/:doctorId
 * @desc    Check if a doctor is in the user's favorites
 * @access  Private
 */
router.get('/check/:doctorId', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const doctorId = parseInt(req.params.doctorId);

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: user not found' });
    }

    if (isNaN(doctorId)) {
      return res.status(400).json({ message: 'Invalid doctor ID' });
    }

    const favorite = await isFavorite(userId, doctorId);
    return res.json({ isFavorite: !!favorite });
  } catch (err) {
    console.error('❌ Error in GET /api/favorites/check/:doctorId:', err.message);
    return res.status(500).json({ message: 'Server error while checking favorite status' });
  }
});

/**
 * @route   GET /api/favorites
 * @desc    Get all favorite doctors for the logged-in user
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: user not found' });
    }

    const favorites = await getUserFavorites(userId);
    return res.json(favorites);
  } catch (err) {
    console.error('❌ Error in GET /api/favorites:', err.message);
    return res.status(500).json({ message: 'Server error while fetching favorites' });
  }
});

/**
 * @route   GET /api/favorites/count
 * @desc    Get total count of user’s favorite doctors
 * @access  Private
 */
router.get('/count', auth, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: user not found' });
    }

    const count = await getFavoriteCount(userId);
    return res.json({ count });
  } catch (err) {
    console.error('❌ Error in GET /api/favorites/count:', err.message);
    return res.status(500).json({ message: 'Server error while counting favorites' });
  }
});

module.exports = router;
