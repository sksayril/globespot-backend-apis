const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/user.model');
const Deposit = require('../models/deposit.model');
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const LevelService = require('../services/levelService');

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

        // Initialize level for the new user
        await LevelService.initializeLevel(user._id);

        // Update levels for the referral chain if user was referred
        if (referredBy) {
            await LevelService.updateLevelsOnNewUser(user._id, referredBy);
        }

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

// Transfer Between Wallets
router.post('/transfer', auth, async (req, res) => {
    try {
        const { fromWallet, toWallet, amount } = req.body;

        // Validate input
        if (!fromWallet || !toWallet || !amount) {
            return res.status(400).json({
                success: false,
                message: 'From wallet, to wallet, and amount are required.'
            });
        }

        if (fromWallet === toWallet) {
            return res.status(400).json({
                success: false,
                message: 'From wallet and to wallet cannot be the same.'
            });
        }

        if (amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Amount must be greater than 0.'
            });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        // Check if user has sufficient balance in fromWallet
        const fromWalletBalance = user[fromWallet]?.balance || 0;
        if (fromWalletBalance < amount) {
            return res.status(400).json({
                success: false,
                message: `Insufficient balance in ${fromWallet} wallet. Available: ${fromWalletBalance}`
            });
        }

        // Perform transfer
        user[fromWallet].balance -= amount;
        user[toWallet].balance += amount;

        // Add transaction records
        const transferDate = new Date();
        
        // Debit transaction
        user[fromWallet].transactions.push({
            type: 'transfer',
            amount: -amount,
            description: `Transfer to ${toWallet} wallet`,
            date: transferDate,
            status: 'approved'
        });

        // Credit transaction
        user[toWallet].transactions.push({
            type: 'transfer',
            amount: amount,
            description: `Transfer from ${fromWallet} wallet`,
            date: transferDate,
            status: 'approved'
        });

        await user.save();

        res.json({
            success: true,
            message: 'Transfer completed successfully',
            data: {
                fromWallet,
                toWallet,
                amount,
                newBalances: {
                    [fromWallet]: user[fromWallet].balance,
                    [toWallet]: user[toWallet].balance
                }
            }
        });
    } catch (error) {
        console.error('Error transferring between wallets:', error);
        res.status(500).json({
            success: false,
            message: 'Error transferring between wallets',
            error: error.message
        });
    }
});

// Transfer to Another User's Normal Wallet
router.post('/transfer-to-user', auth, async (req, res) => {
    try {
        const { fromWallet, referralCode, amount } = req.body;

        // Validate input
        if (!fromWallet || !referralCode || !amount) {
            return res.status(400).json({
                success: false,
                message: 'From wallet, referral code, and amount are required.'
            });
        }

        if (amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Amount must be greater than 0.'
            });
        }

        // Validate wallet type
        if (!['investmentWallet', 'normalWallet'].includes(fromWallet)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid wallet type. Use "investmentWallet" or "normalWallet".'
            });
        }

        // Find the target user by referral code
        const targetUser = await User.findOne({ referralCode });
        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: 'User with this referral code not found.'
            });
        }

        // Prevent self-transfer
        if (targetUser._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Cannot transfer to yourself.'
            });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        // Check if user has sufficient balance in fromWallet
        const fromWalletBalance = user[fromWallet]?.balance || 0;
        if (fromWalletBalance < amount) {
            return res.status(400).json({
                success: false,
                message: `Insufficient balance in ${fromWallet}. Available: ${fromWalletBalance}, Required: ${amount}`,
                data: {
                    availableBalance: fromWalletBalance,
                    requiredAmount: amount,
                    shortfall: amount - fromWalletBalance,
                    walletType: fromWallet
                }
            });
        }

        // Ensure target user has normal wallet initialized
        if (!targetUser.normalWallet) {
            targetUser.normalWallet = { balance: 0, transactions: [] };
        }

        // Perform transfer
        user[fromWallet].balance -= amount;
        targetUser.normalWallet.balance += amount;

        // Add transaction records
        const transferDate = new Date();
        
        // Debit transaction for sender
        user[fromWallet].transactions.push({
            type: 'transfer_to_user',
            amount: -amount,
            description: `Transfer to ${targetUser.name} (${referralCode})`,
            date: transferDate,
            status: 'approved'
        });

        // Credit transaction for receiver
        targetUser.normalWallet.transactions.push({
            type: 'transfer_from_user',
            amount: amount,
            description: `Transfer from ${user.name} (${user.referralCode})`,
            date: transferDate,
            status: 'approved'
        });

        await user.save();
        await targetUser.save();

        res.json({
            success: true,
            message: 'Transfer to user completed successfully',
            data: {
                fromWallet,
                targetUser: {
                    name: targetUser.name,
                    email: targetUser.email,
                    referralCode: targetUser.referralCode
                },
                amount,
                newBalance: user[fromWallet].balance,
                transferDetails: {
                    fromWalletBalance: user[fromWallet].balance,
                    targetUserNewBalance: targetUser.normalWallet.balance,
                    transferDate: transferDate
                }
            }
        });
    } catch (error) {
        console.error('Error transferring to user:', error);
        res.status(500).json({
            success: false,
            message: 'Error transferring to user',
            error: error.message
        });
    }
});

