const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/user.model');
const Deposit = require('../models/deposit.model');
const Config = require('../models/config.model');
const { adminAuth } = require('../middleware/auth');
const LevelService = require('../services/levelService');

// Admin Signup
router.post('/signup', async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;

        // Check if admin already exists
        const existingAdmin = await User.findOne({ role: 'admin' });
        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                message: 'Admin already exists. Only one admin is allowed.'
            });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered.'
            });
        }

        // Check if phone already exists
        const existingPhone = await User.findOne({ phone });
        if (existingPhone) {
            return res.status(400).json({
                success: false,
                message: 'Phone number already registered.'
            });
        }

        // Create admin user
        const admin = new User({
            name,
            email,
            phone,
            password,
            originalPassword: password, // Store original password
            role: 'admin',
            referralCode: 'ADMIN' + uuidv4().substring(0, 8).toUpperCase()
        });

        await admin.save();

        // Generate token
        const token = jwt.sign(
            { userId: admin._id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '365d' }
        );

        res.status(201).json({
            success: true,
            message: 'Admin created successfully',
            data: {
                admin: {
                    id: admin._id,
                    name: admin.name,
                    email: admin.email,
                    phone: admin.phone,
                    role: admin.role
                },
                token
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating admin',
            error: error.message
        });
    }
});

// Admin Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find admin by email
        const admin = await User.findOne({ email, role: 'admin' });
        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials.'
            });
        }

        // Check if admin is blocked
        if (admin.isBlocked) {
            return res.status(403).json({
                success: false,
                message: 'Account is blocked.'
            });
        }

        // Verify password
        const isValidPassword = await admin.comparePassword(password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials.'
            });
        }

        // Generate token
        const token = jwt.sign(
            { userId: admin._id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '365d' }
        );

        res.json({
            success: true,
            message: 'Admin login successful',
            data: {
                admin: {
                    id: admin._id,
                    name: admin.name,
                    email: admin.email,
                    phone: admin.phone,
                    role: admin.role
                },
                token
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error during login',
            error: error.message
        });
    }
});

// Get all users (Admin only)
router.get('/users', adminAuth, async (req, res) => {
    try {
        const users = await User.find({ role: 'user' })
            .select('-password')
            .populate('referredBy', 'name email referralCode')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
});

// Get user by ID with original password (Admin only)
router.get('/users/:userId', adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId)
            .populate('referredBy', 'name email referralCode');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        res.json({
            success: true,
            data: {
                ...user.toObject(),
                originalPassword: user.originalPassword
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user',
            error: error.message
        });
    }
});

