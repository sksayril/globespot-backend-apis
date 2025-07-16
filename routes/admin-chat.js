const express = require('express');
const router = express.Router();
const Chat = require('../models/chat.model');
const User = require('../models/user.model');
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');

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

// Get all support tickets (admin)
router.get('/tickets', auth, adminAuth, async (req, res) => {
    try {
        const { page = 1, limit = 20, status, priority, category, assignedTo } = req.query;
        const skip = (page - 1) * limit;

        let query = {};
        
        if (status) query.status = status;
        if (priority) query.priority = priority;
        if (category) query.category = category;
        if (assignedTo) query.admin = assignedTo;

        const tickets = await Chat.find(query)
            .populate('user', 'name email phone')
            .populate('admin', 'name email')
            .sort({ lastMessage: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Chat.countDocuments(query);

        // Get statistics
        const stats = await Chat.aggregate([
            {
                $group: {
                    _id: '$status',
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
            data: tickets,
            stats: {
                open: statsMap.open || 0,
                in_progress: statsMap.in_progress || 0,
                resolved: statsMap.resolved || 0,
                closed: statsMap.closed || 0,
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
        console.error('Get tickets error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tickets',
            error: error.message
        });
    }
});

// Get specific ticket (admin)
router.get('/ticket/:ticketId', auth, adminAuth, async (req, res) => {
    try {
        const { ticketId } = req.params;

        const chat = await Chat.findById(ticketId)
            .populate('user', 'name email phone')
            .populate('admin', 'name email')
            .populate('messages.sender', 'name email');

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }

        // Mark messages as read for admin
        await chat.markAsRead(req.user._id);

        res.json({
            success: true,
            data: chat
        });
    } catch (error) {
        console.error('Get ticket error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch ticket',
            error: error.message
        });
    }
});

// Assign admin to ticket
router.put('/ticket/:ticketId/assign', auth, adminAuth, async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { adminId } = req.body;

        if (!adminId) {
            return res.status(400).json({
                success: false,
                message: 'Admin ID is required'
            });
        }

        const admin = await User.findById(adminId);
        if (!admin || admin.role !== 'admin') {
            return res.status(400).json({
                success: false,
                message: 'Invalid admin ID'
            });
        }

        const chat = await Chat.findById(ticketId);
        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }

        chat.admin = adminId;
        chat.status = 'in_progress';
        await chat.save();

        const updatedChat = await Chat.findById(ticketId)
            .populate('user', 'name email phone')
            .populate('admin', 'name email')
            .populate('messages.sender', 'name email');

        res.json({
            success: true,
            message: 'Admin assigned successfully',
            data: updatedChat
        });
    } catch (error) {
        console.error('Assign admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to assign admin',
            error: error.message
        });
    }
});

// Send message as admin
router.post('/ticket/:ticketId/message', auth, adminAuth, upload.single('file'), async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { message, messageType = 'text' } = req.body;

        if (!message && !req.file) {
            return res.status(400).json({
                success: false,
                message: 'Message content or file is required'
            });
        }

        const chat = await Chat.findById(ticketId);
        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }

        let content = message;
        let fileUrl = null;

        if (req.file) {
            fileUrl = `/uploads/${req.file.filename}`;
            if (!content) {
                content = `File: ${req.file.originalname}`;
            }
        }

        await chat.addMessage(req.user._id, 'admin', content, messageType, fileUrl);

        const updatedChat = await Chat.findById(ticketId)
            .populate('user', 'name email phone')
            .populate('admin', 'name email')
            .populate('messages.sender', 'name email');

        res.json({
            success: true,
            message: 'Message sent successfully',
            data: updatedChat
        });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send message',
            error: error.message
        });
    }
});

// Update ticket status
router.put('/ticket/:ticketId/status', auth, adminAuth, async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { status } = req.body;

        if (!status || !['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Valid status is required'
            });
        }

        const chat = await Chat.findById(ticketId);
        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }

        chat.status = status;
        await chat.save();

        res.json({
            success: true,
            message: 'Ticket status updated successfully',
            data: chat
        });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update ticket status',
            error: error.message
        });
    }
});

// Update ticket priority
router.put('/ticket/:ticketId/priority', auth, adminAuth, async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { priority } = req.body;

        if (!priority || !['low', 'medium', 'high', 'urgent'].includes(priority)) {
            return res.status(400).json({
                success: false,
                message: 'Valid priority is required'
            });
        }

        const chat = await Chat.findById(ticketId);
        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }

        chat.priority = priority;
        await chat.save();

        res.json({
            success: true,
            message: 'Ticket priority updated successfully',
            data: chat
        });
    } catch (error) {
        console.error('Update priority error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update ticket priority',
            error: error.message
        });
    }
});

// Get admin statistics
router.get('/stats', auth, adminAuth, async (req, res) => {
    try {
        const totalTickets = await Chat.countDocuments();
        const openTickets = await Chat.countDocuments({ status: 'open' });
        const inProgressTickets = await Chat.countDocuments({ status: 'in_progress' });
        const resolvedTickets = await Chat.countDocuments({ status: 'resolved' });
        const closedTickets = await Chat.countDocuments({ status: 'closed' });

        // Get tickets by priority
        const priorityStats = await Chat.aggregate([
            {
                $group: {
                    _id: '$priority',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get tickets by category
        const categoryStats = await Chat.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get recent tickets
        const recentTickets = await Chat.find()
            .populate('user', 'name email')
            .populate('admin', 'name email')
            .sort({ lastMessage: -1 })
            .limit(5);

        res.json({
            success: true,
            data: {
                totalTickets,
                openTickets,
                inProgressTickets,
                resolvedTickets,
                closedTickets,
                priorityStats,
                categoryStats,
                recentTickets
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

// Get admins list
router.get('/admins', auth, adminAuth, async (req, res) => {
    try {
        const admins = await User.find({ role: 'admin' })
            .select('name email phone')
            .sort({ name: 1 });

        res.json({
            success: true,
            data: admins
        });
    } catch (error) {
        console.error('Get admins error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get admins',
            error: error.message
        });
    }
});

// Get unassigned tickets
router.get('/unassigned', auth, adminAuth, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        const tickets = await Chat.find({ admin: null })
            .populate('user', 'name email phone')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Chat.countDocuments({ admin: null });

        res.json({
            success: true,
            data: tickets,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Get unassigned tickets error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch unassigned tickets',
            error: error.message
        });
    }
});

module.exports = router; 