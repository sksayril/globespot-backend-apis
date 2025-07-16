const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const LuckyDraw = require('../models/luckydraw.model');
const User = require('../models/user.model');

// Get all lucky draws (User)
router.get('/all', auth, async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const luckyDraws = await LuckyDraw.find({})
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await LuckyDraw.countDocuments({});

        // Add user participation status to each lucky draw
        const luckyDrawsWithStatus = luckyDraws.map(luckyDraw => {
            const isParticipant = luckyDraw.participants.some(
                p => p.userId.toString() === req.user._id.toString()
            );
            const isWinner = luckyDraw.winners.some(
                w => w.userId.toString() === req.user._id.toString()
            );
            
            // Determine if user can join based on lucky draw status
            let canJoin = false;
            let joinReason = '';
            
            if (luckyDraw.status === 'active') {
                if (isParticipant) {
                    canJoin = false;
                    joinReason = 'Already participated';
                } else if (luckyDraw.currentParticipants >= luckyDraw.maxParticipants) {
                    canJoin = false;
                    joinReason = 'Maximum participants reached';
                } else if (new Date() < luckyDraw.startDate) {
                    canJoin = false;
                    joinReason = 'Lucky draw has not started yet';
                } else if (new Date() > luckyDraw.endDate) {
                    canJoin = false;
                    joinReason = 'Lucky draw has ended';
                } else {
                    canJoin = true;
                    joinReason = 'Can join';
                }
            } else {
                canJoin = false;
                joinReason = `Lucky draw is ${luckyDraw.status}`;
            }
            
            return {
                ...luckyDraw.toObject(),
                userParticipation: {
                    isParticipant,
                    isWinner,
                    canJoin,
                    joinReason
                }
            };
        });

        res.json({
            success: true,
            data: {
                luckyDraws: luckyDrawsWithStatus,
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

// Get active lucky draws only (User)
router.get('/active', auth, async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const luckyDraws = await LuckyDraw.find({ 
            status: 'active',
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() }
        })
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

        const total = await LuckyDraw.countDocuments({ 
            status: 'active',
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() }
        });

        // Add user participation status to each lucky draw
        const luckyDrawsWithStatus = luckyDraws.map(luckyDraw => {
            const isParticipant = luckyDraw.participants.some(
                p => p.userId.toString() === req.user._id.toString()
            );
            const isWinner = luckyDraw.winners.some(
                w => w.userId.toString() === req.user._id.toString()
            );
            
            return {
                ...luckyDraw.toObject(),
                userParticipation: {
                    isParticipant,
                    isWinner,
                    canJoin: !isParticipant && luckyDraw.isActive()
                }
            };
        });

        res.json({
            success: true,
            data: {
                luckyDraws: luckyDrawsWithStatus,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalItems: total,
                    itemsPerPage: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching active lucky draws:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching active lucky draws',
            error: error.message
        });
    }
});

// Get lucky draw by ID (User)
router.get('/:luckyDrawId', auth, async (req, res) => {
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

        // Add user participation status
        const isParticipant = luckyDraw.participants.some(
            p => p.userId.toString() === req.user._id.toString()
        );
        const isWinner = luckyDraw.winners.some(
            w => w.userId.toString() === req.user._id.toString()
        );
        const canJoin = luckyDraw.canUserJoin(req.user._id);
        const canClaim = luckyDraw.canUserClaim(req.user._id);

        const luckyDrawWithStatus = {
            ...luckyDraw.toObject(),
            userParticipation: {
                isParticipant,
                isWinner,
                canJoin: canJoin.canJoin,
                canClaim: canClaim.canClaim,
                joinReason: canJoin.reason,
                claimReason: canClaim.reason
            }
        };

        res.json({
            success: true,
            data: luckyDrawWithStatus
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

// Join lucky draw (User)
router.post('/:luckyDrawId/join', auth, async (req, res) => {
    try {
        const luckyDraw = await LuckyDraw.findById(req.params.luckyDrawId);
        
        if (!luckyDraw) {
            return res.status(404).json({
                success: false,
                message: 'Lucky draw not found'
            });
        }

        const canJoin = luckyDraw.canUserJoin(req.user._id);
        if (!canJoin.canJoin) {
            return res.status(400).json({
                success: false,
                message: canJoin.reason
            });
        }

        // Get user details
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        await luckyDraw.addParticipant(user);

        res.json({
            success: true,
            message: 'Successfully joined lucky draw',
            data: {
                luckyDrawId: luckyDraw._id,
                title: luckyDraw.title,
                currentParticipants: luckyDraw.currentParticipants,
                maxParticipants: luckyDraw.maxParticipants,
                joinedAt: new Date()
            }
        });
    } catch (error) {
        console.error('Error joining lucky draw:', error);
        res.status(500).json({
            success: false,
            message: 'Error joining lucky draw',
            error: error.message
        });
    }
});

// Claim lucky draw prize (User)
router.post('/:luckyDrawId/claim', auth, async (req, res) => {
    try {
        const luckyDraw = await LuckyDraw.findById(req.params.luckyDrawId);
        
        if (!luckyDraw) {
            return res.status(404).json({
                success: false,
                message: 'Lucky draw not found'
            });
        }

        const canClaim = luckyDraw.canUserClaim(req.user._id);
        if (!canClaim.canClaim) {
            return res.status(400).json({
                success: false,
                message: canClaim.reason
            });
        }

        // Get user and winner details
        const user = await User.findById(req.user._id);
        const winner = luckyDraw.winners.find(w => w.userId.toString() === req.user._id.toString());
        
        if (!user || !winner) {
            return res.status(404).json({
                success: false,
                message: 'User or winner not found'
            });
        }

        // Mark prize as claimed
        await luckyDraw.claimPrize(req.user._id);

        // Credit amount to user's normal wallet
        if (!user.normalWallet) {
            user.normalWallet = { balance: 0, transactions: [] };
        }
        
        user.normalWallet.balance += winner.amount;
        user.normalWallet.transactions.push({
            type: 'lucky_draw_prize',
            amount: winner.amount,
            description: `Lucky draw prize from "${luckyDraw.title}"`,
            date: new Date(),
            status: 'approved'
        });

        await user.save();

        res.json({
            success: true,
            message: 'Prize claimed successfully',
            data: {
                luckyDrawId: luckyDraw._id,
                title: luckyDraw.title,
                prizeAmount: winner.amount,
                newBalance: user.normalWallet.balance,
                claimedAt: new Date()
            }
        });
    } catch (error) {
        console.error('Error claiming prize:', error);
        res.status(500).json({
            success: false,
            message: 'Error claiming prize',
            error: error.message
        });
    }
});

// Get user's lucky draw history (User)
router.get('/my/history', auth, async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Find lucky draws where user is a participant
        const luckyDraws = await LuckyDraw.find({
            'participants.userId': req.user._id
        })
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

        const total = await LuckyDraw.countDocuments({
            'participants.userId': req.user._id
        });

        // Add user details to each lucky draw
        const userHistory = luckyDraws.map(luckyDraw => {
            const participation = luckyDraw.participants.find(
                p => p.userId.toString() === req.user._id.toString()
            );
            const winning = luckyDraw.winners.find(
                w => w.userId.toString() === req.user._id.toString()
            );
            
            return {
                id: luckyDraw._id,
                title: luckyDraw.title,
                description: luckyDraw.description,
                amount: luckyDraw.amount,
                status: luckyDraw.status,
                startDate: luckyDraw.startDate,
                endDate: luckyDraw.endDate,
                drawDate: luckyDraw.drawDate,
                joinedAt: participation?.joinedAt,
                isWinner: !!winning,
                prizeAmount: winning?.amount || 0,
                hasClaimed: winning?.hasClaimed || false,
                claimedAt: winning?.claimedAt,
                totalParticipants: luckyDraw.participants.length,
                maxParticipants: luckyDraw.maxParticipants
            };
        });

        res.json({
            success: true,
            data: {
                history: userHistory,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalItems: total,
                    itemsPerPage: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching user lucky draw history:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching lucky draw history',
            error: error.message
        });
    }
});

// Get user's lucky draw statistics (User)
router.get('/my/stats', auth, async (req, res) => {
    try {
        // Get all lucky draws where user participated
        const participatedDraws = await LuckyDraw.find({
            'participants.userId': req.user._id
        });

        // Get all lucky draws where user won
        const wonDraws = await LuckyDraw.find({
            'winners.userId': req.user._id
        });

        // Calculate statistics
        const stats = {
            totalParticipated: participatedDraws.length,
            totalWon: wonDraws.length,
            totalPrizeAmount: wonDraws.reduce((sum, draw) => {
                const winner = draw.winners.find(w => w.userId.toString() === req.user._id.toString());
                return sum + (winner?.amount || 0);
            }, 0),
            totalClaimed: wonDraws.filter(draw => {
                const winner = draw.winners.find(w => w.userId.toString() === req.user._id.toString());
                return winner?.hasClaimed;
            }).length,
            totalUnclaimed: wonDraws.filter(draw => {
                const winner = draw.winners.find(w => w.userId.toString() === req.user._id.toString());
                return winner && !winner.hasClaimed;
            }).length,
            winRate: participatedDraws.length > 0 ? (wonDraws.length / participatedDraws.length) * 100 : 0
        };

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching user lucky draw stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching lucky draw statistics',
            error: error.message
        });
    }
});

// Get user's unclaimed prizes (User)
router.get('/my/unclaimed', auth, async (req, res) => {
    try {
        const unclaimedDraws = await LuckyDraw.find({
            'winners.userId': req.user._id,
            'winners.hasClaimed': false
        })
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });

        const unclaimedPrizes = unclaimedDraws.map(draw => {
            const winner = draw.winners.find(w => w.userId.toString() === req.user._id.toString());
            
            return {
                luckyDrawId: draw._id,
                title: draw.title,
                description: draw.description,
                prizeAmount: winner?.amount || 0,
                drawDate: draw.drawDate,
                canClaim: draw.status === 'completed'
            };
        });

        res.json({
            success: true,
            data: {
                unclaimedPrizes,
                totalUnclaimed: unclaimedPrizes.length,
                totalAmount: unclaimedPrizes.reduce((sum, prize) => sum + prize.prizeAmount, 0)
            }
        });
    } catch (error) {
        console.error('Error fetching unclaimed prizes:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching unclaimed prizes',
            error: error.message
        });
    }
});

module.exports = router; 