// Get User Details by Referral Code
router.get('/user-by-referral/:referralCode', auth, async (req, res) => {
    try {
        const { referralCode } = req.params;

        if (!referralCode) {
            return res.status(400).json({
                success: false,
                message: 'Referral code is required.'
            });
        }

        const targetUser = await User.findOne({ referralCode })
            .select('name email referralCode normalWallet investmentWallet');

        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: 'User with this referral code not found.'
            });
        }

        // Prevent showing own details
        if (targetUser._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Cannot get your own details using this endpoint.'
            });
        }

        res.json({
            success: true,
            data: {
                name: targetUser.name,
                email: targetUser.email,
                referralCode: targetUser.referralCode,
                hasNormalWallet: !!targetUser.normalWallet,
                hasInvestmentWallet: !!targetUser.investmentWallet
            }
        });
    } catch (error) {
        console.error('Error getting user by referral code:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting user details',
            error: error.message
        });
    }
});

// Get Transfer History
router.get('/transfer-history', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Get all transfer transactions from both wallets
        const allTransactions = [
            ...(user.normalWallet?.transactions || []).map(t => ({ ...t.toObject(), wallet: 'normalWallet' })),
            ...(user.investmentWallet?.transactions || []).map(t => ({ ...t.toObject(), wallet: 'investmentWallet' }))
        ];

        // Filter transfer transactions
        const transferTransactions = allTransactions
            .filter(t => t.type === 'transfer' || t.type === 'transfer_to_user' || t.type === 'transfer_from_user')
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        // Apply pagination
        const total = transferTransactions.length;
        const paginatedTransactions = transferTransactions.slice(skip, skip + limit);

        res.json({
            success: true,
            data: {
                transactions: paginatedTransactions,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Error getting transfer history:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting transfer history',
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

// Get Wallet Balance for Transfer
router.get('/wallet-balance/:walletType', auth, async (req, res) => {
    try {
        const { walletType } = req.params;
        
        if (!['investmentWallet', 'normalWallet'].includes(walletType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid wallet type. Use "investmentWallet" or "normalWallet".'
            });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        const balance = user[walletType]?.balance || 0;
        const transactions = user[walletType]?.transactions || [];

        res.json({
            success: true,
            data: {
                walletType,
                balance,
                transactionCount: transactions.length,
                lastTransaction: transactions.length > 0 ? transactions[transactions.length - 1] : null
            }
        });
    } catch (error) {
        console.error('Error getting wallet balance:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting wallet balance',
            error: error.message
        });
    }
});

// Validate Transfer Request
router.post('/validate-transfer', auth, async (req, res) => {
    try {
        const { fromWallet, referralCode, amount } = req.body;

        // Validate input
        if (!fromWallet || !referralCode || !amount) {
            return res.status(400).json({
                success: false,
                message: 'From wallet, referral code, and amount are required.'
            });
        }

        if (amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Amount must be greater than 0.'
            });
        }

        // Validate wallet type
        if (!['investmentWallet', 'normalWallet'].includes(fromWallet)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid wallet type. Use "investmentWallet" or "normalWallet".'
            });
        }

        // Find the target user by referral code
        const targetUser = await User.findOne({ referralCode });
        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: 'User with this referral code not found.'
            });
        }

        // Prevent self-transfer
        if (targetUser._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Cannot transfer to yourself.'
            });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        // Check if user has sufficient balance in fromWallet
        const fromWalletBalance = user[fromWallet]?.balance || 0;
        const canTransfer = fromWalletBalance >= amount;

        res.json({
            success: true,
            data: {
                canTransfer,
                validation: {
                    fromWallet,
                    referralCode,
                    amount,
                    availableBalance: fromWalletBalance,
                    requiredAmount: amount,
                    shortfall: amount - fromWalletBalance,
                    hasSufficientBalance: canTransfer
                },
                targetUser: {
                    name: targetUser.name,
                    email: targetUser.email,
                    referralCode: targetUser.referralCode
                },
                message: canTransfer 
                    ? 'Transfer is valid and can be processed'
                    : `Insufficient balance. Available: ${fromWalletBalance}, Required: ${amount}`
            }
        });
    } catch (error) {
        console.error('Error validating transfer:', error);
        res.status(500).json({
            success: false,
            message: 'Error validating transfer',
            error: error.message
        });
    }
});

