const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const LuckyDraw = require('../models/luckydraw.model');
const User = require('../models/user.model');

// Create new lucky draw (Admin only)
router.post('/create', adminAuth, async (req, res) => {
    try {
        const { title, description, amount, maxParticipants, startDate, endDate, drawDate } = req.body;

        // Validate required fields
        if (!title || !description || !amount || !maxParticipants || !startDate || !endDate || !drawDate) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Validate dates
        const start = new Date(startDate);
        const end = new Date(endDate);
        const draw = new Date(drawDate);
        const now = new Date();

        if (start < now) {
            return res.status(400).json({
                success: false,
                message: 'Start date cannot be in the past'
            });
        }

        if (end <= start) {
            return res.status(400).json({
                success: false,
                message: 'End date must be after start date'
            });
        }

        if (draw < end) {
            return res.status(400).json({
                success: false,
                message: 'Draw date must be after end date'
            });
        }

        // Validate amount and participants
        if (amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Amount must be greater than 0'
            });
        }

        if (maxParticipants <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Maximum participants must be greater than 0'
            });
        }

        // Create lucky draw
        const luckyDraw = new LuckyDraw({
            title,
            description,
            amount,
            maxParticipants,
            startDate: start,
            endDate: end,
            drawDate: draw,
            createdBy: req.user._id
        });

        await luckyDraw.save();

        res.status(201).json({
            success: true,
            message: 'Lucky draw created successfully',
            data: {
                id: luckyDraw._id,
                title: luckyDraw.title,
                description: luckyDraw.description,
                amount: luckyDraw.amount,
                maxParticipants: luckyDraw.maxParticipants,
                currentParticipants: luckyDraw.currentParticipants,
                status: luckyDraw.status,
                startDate: luckyDraw.startDate,
                endDate: luckyDraw.endDate,
                drawDate: luckyDraw.drawDate,
                createdAt: luckyDraw.createdAt
            }
        });
    } catch (error) {
        console.error('Error creating lucky draw:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating lucky draw',
            error: error.message
        });
    }
});

// Get all lucky draws (Admin only)
router.get('/all', adminAuth, async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        
        let filter = {};
        if (status) {
            filter.status = status;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const luckyDraws = await LuckyDraw.find(filter)
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await LuckyDraw.countDocuments(filter);

        res.json({
            success: true,
            data: {
                luckyDraws,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalItems: total,
                    itemsPerPage: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching lucky draws:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching lucky draws',
            error: error.message
        });
    }
});

// Get lucky draw by ID (Admin only)
router.get('/:luckyDrawId', adminAuth, async (req, res) => {
    try {
        const luckyDraw = await LuckyDraw.findById(req.params.luckyDrawId)
            .populate('createdBy', 'name email')
            .populate('participants.userId', 'name email phone')
            .populate('winners.userId', 'name email phone');

        if (!luckyDraw) {
            return res.status(404).json({
                success: false,
                message: 'Lucky draw not found'
            });
        }

        res.json({
            success: true,
            data: luckyDraw
        });
    } catch (error) {
        console.error('Error fetching lucky draw:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching lucky draw',
            error: error.message
        });
    }
});

// Update lucky draw (Admin only)
router.put('/:luckyDrawId', adminAuth, async (req, res) => {
    try {
        const { title, description, amount, maxParticipants, startDate, endDate, drawDate, status } = req.body;
        
        const luckyDraw = await LuckyDraw.findById(req.params.luckyDrawId);
        
        if (!luckyDraw) {
            return res.status(404).json({
                success: false,
                message: 'Lucky draw not found'
            });
        }

        // Only allow updates if lucky draw hasn't started
        if (luckyDraw.status !== 'active' || new Date() >= luckyDraw.startDate) {
            return res.status(400).json({
                success: false,
                message: 'Cannot update lucky draw that has already started'
            });
        }

        // Update fields
        if (title) luckyDraw.title = title;
        if (description) luckyDraw.description = description;
        if (amount) luckyDraw.amount = amount;
        if (maxParticipants) luckyDraw.maxParticipants = maxParticipants;
        if (startDate) luckyDraw.startDate = new Date(startDate);
        if (endDate) luckyDraw.endDate = new Date(endDate);
        if (drawDate) luckyDraw.drawDate = new Date(drawDate);
        if (status) luckyDraw.status = status;

        await luckyDraw.save();

        res.json({
            success: true,
            message: 'Lucky draw updated successfully',
            data: luckyDraw
        });
    } catch (error) {
        console.error('Error updating lucky draw:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating lucky draw',
            error: error.message
        });
    }
});

