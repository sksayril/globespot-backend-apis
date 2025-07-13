const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const Content = require('../models/content.model');
const path = require('path');
const fs = require('fs');

// Admin: Upload content with image and text
router.post('/upload', adminAuth, upload.single('image'), async (req, res) => {
    try {
        const { title, textData } = req.body;
        
        if (!title || !textData) {
            return res.status(400).json({
                success: false,
                message: 'Title and text data are required.'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Image file is required.'
            });
        }

        // Generate image URL
        const imageUrl = `/uploads/${req.file.filename}`;

        const content = new Content({
            title,
            imageUrl,
            textData,
            createdBy: req.user._id
        });

        await content.save();

        res.status(201).json({
            success: true,
            message: 'Content uploaded successfully',
            data: {
                id: content._id,
                title: content.title,
                imageUrl: content.imageUrl,
                textData: content.textData,
                isActive: content.isActive,
                createdAt: content.createdAt
            }
        });
    } catch (error) {
        console.error('Error uploading content:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading content',
            error: error.message
        });
    }
});

// Admin: Get all content (with pagination)
router.get('/admin/list', adminAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const contents = await Content.find()
            .populate('createdBy', 'name email')
            .populate('updatedBy', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Content.countDocuments();

        res.json({
            success: true,
            data: {
                contents,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching content list:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching content list',
            error: error.message
        });
    }
});

router.get('/users/list',  async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const contents = await Content.find()
            .populate('createdBy', 'name email')
            .populate('updatedBy', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Content.countDocuments();

        res.json({
            success: true,
            data: {
                contents,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching content list:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching content list',
            error: error.message
        });
    }
});

// Admin: Get single content by ID
router.get('/admin/:contentId', adminAuth, async (req, res) => {
    try {
        const content = await Content.findById(req.params.contentId)
            .populate('createdBy', 'name email')
            .populate('updatedBy', 'name email');

        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Content not found.'
            });
        }

        res.json({
            success: true,
            data: content
        });
    } catch (error) {
        console.error('Error fetching content:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching content',
            error: error.message
        });
    }
});

// Admin: Update content
router.put('/admin/:contentId', adminAuth, upload.single('image'), async (req, res) => {
    try {
        const { title, textData, isActive } = req.body;
        const content = await Content.findById(req.params.contentId);

        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Content not found.'
            });
        }

        // Update fields
        if (title) content.title = title;
        if (textData) content.textData = textData;
        if (isActive !== undefined) content.isActive = isActive;
        
        // Update image if new file is uploaded
        if (req.file) {
            // Delete old image if exists
            if (content.imageUrl && content.imageUrl !== '/uploads/default.jpg') {
                const oldImagePath = path.join(__dirname, '..', content.imageUrl);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            content.imageUrl = `/uploads/${req.file.filename}`;
        }

        content.updatedBy = req.user._id;
        await content.save();

        res.json({
            success: true,
            message: 'Content updated successfully',
            data: {
                id: content._id,
                title: content.title,
                imageUrl: content.imageUrl,
                textData: content.textData,
                isActive: content.isActive,
                updatedAt: content.updatedAt
            }
        });
    } catch (error) {
        console.error('Error updating content:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating content',
            error: error.message
        });
    }
});

// Admin: Delete content
router.delete('/admin/:contentId', adminAuth, async (req, res) => {
    try {
        const content = await Content.findById(req.params.contentId);

        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Content not found.'
            });
        }

        // Delete image file
        if (content.imageUrl && content.imageUrl !== '/uploads/default.jpg') {
            const imagePath = path.join(__dirname, '..', content.imageUrl);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await Content.findByIdAndDelete(req.params.contentId);

        res.json({
            success: true,
            message: 'Content deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting content:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting content',
            error: error.message
        });
    }
});

// Admin: Toggle content active status
router.patch('/admin/:contentId/toggle', adminAuth, async (req, res) => {
    try {
        const content = await Content.findById(req.params.contentId);

        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Content not found.'
            });
        }

        content.isActive = !content.isActive;
        content.updatedBy = req.user._id;
        await content.save();

        res.json({
            success: true,
            message: `Content ${content.isActive ? 'activated' : 'deactivated'} successfully`,
            data: {
                id: content._id,
                isActive: content.isActive
            }
        });
    } catch (error) {
        console.error('Error toggling content status:', error);
        res.status(500).json({
            success: false,
            message: 'Error toggling content status',
            error: error.message
        });
    }
});

// User: Get all active content
router.get('/list', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const contents = await Content.find({ isActive: true })
            .select('title imageUrl textData createdAt')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Content.countDocuments({ isActive: true });

        res.json({
            success: true,
            data: {
                contents,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching content:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching content',
            error: error.message
        });
    }
});

// User: Get single active content by ID
router.get('/:contentId', auth, async (req, res) => {
    try {
        const content = await Content.findOne({ 
            _id: req.params.contentId, 
            isActive: true 
        }).select('title imageUrl textData createdAt');

        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Content not found or inactive.'
            });
        }

        res.json({
            success: true,
            data: content
        });
    } catch (error) {
        console.error('Error fetching content:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching content',
            error: error.message
        });
    }
});

// User: Get latest content
router.get('/latest', auth, async (req, res) => {
    try {
        const content = await Content.findOne({ isActive: true })
            .select('title imageUrl textData createdAt')
            .sort({ createdAt: -1 });

        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'No active content found.'
            });
        }

        res.json({
            success: true,
            data: content
        });
    } catch (error) {
        console.error('Error fetching latest content:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching latest content',
            error: error.message
        });
    }
});

module.exports = router; 