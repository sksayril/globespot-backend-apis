const express = require('express');
const router = express.Router();
const Notification = require('../models/notification.model');
const UserNotification = require('../models/userNotification.model');
const { auth } = require('../middleware/auth');

// Get user's notifications
router.get('/my-notifications', auth, async (req, res) => {
    try {
        const { page = 1, limit = 20, isRead, type } = req.query;
        const skip = (page - 1) * limit;

        let query = { user: req.user._id };
        if (isRead !== undefined) query.isRead = isRead === 'true';

        const userNotifications = await UserNotification.find(query)
            .populate({
                path: 'notification',
                match: { isActive: true },
                populate: {
                    path: 'createdBy',
                    select: 'name email'
                }
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Filter out notifications that are inactive or expired
        const validNotifications = userNotifications.filter(un => {
            if (!un.notification) return false;
            if (!un.notification.isActive) return false;
            if (un.notification.expiresAt && new Date() > un.notification.expiresAt) return false;
            return true;
        });

        const total = await UserNotification.countDocuments(query);

        res.json({
            success: true,
            data: validNotifications,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications',
            error: error.message
        });
    }
});

// Get unread notifications count
router.get('/unread-count', auth, async (req, res) => {
    try {
        const unreadCount = await UserNotification.countDocuments({
            user: req.user._id,
            isRead: false
        });

        res.json({
            success: true,
            data: { unreadCount }
        });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get unread count',
            error: error.message
        });
    }
});

// Mark notification as read
router.put('/mark-read/:notificationId', auth, async (req, res) => {
    try {
        const { notificationId } = req.params;

        const userNotification = await UserNotification.findOne({
            user: req.user._id,
            notification: notificationId
        });

        if (!userNotification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        await userNotification.markAsRead();

        res.json({
            success: true,
            message: 'Notification marked as read'
        });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notification as read',
            error: error.message
        });
    }
});

// Mark all notifications as read
router.put('/mark-all-read', auth, async (req, res) => {
    try {
        await UserNotification.updateMany(
            { user: req.user._id, isRead: false },
            { isRead: true, readAt: Date.now() }
        );

        res.json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark all notifications as read',
            error: error.message
        });
    }
});

// Get specific notification details
router.get('/notification/:notificationId', auth, async (req, res) => {
    try {
        const { notificationId } = req.params;

        const userNotification = await UserNotification.findOne({
            user: req.user._id,
            notification: notificationId
        }).populate({
            path: 'notification',
            populate: {
                path: 'createdBy',
                select: 'name email'
            }
        });

        if (!userNotification || !userNotification.notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        // Check if notification is active and not expired
        if (!userNotification.notification.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Notification is not active'
            });
        }

        if (userNotification.notification.expiresAt && new Date() > userNotification.notification.expiresAt) {
            return res.status(404).json({
                success: false,
                message: 'Notification has expired'
            });
        }

        res.json({
            success: true,
            data: userNotification
        });
    } catch (error) {
        console.error('Get notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notification',
            error: error.message
        });
    }
});

// Delete user notification (remove from user's list)
router.delete('/notification/:notificationId', auth, async (req, res) => {
    try {
        const { notificationId } = req.params;

        const result = await UserNotification.deleteOne({
            user: req.user._id,
            notification: notificationId
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.json({
            success: true,
            message: 'Notification removed successfully'
        });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove notification',
            error: error.message
        });
    }
});

// Get notification preferences (placeholder for future implementation)
router.get('/preferences', auth, async (req, res) => {
    try {
        // This is a placeholder for future notification preferences
        // You can extend this to store user notification preferences
        res.json({
            success: true,
            data: {
                emailNotifications: true,
                pushNotifications: true,
                smsNotifications: false,
                notificationTypes: ['info', 'success', 'warning', 'error']
            }
        });
    } catch (error) {
        console.error('Get preferences error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get preferences',
            error: error.message
        });
    }
});

module.exports = router; 