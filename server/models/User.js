const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 2
    },
    passwordHash: {
        type: String,
        required: true
    },
    bio: {
        type: String,
        default: '',
        maxlength: 160
    },
    avatarUrl: {
        type: String,
        default: ''
    },
    isPro: {
        type: Boolean,
        default: false
    },
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);