// Delete lucky draw (Admin only)
router.delete('/:luckyDrawId', adminAuth, async (req, res) => {
    try {
        const luckyDraw = await LuckyDraw.findById(req.params.luckyDrawId);
        
        if (!luckyDraw) {
            return res.status(404).json({
                success: false,
                message: 'Lucky draw not found'
            });
        }

        // Only allow deletion if lucky draw hasn't started
        if (new Date() >= luckyDraw.startDate) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete lucky draw that has already started'
            });
        }

        await LuckyDraw.findByIdAndDelete(req.params.luckyDrawId);

        res.json({
            success: true,
            message: 'Lucky draw deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting lucky draw:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting lucky draw',
            error: error.message
        });
    }
});

// Add users to lucky draw (Admin only)
router.post('/:luckyDrawId/add-users', adminAuth, async (req, res) => {
    try {
        const { userIds } = req.body;
        
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'User IDs array is required'
            });
        }

        const luckyDraw = await LuckyDraw.findById(req.params.luckyDrawId);
        
        if (!luckyDraw) {
            return res.status(404).json({
                success: false,
                message: 'Lucky draw not found'
            });
        }

        if (!luckyDraw.isActive()) {
            return res.status(400).json({
                success: false,
                message: 'Lucky draw is not active'
            });
        }

        // Get users
        const users = await User.find({ _id: { $in: userIds }, role: 'user' });
        
        if (users.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid users found'
            });
        }

        const addedUsers = [];
        const failedUsers = [];

        for (const user of users) {
            try {
                const canJoin = luckyDraw.canUserJoin(user._id);
                if (canJoin.canJoin) {
                    await luckyDraw.addParticipant(user);
                    addedUsers.push({
                        userId: user._id,
                        name: user.name,
                        email: user.email
                    });
                } else {
                    failedUsers.push({
                        userId: user._id,
                        name: user.name,
                        email: user.email,
                        reason: canJoin.reason
                    });
                }
            } catch (error) {
                failedUsers.push({
                    userId: user._id,
                    name: user.name,
                    email: user.email,
                    reason: error.message
                });
            }
        }

        res.json({
            success: true,
            message: `Added ${addedUsers.length} users to lucky draw`,
            data: {
                addedUsers,
                failedUsers,
                currentParticipants: luckyDraw.currentParticipants,
                maxParticipants: luckyDraw.maxParticipants
            }
        });
    } catch (error) {
        console.error('Error adding users to lucky draw:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding users to lucky draw',
            error: error.message
        });
    }
});

// Remove users from lucky draw (Admin only)
router.post('/:luckyDrawId/remove-users', adminAuth, async (req, res) => {
    try {
        const { userIds } = req.body;
        
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'User IDs array is required'
            });
        }

        const luckyDraw = await LuckyDraw.findById(req.params.luckyDrawId);
        
        if (!luckyDraw) {
            return res.status(404).json({
                success: false,
                message: 'Lucky draw not found'
            });
        }

        // Only allow removal if lucky draw hasn't ended
        if (new Date() >= luckyDraw.endDate) {
            return res.status(400).json({
                success: false,
                message: 'Cannot remove users from ended lucky draw'
            });
        }

        const removedUsers = [];
        const failedUsers = [];

        for (const userId of userIds) {
            const participantIndex = luckyDraw.participants.findIndex(
                p => p.userId.toString() === userId.toString()
            );
            
            if (participantIndex !== -1) {
                luckyDraw.participants.splice(participantIndex, 1);
                luckyDraw.currentParticipants--;
                removedUsers.push(userId);
            } else {
                failedUsers.push({
                    userId,
                    reason: 'User not found in participants'
                });
            }
        }

        await luckyDraw.save();

        res.json({
            success: true,
            message: `Removed ${removedUsers.length} users from lucky draw`,
            data: {
                removedUsers,
                failedUsers,
                currentParticipants: luckyDraw.currentParticipants,
                maxParticipants: luckyDraw.maxParticipants
            }
        });
    } catch (error) {
        console.error('Error removing users from lucky draw:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing users from lucky draw',
            error: error.message
        });
    }
});