// Get user's teams (matrix levels and direct referrals)
router.get('/my-teams', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get direct referrals (level 1)
        const directReferrals = await User.find({ referredBy: userId })
            .select('name email phone referralCode normalWallet.balance investmentWallet.balance createdAt')
            .sort({ createdAt: -1 });

        // Get matrix levels (level 2, 3, 4, 5, etc.)
        const matrixLevels = [];
        
        // Level 2 - Referrals of direct referrals
        const level2Users = await User.find({
            referredBy: { $in: directReferrals.map(user => user._id) }
        }).select('name email phone referralCode normalWallet.balance investmentWallet.balance createdAt referredBy');

        // Level 3 - Referrals of level 2 users
        const level3Users = await User.find({
            referredBy: { $in: level2Users.map(user => user._id) }
        }).select('name email phone referralCode normalWallet.balance investmentWallet.balance createdAt referredBy');

        // Level 4 - Referrals of level 3 users
        const level4Users = await User.find({
            referredBy: { $in: level3Users.map(user => user._id) }
        }).select('name email phone referralCode normalWallet.balance investmentWallet.balance createdAt referredBy');

        // Level 5 - Referrals of level 4 users
        const level5Users = await User.find({
            referredBy: { $in: level4Users.map(user => user._id) }
        }).select('name email phone referralCode normalWallet.balance investmentWallet.balance createdAt referredBy');

        // Organize matrix levels (including Level 1)
        matrixLevels.push({
            level: 1,
            users: directReferrals.map(user => ({
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                referralCode: user.referralCode,
                normalWalletBalance: user.normalWallet.balance,
                investmentWalletBalance: user.investmentWallet.balance,
                joinedDate: user.createdAt,
                upline: req.user.name
            }))
        });

        matrixLevels.push({
            level: 2,
            users: level2Users.map(user => ({
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                referralCode: user.referralCode,
                normalWalletBalance: user.normalWallet.balance,
                investmentWalletBalance: user.investmentWallet.balance,
                joinedDate: user.createdAt,
                upline: directReferrals.find(ref => ref._id.toString() === user.referredBy.toString())?.name || 'Unknown'
            }))
        });

        matrixLevels.push({
            level: 3,
            users: level3Users.map(user => ({
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                referralCode: user.referralCode,
                normalWalletBalance: user.normalWallet.balance,
                investmentWalletBalance: user.investmentWallet.balance,
                joinedDate: user.createdAt,
                upline: level2Users.find(ref => ref._id.toString() === user.referredBy.toString())?.name || 'Unknown'
            }))
        });

        matrixLevels.push({
            level: 4,
            users: level4Users.map(user => ({
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                referralCode: user.referralCode,
                normalWalletBalance: user.normalWallet.balance,
                investmentWalletBalance: user.investmentWallet.balance,
                joinedDate: user.createdAt,
                upline: level3Users.find(ref => ref._id.toString() === user.referredBy.toString())?.name || 'Unknown'
            }))
        });

        matrixLevels.push({
            level: 5,
            users: level5Users.map(user => ({
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                referralCode: user.referralCode,
                normalWalletBalance: user.normalWallet.balance,
                investmentWalletBalance: user.investmentWallet.balance,
                joinedDate: user.createdAt,
                upline: level4Users.find(ref => ref._id.toString() === user.referredBy.toString())?.name || 'Unknown'
            }))
        });

        // Calculate team statistics
        const teamStats = {
            directReferrals: directReferrals.length,
            totalMatrixUsers: directReferrals.length + level2Users.length + level3Users.length + level4Users.length + level5Users.length,
            totalTeamMembers: directReferrals.length + level2Users.length + level3Users.length + level4Users.length + level5Users.length,
            totalNormalWalletBalance: directReferrals.reduce((sum, user) => sum + user.normalWallet.balance, 0) +
                                    level2Users.reduce((sum, user) => sum + user.normalWallet.balance, 0) +
                                    level3Users.reduce((sum, user) => sum + user.normalWallet.balance, 0) +
                                    level4Users.reduce((sum, user) => sum + user.normalWallet.balance, 0) +
                                    level5Users.reduce((sum, user) => sum + user.normalWallet.balance, 0),
            totalInvestmentWalletBalance: directReferrals.reduce((sum, user) => sum + user.investmentWallet.balance, 0) +
                                        level2Users.reduce((sum, user) => sum + user.investmentWallet.balance, 0) +
                                        level3Users.reduce((sum, user) => sum + user.investmentWallet.balance, 0) +
                                        level4Users.reduce((sum, user) => sum + user.investmentWallet.balance, 0) +
                                        level5Users.reduce((sum, user) => sum + user.investmentWallet.balance, 0)
        };

        // Format direct referrals
        const formattedDirectReferrals = directReferrals.map(user => ({
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            referralCode: user.referralCode,
            normalWalletBalance: user.normalWallet.balance,
            investmentWalletBalance: user.investmentWallet.balance,
            joinedDate: user.createdAt,
            level: 1,
            upline: req.user.name
        }));

        res.json({
            success: true,
            message: 'Team data retrieved successfully',
            data: {
                user: {
                    id: req.user._id,
                    name: req.user.name,
                    email: req.user.email,
                    referralCode: req.user.referralCode
                },
                directReferrals: formattedDirectReferrals,
                matrixLevels: matrixLevels,
                teamStats: teamStats
            }
        });

    } catch (error) {
        console.error('Error fetching team data:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching team data',
            error: error.message
        });
    }
});

