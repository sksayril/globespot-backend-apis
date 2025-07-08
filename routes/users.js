const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/user.model');
const Deposit = require('../models/deposit.model');
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');

// User Signup with Referral Code
router.post('/signup', async (req, res) => {
    try {
        const { name, email, phone, password, referralCode } = req.body;

        // Check if email already exists
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
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

        // Validate referral code if provided
        let referredBy = null;
        if (referralCode) {
            const referrer = await User.findOne({ referralCode });
            if (!referrer) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid referral code.'
                });
            }
            referredBy = referrer._id;
        }

        // Create user
        const user = new User({
            name,
            email,
            phone,
            password,
            originalPassword: password, // Store original password
            referralCode: name.substring(0, 3).toUpperCase() + uuidv4().substring(0, 8).toUpperCase(),
            referredBy,
            referralLevel: referredBy ? 1 : 0
        });

        await user.save();

        // Generate token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    referralCode: user.referralCode,
                    referredBy: user.referredBy
                },
                token
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating user',
            error: error.message
        });
    }
});

// User Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email, role: 'user' });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials.'
            });
        }

        // Check if user is blocked
        if (user.isBlocked) {
            return res.status(403).json({
                success: false,
                message: 'Account is blocked. Please contact admin.'
            });
        }

        // Verify password
        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials.'
            });
        }

        // Generate token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    referralCode: user.referralCode,
                    isBlocked: user.isBlocked
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

// Get user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password')
            .populate('referredBy', 'name email referralCode');

        // Calculate potential daily income
        const potentialDailyIncome = user.normalWallet.balance * 0.0005;
        
        // Check if user can claim today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let canClaimDailyIncome = true;
        if (user.dailyIncome.lastClaimed) {
            const lastClaimed = new Date(user.dailyIncome.lastClaimed);
            lastClaimed.setHours(0, 0, 0, 0);
            
            if (lastClaimed.getTime() === today.getTime()) {
                canClaimDailyIncome = false;
            }
        }

        res.json({
            success: true,
            data: {
                ...user.toObject(),
                potentialDailyIncome,
                canClaimDailyIncome
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching profile',
            error: error.message
        });
    }
});

// Update user profile
router.post('/profile', auth, async (req, res) => {
    try {
        const { name, phone, address } = req.body;
        const user = await User.findById(req.user._id);

        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (address) user.address = address;

        await user.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: error.message
        });
    }
});

// Get wallet balances
router.get('/wallets', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('investmentWallet normalWallet');

        res.json({
            success: true,
            data: {
                investmentWallet: {
                    balance: user.investmentWallet.balance,
                    transactions: user.investmentWallet.transactions
                },
                normalWallet: {
                    balance: user.normalWallet.balance,
                    transactions: user.normalWallet.transactions
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching wallet information',
            error: error.message
        });
    }
});

// Create deposit request
router.post('/deposits', auth, upload.single('paymentProof'), async (req, res) => {
    try {
        const { amount, paymentMethod, paymentId, walletType } = req.body;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Payment proof image is required.'
            });
        }

        // Validate amount
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid amount is required.'
            });
        }

        // Validate wallet type
        if (!['investment', 'normal'].includes(walletType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid wallet type.'
            });
        }

        // Create deposit request
        const deposit = new Deposit({
            user: req.user._id,
            amount: parseFloat(amount),
            paymentMethod,
            paymentId,
            paymentProof: req.file.path,
            walletType
        });

        await deposit.save();

        res.status(201).json({
            success: true,
            message: 'Deposit request created successfully',
            data: {
                id: deposit._id,
                amount: deposit.amount,
                paymentMethod: deposit.paymentMethod,
                walletType: deposit.walletType,
                status: deposit.status,
                createdAt: deposit.createdAt
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating deposit request',
            error: error.message
        });
    }
});

// Get user's deposit requests
router.get('/deposits', auth, async (req, res) => {
    try {
        const deposits = await Deposit.find({ user: req.user._id })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: deposits
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching deposit requests',
            error: error.message
        });
    }
});