// Draw winners (Admin only)
router.post('/:luckyDrawId/draw-winners', adminAuth, async (req, res) => {
    try {
        const luckyDraw = await LuckyDraw.findById(req.params.luckyDrawId);
        
        if (!luckyDraw) {
            return res.status(404).json({
                success: false,
                message: 'Lucky draw not found'
            });
        }

        if (luckyDraw.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'Lucky draw is not active'
            });
        }

        if (new Date() < luckyDraw.drawDate) {
            return res.status(400).json({
                success: false,
                message: 'Draw date has not arrived yet'
            });
        }

        if (luckyDraw.participants.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No participants to draw from'
            });
        }

        // Simple random selection (can be enhanced with more complex logic)
        const shuffled = [...luckyDraw.participants].sort(() => 0.5 - Math.random());
        const winners = shuffled.slice(0, Math.min(3, shuffled.length)); // Select up to 3 winners

        // Calculate prize distribution
        const totalPrize = luckyDraw.amount;
        const winnerCount = winners.length;
        const prizePerWinner = totalPrize / winnerCount;

        // Add winners to lucky draw
        luckyDraw.winners = winners.map(winner => ({
            userId: winner.userId,
            userName: winner.userName,
            userEmail: winner.userEmail,
            amount: prizePerWinner
        }));

        // Mark participants as winners
        luckyDraw.participants.forEach(participant => {
            const isWinner = winners.some(w => w.userId.toString() === participant.userId.toString());
            participant.isWinner = isWinner;
        });

        luckyDraw.status = 'completed';
        await luckyDraw.save();

        res.json({
            success: true,
            message: `Drew ${winners.length} winners successfully`,
            data: {
                winners: luckyDraw.winners,
                totalPrize: totalPrize,
                prizePerWinner: prizePerWinner,
                totalParticipants: luckyDraw.participants.length
            }
        });
    } catch (error) {
        console.error('Error drawing winners:', error);
        res.status(500).json({
            success: false,
            message: 'Error drawing winners',
            error: error.message
        });
    }
});

// Get lucky draw statistics (Admin only)
router.get('/:luckyDrawId/stats', adminAuth, async (req, res) => {
    try {
        const luckyDraw = await LuckyDraw.findById(req.params.luckyDrawId)
            .populate('participants.userId', 'name email phone')
            .populate('winners.userId', 'name email phone');

        if (!luckyDraw) {
            return res.status(404).json({
                success: false,
                message: 'Lucky draw not found'
            });
        }

        const stats = {
            id: luckyDraw._id,
            title: luckyDraw.title,
            status: luckyDraw.status,
            totalParticipants: luckyDraw.participants.length,
            maxParticipants: luckyDraw.maxParticipants,
            participationRate: (luckyDraw.participants.length / luckyDraw.maxParticipants) * 100,
            totalWinners: luckyDraw.winners.length,
            totalPrize: luckyDraw.amount,
            claimedPrizes: luckyDraw.winners.filter(w => w.hasClaimed).length,
            unclaimedPrizes: luckyDraw.winners.filter(w => !w.hasClaimed).length,
            startDate: luckyDraw.startDate,
            endDate: luckyDraw.endDate,
            drawDate: luckyDraw.drawDate,
            createdAt: luckyDraw.createdAt
        };

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error getting lucky draw stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting lucky draw stats',
            error: error.message
        });
    }
});

module.exports = router; 