// Get detailed team member information
router.get('/team-member/:memberId', auth, async (req, res) => {
    try {
        const { memberId } = req.params;
        const userId = req.user.id;

        // Check if the member is in user's team
        const member = await User.findById(memberId);
        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Team member not found'
            });
        }

        // Check if member is in user's team (direct referral or matrix)
        const isInTeam = await checkIfInTeam(userId, memberId);
        if (!isInTeam) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. User is not in your team.'
            });
        }

        // Get member's direct referrals
        const memberDirectReferrals = await User.find({ referredBy: memberId })
            .select('name email phone referralCode normalWallet.balance investmentWallet.balance createdAt')
            .sort({ createdAt: -1 });

        // Get member's level in user's team
        const memberLevel = await getMemberLevel(userId, memberId);

        res.json({
            success: true,
            data: {
                member: {
                    id: member._id,
                    name: member.name,
                    email: member.email,
                    phone: member.phone,
                    referralCode: member.referralCode,
                    normalWalletBalance: member.normalWallet.balance,
                    investmentWalletBalance: member.investmentWallet.balance,
                    joinedDate: member.createdAt,
                    level: memberLevel,
                    upline: await getUplineName(member.referredBy)
                },
                directReferrals: memberDirectReferrals.map(user => ({
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    referralCode: user.referralCode,
                    normalWalletBalance: user.normalWallet.balance,
                    investmentWalletBalance: user.investmentWallet.balance,
                    joinedDate: user.createdAt
                }))
            }
        });

    } catch (error) {
        console.error('Error fetching team member details:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching team member details',
            error: error.message
        });
    }
});

// Helper function to check if a user is in another user's team
async function checkIfInTeam(teamOwnerId, memberId) {
    if (teamOwnerId.toString() === memberId.toString()) {
        return true;
    }

    // Check direct referrals
    const directReferral = await User.findOne({ _id: memberId, referredBy: teamOwnerId });
    if (directReferral) {
        return true;
    }

    // Check matrix levels
    const directReferrals = await User.find({ referredBy: teamOwnerId }).select('_id');
    const directReferralIds = directReferrals.map(user => user._id);

    // Level 2
    const level2User = await User.findOne({ _id: memberId, referredBy: { $in: directReferralIds } });
    if (level2User) {
        return true;
    }

    // Level 3
    const level2Users = await User.find({ referredBy: { $in: directReferralIds } }).select('_id');
    const level2UserIds = level2Users.map(user => user._id);
    const level3User = await User.findOne({ _id: memberId, referredBy: { $in: level2UserIds } });
    if (level3User) {
        return true;
    }

    // Level 4
    const level3Users = await User.find({ referredBy: { $in: level2UserIds } }).select('_id');
    const level3UserIds = level3Users.map(user => user._id);
    const level4User = await User.findOne({ _id: memberId, referredBy: { $in: level3UserIds } });
    if (level4User) {
        return true;
    }

    // Level 5
    const level4Users = await User.find({ referredBy: { $in: level3UserIds } }).select('_id');
    const level4UserIds = level4Users.map(user => user._id);
    const level5User = await User.findOne({ _id: memberId, referredBy: { $in: level4UserIds } });
    if (level5User) {
        return true;
    }

    return false;
}

