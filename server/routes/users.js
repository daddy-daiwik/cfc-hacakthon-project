const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authenticate = require('../middleware/authMiddleware');

// Get User Profile
router.get('/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username })
            .select('-passwordHash')
            .populate('followers', 'username')
            .populate('following', 'username');

        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Update Profile
router.put('/profile', authenticate, async (req, res) => {
    try {
        const { bio, avatarUrl } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (bio !== undefined) user.bio = bio;
        if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

        await user.save();

        res.json({
            id: user._id,
            username: user.username,
            bio: user.bio,
            avatarUrl: user.avatarUrl,
            isPro: user.isPro
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
