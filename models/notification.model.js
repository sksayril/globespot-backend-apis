const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    color: {
        type: String,
        default: '#007bff', // Default blue color
        trim: true
    },
    type: {
        type: String,
        enum: ['info', 'success', 'warning', 'error', 'custom'],
        default: 'info'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    targetUsers: {
        type: String,
        enum: ['all', 'specific', 'role_based'],
        default: 'all'
    },
    specificUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    targetRole: {
        type: String,
        enum: ['user', 'admin', 'all'],
        default: 'all'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    expiresAt: {
        type: Date,
        default: null
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
notificationSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Method to check if notification is expired
notificationSchema.methods.isExpired = function() {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
};

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
    this.isRead = true;
    return this.save();
};

module.exports = mongoose.model('Notification', notificationSchema); 