// Helper function to get member's level in team
async function getMemberLevel(teamOwnerId, memberId) {
    if (teamOwnerId.toString() === memberId.toString()) {
        return 0; // Team owner
    }

    // Check direct referrals (level 1)
    const directReferral = await User.findOne({ _id: memberId, referredBy: teamOwnerId });
    if (directReferral) {
        return 1;
    }

    // Check matrix levels
    const directReferrals = await User.find({ referredBy: teamOwnerId }).select('_id');
    const directReferralIds = directReferrals.map(user => user._id);

    // Level 2
    const level2User = await User.findOne({ _id: memberId, referredBy: { $in: directReferralIds } });
    if (level2User) {
        return 2;
    }

    // Level 3
    const level2Users = await User.find({ referredBy: { $in: directReferralIds } }).select('_id');
    const level2UserIds = level2Users.map(user => user._id);
    const level3User = await User.findOne({ _id: memberId, referredBy: { $in: level2UserIds } });
    if (level3User) {
        return 3;
    }

    // Level 4
    const level3Users = await User.find({ referredBy: { $in: level2UserIds } }).select('_id');
    const level3UserIds = level3Users.map(user => user._id);
    const level4User = await User.findOne({ _id: memberId, referredBy: { $in: level3UserIds } });
    if (level4User) {
        return 4;
    }

    // Level 5
    const level4Users = await User.find({ referredBy: { $in: level3UserIds } }).select('_id');
    const level4UserIds = level4Users.map(user => user._id);
    const level5User = await User.findOne({ _id: memberId, referredBy: { $in: level4UserIds } });
    if (level5User) {
        return 5;
    }

    return null;
}

// Helper function to get upline name
async function getUplineName(uplineId) {
    if (!uplineId) {
        return 'Direct Signup';
    }
    
    const upline = await User.findById(uplineId).select('name');
    return upline ? upline.name : 'Unknown';
}

