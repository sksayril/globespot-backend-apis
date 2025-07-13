const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const LevelService = require('../services/levelService');
const User = require('../models/user.model');
const Level = require('../models/level.model');

// Get user's level status
router.get('/status', auth, async (req, res) => {
    try {
        const levelStatus = await LevelService.getUserLevelStatus(req.user.id);
        
        res.json({
            success: true,
            data: levelStatus
        });
    } catch (error) {
        console.error('Error getting level status:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error getting level status'
        });
    }
});

// Claim daily income from both character and digit levels
router.post('/claim-daily-income', auth, async (req, res) => {
    try {
        const result = await LevelService.claimDailyIncome(req.user.id);
        
        res.json({
            success: true,
            message: 'Daily income claimed successfully',
            data: {
                characterIncome: result.characterIncome,
                digitIncome: result.digitIncome,
                totalIncome: result.totalIncome,
                newBalance: result.newBalance
            }
        });
    } catch (error) {
        console.error('Error claiming daily income:', error);
        
        if (error.message.includes('already claimed')) {
            return res.status(400).json({
                success: false,
                message: error.message,
                data: {
                    characterIncome: 0,
                    digitIncome: 0,
                    totalIncome: 0
                }
            });
        }
        
        if (error.message.includes('No income available')) {
            return res.status(400).json({
                success: false,
                message: error.message,
                data: {
                    characterIncome: 0,
                    digitIncome: 0,
                    totalIncome: 0
                }
            });
        }
        
        res.status(500).json({
            success: false,
            message: error.message || 'Error claiming daily income'
        });
    }
});

// Get daily income status (without claiming)
router.get('/daily-income-status', auth, async (req, res) => {
    try {
        const levelStatus = await LevelService.getUserLevelStatus(req.user.id);
        
        res.json({
            success: true,
            data: {
                canClaim: levelStatus.canClaim,
                characterIncome: levelStatus.potentialIncome.character,
                digitIncome: levelStatus.potentialIncome.digit,
                totalIncome: levelStatus.potentialIncome.total,
                lastClaimed: levelStatus.dailyIncome.lastClaimed,
                message: levelStatus.canClaim ? 
                    'You can claim your daily income' : 
                    'Daily income already claimed today'
            }
        });
    } catch (error) {
        console.error('Error getting daily income status:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error getting daily income status'
        });
    }
});

// Get user's referral network for level calculation
router.get('/referral-network', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const level = await Level.findOne({ userId: req.user.id });
        
        if (!level) {
            return res.status(404).json({
                success: false,
                message: 'Level data not found'
            });
        }
        
        // Get direct referrals with their details
        const directReferrals = await User.find({ referredBy: req.user.id })
            .select('name email phone normalWallet createdAt');
        
        // Get referral chain (who referred this user)
        let referralChain = [];
        let currentUser = user;
        
        while (currentUser.referredBy) {
            const referrer = await User.findById(currentUser.referredBy)
                .select('name email phone normalWallet createdAt');
            if (referrer) {
                referralChain.push(referrer);
                currentUser = referrer;
            } else {
                break;
            }
        }
        
        res.json({
            success: true,
            data: {
                characterLevel: level.characterLevel,
                digitLevel: level.digitLevel,
                directReferrals: directReferrals.map(ref => ({
                    id: ref._id,
                    name: ref.name,
                    email: ref.email,
                    phone: ref.phone,
                    walletBalance: ref.normalWallet?.balance || 0,
                    joinedAt: ref.createdAt
                })),
                referralChain: referralChain.map(ref => ({
                    id: ref._id,
                    name: ref.name,
                    email: ref.email,
                    phone: ref.phone,
                    walletBalance: ref.normalWallet?.balance || 0,
                    joinedAt: ref.createdAt
                })),
                digitLevelCriteria: level.digitLevel.criteria,
                validMembers: level.digitLevel.directMembers.filter(
                    member => member.walletBalance >= 50
                ).length
            }
        });
    } catch (error) {
        console.error('Error getting referral network:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error getting referral network'
        });
    }
});

// Force recalculate levels (for testing/debugging)
router.post('/recalculate', auth, async (req, res) => {
    try {
        const characterLevel = await LevelService.calculateCharacterLevel(req.user.id);
        const digitLevel = await LevelService.calculateDigitLevel(req.user.id);
        
        res.json({
            success: true,
            message: 'Levels recalculated successfully',
            data: {
                characterLevel,
                digitLevel
            }
        });
    } catch (error) {
        console.error('Error recalculating levels:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error recalculating levels'
        });
    }
});

// Get level statistics for admin
router.get('/statistics', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }
        
        const levels = await Level.find().populate('userId', 'name email');
        
        const statistics = {
            totalUsers: levels.length,
            characterLevels: {
                A: levels.filter(l => l.characterLevel.current === 'A').length,
                B: levels.filter(l => l.characterLevel.current === 'B').length,
                C: levels.filter(l => l.characterLevel.current === 'C').length,
                D: levels.filter(l => l.characterLevel.current === 'D').length,
                E: levels.filter(l => l.characterLevel.current === 'E').length,
                null: levels.filter(l => !l.characterLevel.current).length
            },
            digitLevels: {
                Lvl1: levels.filter(l => l.digitLevel.current === 'Lvl1').length,
                Lvl2: levels.filter(l => l.digitLevel.current === 'Lvl2').length,
                Lvl3: levels.filter(l => l.digitLevel.current === 'Lvl3').length,
                Lvl4: levels.filter(l => l.digitLevel.current === 'Lvl4').length,
                Lvl5: levels.filter(l => l.digitLevel.current === 'Lvl5').length,
                null: levels.filter(l => !l.digitLevel.current).length
            },
            totalEarnings: {
                characterLevel: levels.reduce((sum, l) => sum + l.characterLevel.totalEarned, 0),
                digitLevel: levels.reduce((sum, l) => sum + l.digitLevel.totalEarned, 0)
            }
        };
        
        res.json({
            success: true,
            data: statistics
        });
    } catch (error) {
        console.error('Error getting level statistics:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error getting level statistics'
        });
    }
});

module.exports = router; 