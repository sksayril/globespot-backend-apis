const express = require('express');
const router = express.Router();
const Chat = require('../models/chat.model');
const User = require('../models/user.model');
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Create a new support ticket
router.post('/create-ticket', auth, async (req, res) => {
    try {
        const { subject, category, priority, message } = req.body;
        
        if (!subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'Subject and message are required'
            });
        }

        const chat = new Chat({
            user: req.user._id,
            subject,
            category: category || 'general',
            priority: priority || 'medium'
        });

        // Add the initial message
        await chat.addMessage(req.user._id, 'user', message);

        await chat.save();

        const populatedChat = await Chat.findById(chat._id)
            .populate('user', 'name email phone')
            .populate('admin', 'name email')
            .populate('messages.sender', 'name email');

        res.status(201).json({
            success: true,
            message: 'Support ticket created successfully',
            data: populatedChat
        });
    } catch (error) {
        console.error('Create ticket error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create support ticket',
            error: error.message
        });
    }
});

// Get user's chat tickets
router.get('/my-tickets', auth, async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const skip = (page - 1) * limit;

        let query = { user: req.user._id };
        if (status) {
            query.status = status;
        }

        const tickets = await Chat.find(query)
            .populate('user', 'name email phone')
            .populate('admin', 'name email')
            .sort({ lastMessage: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Chat.countDocuments(query);

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
        console.error('Get tickets error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tickets',
            error: error.message
        });
    }
});

// Get specific chat ticket with messages
router.get('/ticket/:ticketId', auth, async (req, res) => {
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

        // Check if user owns this ticket or is admin
        if (chat.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Mark messages as read for the current user
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

// Send message to ticket
router.post('/ticket/:ticketId/message', auth, upload.single('file'), async (req, res) => {
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

        // Check if user owns this ticket or is admin
        if (chat.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
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

        await chat.addMessage(req.user._id, req.user.role, content, messageType, fileUrl);

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

// Close ticket
router.put('/ticket/:ticketId/close', auth, async (req, res) => {
    try {
        const { ticketId } = req.params;

        const chat = await Chat.findById(ticketId);
        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }

        // Check if user owns this ticket or is admin
        if (chat.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        chat.status = 'closed';
        await chat.save();

        res.json({
            success: true,
            message: 'Ticket closed successfully',
            data: chat
        });
    } catch (error) {
        console.error('Close ticket error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to close ticket',
            error: error.message
        });
    }
});

// Get unread message count
router.get('/unread-count', auth, async (req, res) => {
    try {
        const chats = await Chat.find({ user: req.user._id });
        let unreadCount = 0;

        chats.forEach(chat => {
            chat.messages.forEach(message => {
                if (message.sender.toString() !== req.user._id.toString() && !message.isRead) {
                    unreadCount++;
                }
            });
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

module.exports = router; 