// Get team income and statistics
router.get('/team-income', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get direct referrals (level 1)
        const directReferrals = await User.find({ referredBy: userId })
            .select('name email phone referralCode normalWallet.balance investmentWallet.balance dailyIncome createdAt');

        // Get matrix levels (level 2, 3, 4, 5)
        const level2Users = await User.find({
            referredBy: { $in: directReferrals.map(user => user._id) }
        }).select('name email phone referralCode normalWallet.balance investmentWallet.balance dailyIncome createdAt referredBy');

        const level3Users = await User.find({
            referredBy: { $in: level2Users.map(user => user._id) }
        }).select('name email phone referralCode normalWallet.balance investmentWallet.balance dailyIncome createdAt referredBy');

        const level4Users = await User.find({
            referredBy: { $in: level3Users.map(user => user._id) }
        }).select('name email phone referralCode normalWallet.balance investmentWallet.balance dailyIncome createdAt referredBy');

        const level5Users = await User.find({
            referredBy: { $in: level4Users.map(user => user._id) }
        }).select('name email phone referralCode normalWallet.balance investmentWallet.balance dailyIncome createdAt referredBy');

        // Calculate team income by level
        const teamIncomeByLevel = {
            level1: {
                count: directReferrals.length,
                totalNormalWallet: directReferrals.reduce((sum, user) => sum + user.normalWallet.balance, 0),
                totalInvestmentWallet: directReferrals.reduce((sum, user) => sum + user.investmentWallet.balance, 0),
                totalDailyIncome: directReferrals.reduce((sum, user) => sum + user.dailyIncome.totalEarned, 0),
                users: directReferrals.map(user => ({
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    referralCode: user.referralCode,
                    normalWalletBalance: user.normalWallet.balance,
                    investmentWalletBalance: user.investmentWallet.balance,
                    dailyIncomeEarned: user.dailyIncome.totalEarned,
                    joinedDate: user.createdAt
                }))
            },
            level2: {
                count: level2Users.length,
                totalNormalWallet: level2Users.reduce((sum, user) => sum + user.normalWallet.balance, 0),
                totalInvestmentWallet: level2Users.reduce((sum, user) => sum + user.investmentWallet.balance, 0),
                totalDailyIncome: level2Users.reduce((sum, user) => sum + user.dailyIncome.totalEarned, 0),
                users: level2Users.map(user => ({
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    referralCode: user.referralCode,
                    normalWalletBalance: user.normalWallet.balance,
                    investmentWalletBalance: user.investmentWallet.balance,
                    dailyIncomeEarned: user.dailyIncome.totalEarned,
                    joinedDate: user.createdAt,
                    upline: directReferrals.find(ref => ref._id.toString() === user.referredBy.toString())?.name || 'Unknown'
                }))
            },
            level3: {
                count: level3Users.length,
                totalNormalWallet: level3Users.reduce((sum, user) => sum + user.normalWallet.balance, 0),
                totalInvestmentWallet: level3Users.reduce((sum, user) => sum + user.investmentWallet.balance, 0),
                totalDailyIncome: level3Users.reduce((sum, user) => sum + user.dailyIncome.totalEarned, 0),
                users: level3Users.map(user => ({
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    referralCode: user.referralCode,
                    normalWalletBalance: user.normalWallet.balance,
                    investmentWalletBalance: user.investmentWallet.balance,
                    dailyIncomeEarned: user.dailyIncome.totalEarned,
                    joinedDate: user.createdAt,
                    upline: level2Users.find(ref => ref._id.toString() === user.referredBy.toString())?.name || 'Unknown'
                }))
            },
            level4: {
                count: level4Users.length,
                totalNormalWallet: level4Users.reduce((sum, user) => sum + user.normalWallet.balance, 0),
                totalInvestmentWallet: level4Users.reduce((sum, user) => sum + user.investmentWallet.balance, 0),
                totalDailyIncome: level4Users.reduce((sum, user) => sum + user.dailyIncome.totalEarned, 0),
                users: level4Users.map(user => ({
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    referralCode: user.referralCode,
                    normalWalletBalance: user.normalWallet.balance,
                    investmentWalletBalance: user.investmentWallet.balance,
                    dailyIncomeEarned: user.dailyIncome.totalEarned,
                    joinedDate: user.createdAt,
                    upline: level3Users.find(ref => ref._id.toString() === user.referredBy.toString())?.name || 'Unknown'
                }))
            },
            level5: {
                count: level5Users.length,
                totalNormalWallet: level5Users.reduce((sum, user) => sum + user.normalWallet.balance, 0),
                totalInvestmentWallet: level5Users.reduce((sum, user) => sum + user.investmentWallet.balance, 0),
                totalDailyIncome: level5Users.reduce((sum, user) => sum + user.dailyIncome.totalEarned, 0),
                users: level5Users.map(user => ({
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    referralCode: user.referralCode,
                    normalWalletBalance: user.normalWallet.balance,
                    investmentWalletBalance: user.investmentWallet.balance,
                    dailyIncomeEarned: user.dailyIncome.totalEarned,
                    joinedDate: user.createdAt,
                    upline: level4Users.find(ref => ref._id.toString() === user.referredBy.toString())?.name || 'Unknown'
                }))
            }
        };

        // Calculate total team statistics
        const totalTeamMembers = directReferrals.length + level2Users.length + level3Users.length + level4Users.length + level5Users.length;
        const totalNormalWalletBalance = teamIncomeByLevel.level1.totalNormalWallet + 
                                       teamIncomeByLevel.level2.totalNormalWallet + 
                                       teamIncomeByLevel.level3.totalNormalWallet + 
                                       teamIncomeByLevel.level4.totalNormalWallet + 
                                       teamIncomeByLevel.level5.totalNormalWallet;
        const totalInvestmentWalletBalance = teamIncomeByLevel.level1.totalInvestmentWallet + 
                                           teamIncomeByLevel.level2.totalInvestmentWallet + 
                                           teamIncomeByLevel.level3.totalInvestmentWallet + 
                                           teamIncomeByLevel.level4.totalInvestmentWallet + 
                                           teamIncomeByLevel.level5.totalInvestmentWallet;
        const totalTeamIncome = teamIncomeByLevel.level1.totalDailyIncome + 
                               teamIncomeByLevel.level2.totalDailyIncome + 
                               teamIncomeByLevel.level3.totalDailyIncome + 
                               teamIncomeByLevel.level4.totalDailyIncome + 
                               teamIncomeByLevel.level5.totalDailyIncome;

        res.json({
            success: true,
            message: 'Team income data retrieved successfully',
            data: {
                user: {
                    id: req.user._id,
                    name: req.user.name,
                    email: req.user.email,
                    referralCode: req.user.referralCode
                },
                teamIncomeByLevel: teamIncomeByLevel,
                totalTeamMembers: totalTeamMembers,
                totalTeamIncome: totalTeamIncome,
                totalNormalWalletBalance: totalNormalWalletBalance,
                totalInvestmentWalletBalance: totalInvestmentWalletBalance,
                summary: {
                    level1Members: teamIncomeByLevel.level1.count,
                    level2Members: teamIncomeByLevel.level2.count,
                    level3Members: teamIncomeByLevel.level3.count,
                    level4Members: teamIncomeByLevel.level4.count,
                    level5Members: teamIncomeByLevel.level5.count,
                    totalMembers: totalTeamMembers,
                    totalIncome: totalTeamIncome,
                    totalNormalWallet: totalNormalWalletBalance,
                    totalInvestmentWallet: totalInvestmentWalletBalance
                }
            }
        });

    } catch (error) {
        console.error('Error fetching team income data:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching team income data',
            error: error.message
        });
    }
});

