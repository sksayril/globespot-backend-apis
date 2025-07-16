const mongoose = require('mongoose');

const userNotificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    notification: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Notification',
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index to ensure unique user-notification pairs
userNotificationSchema.index({ user: 1, notification: 1 }, { unique: true });

// Method to mark as read
userNotificationSchema.methods.markAsRead = function() {
    this.isRead = true;
    this.readAt = Date.now();
    return this.save();
};

module.exports = mongoose.model('UserNotification', userNotificationSchema); 