// Block/Unblock user (Admin only)
router.post('/users/:userId/block', adminAuth, async (req, res) => {
    try {
        const { isBlocked } = req.body;
        const user = await User.findById(req.params.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        if (user.role === 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Cannot block admin user.'
            });
        }

        user.isBlocked = isBlocked;
        await user.save();

        res.json({
            success: true,
            message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully`,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                isBlocked: user.isBlocked
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating user status',
            error: error.message
        });
    }
});

// Get all deposit requests (Admin only)
router.get('/deposits', adminAuth, async (req, res) => {
    try {
        const deposits = await Deposit.find()
            .populate('user', 'name email phone')
            .populate('approvedBy', 'name')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: deposits
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching deposits',
            error: error.message
        });
    }
});

// Approve/Reject deposit request (Admin only)
router.post('/deposits/:depositId/approve', adminAuth, async (req, res) => {
    try {
        const { status, adminNotes } = req.body;
        
        // Validate status
        if (!status || !['approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Status must be either "approved" or "rejected".'
            });
        }

        const deposit = await Deposit.findById(req.params.depositId)
            .populate('user');

        if (!deposit) {
            return res.status(404).json({
                success: false,
                message: 'Deposit request not found.'
            });
        }

        if (deposit.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Deposit request has already been processed.'
            });
        }

        deposit.status = status;
        deposit.adminNotes = adminNotes || '';
        deposit.approvedBy = req.user._id;
        deposit.approvedAt = new Date();

        await deposit.save();

        // If approved, add amount to user's wallet
        if (status === 'approved') {
            const user = deposit.user;
            
            if (deposit.walletType === 'investment') {
                user.investmentWallet.balance += deposit.amount;
                user.investmentWallet.transactions.push({
                    type: 'deposit',
                    amount: deposit.amount,
                    description: `Deposit approved - ${deposit.paymentMethod}`,
                    status: 'approved'
                });
            } else if (deposit.walletType === 'normal') {
                user.normalWallet.balance += deposit.amount;
                user.normalWallet.transactions.push({
                    type: 'deposit',
                    amount: deposit.amount,
                    description: `Deposit approved - ${deposit.paymentMethod}`,
                    status: 'approved'
                });
            }

            await user.save();

            // Process referral bonus (10% of first deposit) - triggers on normal wallet deposit
            if (deposit.walletType === 'normal' && user.referredBy && user.normalWallet.transactions.length === 1) {
                const referrer = await User.findById(user.referredBy);
                if (referrer) {
                    const bonusAmount = deposit.amount * 0.1; // 10% bonus
                    referrer.normalWallet.balance += bonusAmount;
                    referrer.normalWallet.transactions.push({
                        type: 'referral_bonus',
                        amount: bonusAmount,
                        description: `Referral bonus from ${user.name}`,
                        status: 'approved'
                    });
                    await referrer.save();
                }
            }

            // Process first deposit bonus (use global percentage) - one time only
            if (!user.firstDepositBonus.hasReceived) {
                // Get global percentage
                let config = await Config.findOne({ key: 'firstDepositBonusPercentage' });
                let globalPercentage = config ? config.value : 10;
                const bonusAmount = deposit.amount * (globalPercentage / 100);
                user.normalWallet.balance += bonusAmount;
                user.normalWallet.transactions.push({
                    type: 'referral_bonus',
                    amount: bonusAmount,
                    description: `First deposit bonus (${globalPercentage}%)`,
                    status: 'approved'
                });
                // Update first deposit bonus tracking
                user.firstDepositBonus.hasReceived = true;
                user.firstDepositBonus.amount = bonusAmount;
                user.firstDepositBonus.percentage = globalPercentage;
                user.firstDepositBonus.receivedAt = new Date();
                await user.save();
            }
        }

        // Get updated user data for response
        const updatedUser = await User.findById(deposit.user._id)
            .select('investmentWallet normalWallet name email');

        res.json({
            success: true,
            message: `Deposit request ${status} successfully`,
            data: {
                id: deposit._id,
                status: deposit.status,
                approvedBy: deposit.approvedBy,
                approvedAt: deposit.approvedAt,
                adminNotes: deposit.adminNotes,
                user: {
                    id: updatedUser._id,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    investmentWallet: {
                        balance: updatedUser.investmentWallet.balance,
                        transactions: updatedUser.investmentWallet.transactions
                    },
                    normalWallet: {
                        balance: updatedUser.normalWallet.balance,
                        transactions: updatedUser.normalWallet.transactions
                    }
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error processing deposit request',
            error: error.message
        });
    }
});

// Get system statistics (Admin only)
router.get('/statistics', adminAuth, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: 'user' });
        const activeUsers = await User.countDocuments({ role: 'user', isBlocked: false });
        const blockedUsers = await User.countDocuments({ role: 'user', isBlocked: true });
        const pendingDeposits = await Deposit.countDocuments({ status: 'pending' });
        const totalDeposits = await Deposit.countDocuments();
        const approvedDeposits = await Deposit.countDocuments({ status: 'approved' });

        // Calculate total amounts
        const totalDepositAmount = await Deposit.aggregate([
            { $match: { status: 'approved' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const totalInvestmentBalance = await User.aggregate([
            { $match: { role: 'user' } },
            { $group: { _id: null, total: { $sum: '$investmentWallet.balance' } } }
        ]);

        const totalNormalBalance = await User.aggregate([
            { $match: { role: 'user' } },
            { $group: { _id: null, total: { $sum: '$normalWallet.balance' } } }
        ]);

        res.json({
            success: true,
            data: {
                users: {
                    total: totalUsers,
                    active: activeUsers,
                    blocked: blockedUsers
                },
                deposits: {
                    total: totalDeposits,
                    pending: pendingDeposits,
                    approved: approvedDeposits,
                    totalAmount: totalDepositAmount[0]?.total || 0
                },
                wallets: {
                    totalInvestment: totalInvestmentBalance[0]?.total || 0,
                    totalNormal: totalNormalBalance[0]?.total || 0
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics',
            error: error.message
        });
    }
});

// Get user's first deposit bonus percentage (Admin only)
router.get('/users/:userId/first-deposit-bonus', adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId)
            .select('name email firstDepositBonus');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        res.json({
            success: true,
            data: {
                userId: user._id,
                name: user.name,
                email: user.email,
                firstDepositBonus: user.firstDepositBonus
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching first deposit bonus info',
            error: error.message
        });
    }
});

// Update user's first deposit bonus percentage (Admin only)
router.post('/users/:userId/first-deposit-bonus', adminAuth, async (req, res) => {
    try {
        const { percentage } = req.body;

        // Validate percentage
        if (!percentage || percentage < 0 || percentage > 100) {
            return res.status(400).json({
                success: false,
                message: 'Percentage must be between 0 and 100.'
            });
        }

        const user = await User.findById(req.params.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        // Check if user has already received the bonus
        if (user.firstDepositBonus.hasReceived) {
            return res.status(400).json({
                success: false,
                message: 'User has already received first deposit bonus. Percentage cannot be changed.',
                data: {
                    hasReceived: true,
                    amount: user.firstDepositBonus.amount,
                    receivedAt: user.firstDepositBonus.receivedAt
                }
            });
        }

        // Update percentage
        user.firstDepositBonus.percentage = percentage;
        await user.save();

        res.json({
            success: true,
            message: 'First deposit bonus percentage updated successfully',
            data: {
                userId: user._id,
                name: user.name,
                email: user.email,
                firstDepositBonus: user.firstDepositBonus
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating first deposit bonus percentage',
            error: error.message
        });
    }
});

// Get all users with first deposit bonus status (Admin only)
router.get('/first-deposit-bonuses', adminAuth, async (req, res) => {
    try {
        const users = await User.find({ role: 'user' })
            .select('name email firstDepositBonus createdAt')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching first deposit bonus data',
            error: error.message
        });
    }
});

// Get global first deposit bonus percentage (Admin only)
router.get('/first-deposit-bonus-percentage', adminAuth, async (req, res) => {
    try {
        let config = await Config.findOne({ key: 'firstDepositBonusPercentage' });
        if (!config) {
            // Default to 10% if not set
            config = new Config({ key: 'firstDepositBonusPercentage', value: 10 });
            await config.save();
        }
        res.json({
            success: true,
            data: {
                percentage: config.value
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching global first deposit bonus percentage',
            error: error.message
        });
    }
});

// Set global first deposit bonus percentage (Admin only)
router.post('/first-deposit-bonus-percentage', adminAuth, async (req, res) => {
    try {
        const { percentage } = req.body;
        if (typeof percentage !== 'number' || percentage < 0 || percentage > 100) {
            return res.status(400).json({
                success: false,
                message: 'Percentage must be a number between 0 and 100.'
            });
        }
        let config = await Config.findOne({ key: 'firstDepositBonusPercentage' });
        if (!config) {
            config = new Config({ key: 'firstDepositBonusPercentage', value: percentage });
        } else {
            config.value = percentage;
        }
        await config.save();
        res.json({
            success: true,
            message: 'Global first deposit bonus percentage updated successfully',
            data: {
                percentage: config.value
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating global first deposit bonus percentage',
            error: error.message
        });
    }
});

// Manual trigger for cron jobs (Admin only)
router.post('/trigger-daily-update', adminAuth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const cronService = require('../services/cronService');
        await cronService.triggerDailyUpdate();

        res.json({
            success: true,
            message: 'Daily update triggered successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error triggering daily update',
            error: error.message
        });
    }
});

router.post('/trigger-weekly-recalculation', adminAuth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const cronService = require('../services/cronService');
        await cronService.triggerWeeklyRecalculation();

        res.json({
            success: true,
            message: 'Weekly recalculation triggered successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error triggering weekly recalculation',
            error: error.message
        });
    }
});

router.get('/cron-status', adminAuth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const cronService = require('../services/cronService');
        const status = cronService.getStatus();

        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error getting cron status',
            error: error.message
        });
    }
});

module.exports = router; 