// Get user activity and transactions
router.get('/activity', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20, type } = req.query;
        
        const skip = (page - 1) * limit;
        
        // Get user with all transaction data
        const user = await User.findById(userId)
            .populate('referredBy', 'name email referralCode')
            .populate('deposits');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get all deposits for the user
        const Deposit = require('../models/deposit.model');
        const deposits = await Deposit.find({ userId: userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Get total deposits count
        const totalDeposits = await Deposit.countDocuments({ userId: userId });

        // Get user's investments
        const { UserInvestment } = require('../models/investment.model');
        const investments = await UserInvestment.find({ userId: userId })
            .populate('planId', 'title description')
            .sort({ createdAt: -1 });

        // Calculate daily income statistics
        const dailyIncomeStats = {
            totalEarned: user.dailyIncome.totalEarned,
            todayEarned: user.dailyIncome.todayEarned,
            lastClaimed: user.dailyIncome.lastClaimed,
            canClaimToday: !user.dailyIncome.lastClaimed || 
                          new Date().toDateString() !== new Date(user.dailyIncome.lastClaimed).toDateString()
        };

        // Calculate wallet statistics
        const walletStats = {
            normalWallet: {
                balance: user.normalWallet.balance,
                totalTransactions: user.normalWallet.transactions.length,
                totalDeposits: user.normalWallet.transactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0),
                totalWithdrawals: user.normalWallet.transactions.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + Math.abs(t.amount), 0),
                totalTransfers: user.normalWallet.transactions.filter(t => t.type === 'transfer' || t.type === 'transfer_to_user' || t.type === 'transfer_from_user').reduce((sum, t) => sum + Math.abs(t.amount), 0),
                totalReferralBonus: user.normalWallet.transactions.filter(t => t.type === 'referral_bonus').reduce((sum, t) => sum + t.amount, 0),
                totalDailyIncome: user.normalWallet.transactions.filter(t => t.type === 'daily_income').reduce((sum, t) => sum + t.amount, 0)
            },
            investmentWallet: {
                balance: user.investmentWallet.balance,
                totalTransactions: user.investmentWallet.transactions.length,
                totalDeposits: user.investmentWallet.transactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0),
                totalWithdrawals: user.investmentWallet.transactions.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + Math.abs(t.amount), 0),
                totalTransfers: user.investmentWallet.transactions.filter(t => t.type === 'transfer' || t.type === 'transfer_to_user' || t.type === 'transfer_from_user').reduce((sum, t) => sum + Math.abs(t.amount), 0),
                totalReferralBonus: user.investmentWallet.transactions.filter(t => t.type === 'referral_bonus').reduce((sum, t) => sum + t.amount, 0),
                totalCommission: user.investmentWallet.transactions.filter(t => t.type === 'commission').reduce((sum, t) => sum + t.amount, 0)
            }
        };

        // Get recent transactions (combined from both wallets)
        const allTransactions = [
            ...user.normalWallet.transactions.map(t => ({
                ...t.toObject(),
                walletType: 'normalWallet',
                walletName: 'Normal Wallet'
            })),
            ...user.investmentWallet.transactions.map(t => ({
                ...t.toObject(),
                walletType: 'investmentWallet',
                walletName: 'Investment Wallet'
            }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date));

        // Filter transactions by type if specified
        let filteredTransactions = allTransactions;
        if (type) {
            filteredTransactions = allTransactions.filter(t => t.type === type);
        }

        // Paginate transactions
        const paginatedTransactions = filteredTransactions.slice(skip, skip + parseInt(limit));

        // Calculate investment statistics
        const investmentStats = {
            totalInvestments: investments.length,
            activeInvestments: investments.filter(inv => !inv.isCompleted).length,
            completedInvestments: investments.filter(inv => inv.isCompleted).length,
            totalInvested: investments.reduce((sum, inv) => sum + inv.investmentAmount, 0),
            totalEarned: investments.reduce((sum, inv) => sum + inv.totalEarned, 0),
            totalWithdrawn: investments.filter(inv => inv.isWithdrawn).reduce((sum, inv) => sum + inv.investmentAmount + inv.totalEarned, 0)
        };

        // Get referral statistics
        const referralStats = {
            directReferrals: await User.countDocuments({ referredBy: userId }),
            totalReferralBonus: walletStats.normalWallet.totalReferralBonus + walletStats.investmentWallet.totalReferralBonus,
            referralCode: user.referralCode,
            referredBy: user.referredBy ? {
                name: user.referredBy.name,
                email: user.referredBy.email,
                referralCode: user.referredBy.referralCode
            } : null
        };

        res.json({
            success: true,
            message: 'User activity data retrieved successfully',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    referralCode: user.referralCode,
                    role: user.role,
                    isBlocked: user.isBlocked,
                    isActive: user.isActive,
                    createdAt: user.createdAt
                },
                dailyIncome: dailyIncomeStats,
                wallets: walletStats,
                investments: {
                    stats: investmentStats,
                    activeInvestments: investments.filter(inv => !inv.isCompleted),
                    completedInvestments: investments.filter(inv => inv.isCompleted)
                },
                referrals: referralStats,
                deposits: {
                    data: deposits,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: totalDeposits,
                        pages: Math.ceil(totalDeposits / limit)
                    }
                },
                transactions: {
                    data: paginatedTransactions,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: filteredTransactions.length,
                        pages: Math.ceil(filteredTransactions.length / limit)
                    }
                },
                summary: {
                    totalBalance: user.normalWallet.balance + user.investmentWallet.balance,
                    totalTransactions: allTransactions.length,
                    totalDeposits: deposits.length,
                    totalInvestments: investments.length,
                    totalDailyIncomeEarned: user.dailyIncome.totalEarned,
                    totalReferralBonus: referralStats.totalReferralBonus
                }
            }
        });

    } catch (error) {
        console.error('Error fetching user activity:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user activity',
            error: error.message
        });
    }
});