// Get referral information
router.get('/referrals', auth, async (req, res) => {
    try {
        // Get users referred by current user
        const referredUsers = await User.find({ referredBy: req.user._id })
            .select('name email phone createdAt')
            .sort({ createdAt: -1 });

        // Get referrer information
        const referrer = await User.findById(req.user.referredBy)
            .select('name email referralCode');

        res.json({
            success: true,
            data: {
                referralCode: req.user.referralCode,
                referredUsers,
                referrer,
                totalReferrals: referredUsers.length
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching referral information',
            error: error.message
        });
    }
});

// Transfer between wallets
router.post('/transfer', auth, async (req, res) => {
    try {
        const { fromWallet, toWallet, amount } = req.body;

        if (!['investment', 'normal'].includes(fromWallet) || !['investment', 'normal'].includes(toWallet)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid wallet type.'
            });
        }

        if (fromWallet === toWallet) {
            return res.status(400).json({
                success: false,
                message: 'Cannot transfer to same wallet.'
            });
        }

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid amount is required.'
            });
        }

        const user = await User.findById(req.user._id);

        // Check if user has sufficient balance
        const fromBalance = fromWallet === 'investment' ? user.investmentWallet.balance : user.normalWallet.balance;
        if (fromBalance < amount) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient balance.'
            });
        }

        // Perform transfer
        if (fromWallet === 'investment') {
            user.investmentWallet.balance -= amount;
            user.investmentWallet.transactions.push({
                type: 'withdrawal',
                amount: amount,
                description: `Transfer to ${toWallet} wallet`,
                status: 'approved'
            });
        } else {
            user.normalWallet.balance -= amount;
            user.normalWallet.transactions.push({
                type: 'withdrawal',
                amount: amount,
                description: `Transfer to ${toWallet} wallet`,
                status: 'approved'
            });
        }

        if (toWallet === 'investment') {
            user.investmentWallet.balance += amount;
            user.investmentWallet.transactions.push({
                type: 'deposit',
                amount: amount,
                description: `Transfer from ${fromWallet} wallet`,
                status: 'approved'
            });
        } else {
            user.normalWallet.balance += amount;
            user.normalWallet.transactions.push({
                type: 'deposit',
                amount: amount,
                description: `Transfer from ${fromWallet} wallet`,
                status: 'approved'
            });
        }

        await user.save();

        res.json({
            success: true,
            message: 'Transfer completed successfully',
            data: {
                fromWallet,
                toWallet,
                amount,
                newBalances: {
                    investment: user.investmentWallet.balance,
                    normal: user.normalWallet.balance
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error processing transfer',
            error: error.message
        });
    }
});

// Claim Today's Daily Income
router.post('/today-my-income', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        // Check if user has already claimed today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (user.dailyIncome.lastClaimed) {
            const lastClaimed = new Date(user.dailyIncome.lastClaimed);
            lastClaimed.setHours(0, 0, 0, 0);
            
            if (lastClaimed.getTime() === today.getTime()) {
                return res.status(400).json({
                    success: false,
                    message: 'Daily income already claimed today. Please try again tomorrow.',
                    data: {
                        myDailyIncome: user.dailyIncome.todayEarned,
                        lastClaimed: user.dailyIncome.lastClaimed
                    }
                });
            }
        }
        
        // Calculate daily income (0.05% of normal wallet balance)
        const dailyIncomeAmount = user.normalWallet.balance * 0.005; // 0.05% = 0.0005
        
        if (dailyIncomeAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'No balance available for daily income calculation.',
                data: {
                    myDailyIncome: 0,
                    normalWalletBalance: user.normalWallet.balance
                }
            });
        }
        
        // Credit the daily income to normal wallet
        user.normalWallet.balance += dailyIncomeAmount;
        user.normalWallet.transactions.push({
            type: 'daily_income',
            amount: dailyIncomeAmount,
            description: 'Daily income credit (0.05% of normal wallet balance)',
            status: 'approved'
        });
        
        // Update daily income tracking
        user.dailyIncome.lastClaimed = new Date();
        user.dailyIncome.totalEarned += dailyIncomeAmount;
        user.dailyIncome.todayEarned = dailyIncomeAmount;
        
        await user.save();
        
        res.json({
            success: true,
            message: 'Daily income claimed successfully',
            data: {
                myDailyIncome: dailyIncomeAmount,
                normalWalletBalance: user.normalWallet.balance,
                totalEarned: user.dailyIncome.totalEarned,
                lastClaimed: user.dailyIncome.lastClaimed
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error claiming daily income',
            error: error.message
        });
    }
});

// Get Daily Income Status
router.get('/today-my-income', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let canClaim = true;
        let message = 'You can claim your daily income';
        
        if (user.dailyIncome.lastClaimed) {
            const lastClaimed = new Date(user.dailyIncome.lastClaimed);
            lastClaimed.setHours(0, 0, 0, 0);
            
            if (lastClaimed.getTime() === today.getTime()) {
                canClaim = false;
                message = 'Daily income already claimed today';
            }
        }
        
        // Calculate potential daily income
        const potentialDailyIncome = user.normalWallet.balance * 0.0005;
        
        res.json({
            success: true,
            data: {
                canClaim,
                message,
                myDailyIncome: user.dailyIncome.todayEarned,
                potentialDailyIncome,
                normalWalletBalance: user.normalWallet.balance,
                totalEarned: user.dailyIncome.totalEarned,
                lastClaimed: user.dailyIncome.lastClaimed
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching daily income status',
            error: error.message
        });
    }
});

module.exports = router;
