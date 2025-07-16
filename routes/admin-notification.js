const express = require('express');
const router = express.Router();
const Notification = require('../models/notification.model');
const UserNotification = require('../models/userNotification.model');
const User = require('../models/user.model');
const { auth } = require('../middleware/auth');

// Middleware to check if user is admin
const adminAuth = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Admin access required'
        });
    }
    next();
};

// Create and send notification
router.post('/send', auth, adminAuth, async (req, res) => {
    try {
        const {
            title,
            content,
            color = '#007bff',
            type = 'info',
            priority = 'medium',
            targetUsers = 'all',
            specificUsers = [],
            targetRole = 'all',
            expiresAt = null
        } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                success: false,
                message: 'Title and content are required'
            });
        }

        // Create notification
        const notification = new Notification({
            title,
            content,
            color,
            type,
            priority,
            targetUsers,
            specificUsers: specificUsers.length > 0 ? specificUsers : [],
            targetRole,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            createdBy: req.user._id
        });

        await notification.save();

        // Determine target users
        let targetUserIds = [];

        if (targetUsers === 'all') {
            const users = await User.find({ role: targetRole === 'all' ? { $in: ['user', 'admin'] } : targetRole });
            targetUserIds = users.map(user => user._id);
        } else if (targetUsers === 'specific' && specificUsers.length > 0) {
            targetUserIds = specificUsers;
        } else if (targetUsers === 'role_based') {
            const users = await User.find({ role: targetRole });
            targetUserIds = users.map(user => user._id);
        }

        // Create user notifications
        const userNotifications = targetUserIds.map(userId => ({
            user: userId,
            notification: notification._id
        }));

        if (userNotifications.length > 0) {
            await UserNotification.insertMany(userNotifications);
        }

        const populatedNotification = await Notification.findById(notification._id)
            .populate('createdBy', 'name email')
            .populate('specificUsers', 'name email');

        res.status(201).json({
            success: true,
            message: `Notification sent to ${targetUserIds.length} users successfully`,
            data: populatedNotification,
            targetCount: targetUserIds.length
        });
    } catch (error) {
        console.error('Send notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send notification',
            error: error.message
        });
    }
});

// Get all notifications (admin)
router.get('/notifications', auth, adminAuth, async (req, res) => {
    try {
        const { page = 1, limit = 20, type, priority, isActive } = req.query;
        const skip = (page - 1) * limit;

        let query = {};
        if (type) query.type = type;
        if (priority) query.priority = priority;
        if (isActive !== undefined) query.isActive = isActive === 'true';

        const notifications = await Notification.find(query)
            .populate('createdBy', 'name email')
            .populate('specificUsers', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Notification.countDocuments(query);

        // Get statistics
        const stats = await Notification.aggregate([
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 }
                }
            }
        ]);

        const statsMap = {};
        stats.forEach(stat => {
            statsMap[stat._id] = stat.count;
        });

        res.json({
            success: true,
            data: notifications,
            stats: {
                info: statsMap.info || 0,
                success: statsMap.success || 0,
                warning: statsMap.warning || 0,
                error: statsMap.error || 0,
                custom: statsMap.custom || 0,
                total: total
            },
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

// Get specific notification (admin)
router.get('/notification/:notificationId', auth, adminAuth, async (req, res) => {
    try {
        const { notificationId } = req.params;

        const notification = await Notification.findById(notificationId)
            .populate('createdBy', 'name email')
            .populate('specificUsers', 'name email');

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        // Get user notification stats
        const userNotifications = await UserNotification.find({ notification: notificationId })
            .populate('user', 'name email');

        const readCount = userNotifications.filter(un => un.isRead).length;
        const totalCount = userNotifications.length;

        res.json({
            success: true,
            data: {
                ...notification.toObject(),
                stats: {
                    totalUsers: totalCount,
                    readUsers: readCount,
                    unreadUsers: totalCount - readCount
                },
                userNotifications
            }
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

// Update notification
router.put('/notification/:notificationId', auth, adminAuth, async (req, res) => {
    try {
        const { notificationId } = req.params;
        const {
            title,
            content,
            color,
            type,
            priority,
            isActive,
            expiresAt
        } = req.body;

        const notification = await Notification.findById(notificationId);
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        // Update fields
        if (title) notification.title = title;
        if (content) notification.content = content;
        if (color) notification.color = color;
        if (type) notification.type = type;
        if (priority) notification.priority = priority;
        if (isActive !== undefined) notification.isActive = isActive;
        if (expiresAt) notification.expiresAt = new Date(expiresAt);

        await notification.save();

        const updatedNotification = await Notification.findById(notificationId)
            .populate('createdBy', 'name email')
            .populate('specificUsers', 'name email');

        res.json({
            success: true,
            message: 'Notification updated successfully',
            data: updatedNotification
        });
    } catch (error) {
        console.error('Update notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update notification',
            error: error.message
        });
    }
});

// Delete notification
router.delete('/notification/:notificationId', auth, adminAuth, async (req, res) => {
    try {
        const { notificationId } = req.params;

        const notification = await Notification.findById(notificationId);
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        // Delete user notifications first
        await UserNotification.deleteMany({ notification: notificationId });

        // Delete the notification
        await Notification.findByIdAndDelete(notificationId);

        res.json({
            success: true,
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete notification',
            error: error.message
        });
    }
});

// Get notification statistics
router.get('/stats', auth, adminAuth, async (req, res) => {
    try {
        const totalNotifications = await Notification.countDocuments();
        const activeNotifications = await Notification.countDocuments({ isActive: true });
        const expiredNotifications = await Notification.countDocuments({
            expiresAt: { $lt: new Date() }
        });

        // Get notifications by type
        const typeStats = await Notification.aggregate([
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get notifications by priority
        const priorityStats = await Notification.aggregate([
            {
                $group: {
                    _id: '$priority',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get recent notifications
        const recentNotifications = await Notification.find()
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            success: true,
            data: {
                totalNotifications,
                activeNotifications,
                expiredNotifications,
                typeStats,
                priorityStats,
                recentNotifications
            }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get statistics',
            error: error.message
        });
    }
});

// Get users for targeting
router.get('/users', auth, adminAuth, async (req, res) => {
    try {
        const { role, search } = req.query;
        let query = {};

        if (role && role !== 'all') {
            query.role = role;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .select('name email phone role')
            .sort({ name: 1 })
            .limit(100);

        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get users',
            error: error.message
        });
    }
});

module.exports = router; 