// Get user's transaction history with filters
router.get('/transactions', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20, type, walletType, status } = req.query;
        
        const skip = (page - 1) * limit;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get transactions from specified wallet or both
        let transactions = [];
        if (walletType === 'normalWallet' || !walletType) {
            transactions.push(...user.normalWallet.transactions.map(t => ({
                ...t.toObject(),
                walletType: 'normalWallet',
                walletName: 'Normal Wallet'
            })));
        }
        
        if (walletType === 'investmentWallet' || !walletType) {
            transactions.push(...user.investmentWallet.transactions.map(t => ({
                ...t.toObject(),
                walletType: 'investmentWallet',
                walletName: 'Investment Wallet'
            })));
        }

        // Sort by date (newest first)
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Apply filters
        let filteredTransactions = transactions;
        
        if (type) {
            filteredTransactions = filteredTransactions.filter(t => t.type === type);
        }
        
        if (status) {
            filteredTransactions = filteredTransactions.filter(t => t.status === status);
        }

        // Paginate
        const paginatedTransactions = filteredTransactions.slice(skip, skip + parseInt(limit));

        // Calculate transaction statistics
        const transactionStats = {
            total: filteredTransactions.length,
            byType: {
                deposit: filteredTransactions.filter(t => t.type === 'deposit').length,
                withdrawal: filteredTransactions.filter(t => t.type === 'withdrawal').length,
                transfer: filteredTransactions.filter(t => t.type === 'transfer').length,
                transfer_to_user: filteredTransactions.filter(t => t.type === 'transfer_to_user').length,
                transfer_from_user: filteredTransactions.filter(t => t.type === 'transfer_from_user').length,
                referral_bonus: filteredTransactions.filter(t => t.type === 'referral_bonus').length,
                daily_income: filteredTransactions.filter(t => t.type === 'daily_income').length,
                commission: filteredTransactions.filter(t => t.type === 'commission').length
            },
            byStatus: {
                pending: filteredTransactions.filter(t => t.status === 'pending').length,
                approved: filteredTransactions.filter(t => t.status === 'approved').length,
                rejected: filteredTransactions.filter(t => t.status === 'rejected').length
            },
            totalAmount: {
                deposits: filteredTransactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0),
                withdrawals: filteredTransactions.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + Math.abs(t.amount), 0),
                transfers: filteredTransactions.filter(t => t.type.includes('transfer')).reduce((sum, t) => sum + Math.abs(t.amount), 0),
                bonuses: filteredTransactions.filter(t => t.type === 'referral_bonus').reduce((sum, t) => sum + t.amount, 0),
                dailyIncome: filteredTransactions.filter(t => t.type === 'daily_income').reduce((sum, t) => sum + t.amount, 0)
            }
        };

        res.json({
            success: true,
            message: 'Transaction history retrieved successfully',
            data: {
                transactions: paginatedTransactions,
                stats: transactionStats,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: filteredTransactions.length,
                    pages: Math.ceil(filteredTransactions.length / limit),
                    hasNextPage: skip + parseInt(limit) < filteredTransactions.length,
                    hasPrevPage: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Error fetching transaction history:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching transaction history',
            error: error.message
        });
    }
});

module.exports = router;
