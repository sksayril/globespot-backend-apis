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
            referralLevel: referredBy ? 1 : 0,
            normalWallet: {
                balance: 1, // Default $1 balance for new users
                transactions: [{
                    type: 'deposit',
                    amount: 1,
                    description: 'Welcome bonus - $1 signup bonus',
                    date: new Date(),
                    status: 'approved'
                }]
            }
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
            { expiresIn: '365d' }
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
            { expiresIn: '365d' }
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
        const potentialDailyIncome = user.normalWallet.balance * 0.005;
        
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
        
        // Calculate daily income (0.5% of normal wallet balance)
        const dailyIncomeAmount = user.normalWallet.balance * 0.005; // 0.5% = 0.005
        
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
            description: 'Daily income credit (0.5% of normal wallet balance)',
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
        const potentialDailyIncome = user.normalWallet.balance * 0.005;
        
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
                message: 'User not found'
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
                message: 'User not found'
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

// Get team income and statistics with level-based calculations
router.get('/team-income', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const Level = require('../models/level.model');
        
        // Get user's level information
        const userLevel = await Level.findOne({ userId });
        
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

        // Calculate level-based team income using LevelService
        const LevelService = require('../services/levelService');
        const characterLevelIncome = await LevelService.calculateCharacterLevelIncome(userId);
        const digitLevelIncome = await LevelService.calculateDigitLevelIncome(userId);

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

        // Calculate daily team income (level-based)
        const dailyTeamIncome = characterLevelIncome + digitLevelIncome;

        res.json({
            success: true,
            message: 'Team income data retrieved successfully',
            data: {
                user: {
                    id: req.user._id,
                    name: req.user.name,
                    email: req.user.email,
                    referralCode: req.user.referralCode,
                    characterLevel: userLevel?.characterLevel?.current || null,
                    digitLevel: userLevel?.digitLevel?.current || null
                },
                levelBasedIncome: {
                    characterLevelIncome: characterLevelIncome,
                    digitLevelIncome: digitLevelIncome,
                    totalDailyTeamIncome: dailyTeamIncome,
                    characterLevel: userLevel?.characterLevel?.current || null,
                    digitLevel: userLevel?.digitLevel?.current || null
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
                    totalInvestmentWallet: totalInvestmentWalletBalance,
                    dailyTeamIncome: dailyTeamIncome
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

// Get team income status (daily team income that can be claimed)
router.get('/team-income-status', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const Level = require('../models/level.model');
        
        // Get user's level information
        const userLevel = await Level.findOne({ userId });
        
        // Calculate level-based team income using LevelService
        const LevelService = require('../services/levelService');
        const characterLevelIncome = await LevelService.calculateCharacterLevelIncome(userId);
        const digitLevelIncome = await LevelService.calculateDigitLevelIncome(userId);

        const dailyTeamIncome = characterLevelIncome + digitLevelIncome;
        
        // Check if user can claim team income today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let canClaimTeamIncome = true;
        let message = 'You can claim your team income';
        
        if (userLevel?.dailyIncome?.lastClaimed) {
            const lastClaimed = new Date(userLevel.dailyIncome.lastClaimed);
            lastClaimed.setHours(0, 0, 0, 0);
            
            if (lastClaimed.getTime() === today.getTime()) {
                canClaimTeamIncome = false;
                message = 'Team income already claimed today';
            }
        }
        
        res.json({
            success: true,
            data: {
                canClaim: canClaimTeamIncome,
                message: message,
                dailyTeamIncome: dailyTeamIncome,
                characterLevelIncome: characterLevelIncome,
                digitLevelIncome: digitLevelIncome,
                characterLevel: userLevel?.characterLevel?.current || null,
                digitLevel: userLevel?.digitLevel?.current || null,
                lastClaimed: userLevel?.dailyIncome?.lastClaimed || null,
                totalEarned: {
                    characterLevel: userLevel?.characterLevel?.totalEarned || 0,
                    digitLevel: userLevel?.digitLevel?.totalEarned || 0
                }
            }
        });
    } catch (error) {
        console.error('Error fetching team income status:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching team income status',
            error: error.message
        });
    }
});

// Claim team income
router.post('/claim-team-income', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const Level = require('../models/level.model');
        
        // Get user's level information
        const userLevel = await Level.findOne({ userId });
        
        // Check if user can claim team income today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (userLevel?.dailyIncome?.lastClaimed) {
            const lastClaimed = new Date(userLevel.dailyIncome.lastClaimed);
            lastClaimed.setHours(0, 0, 0, 0);
            
            if (lastClaimed.getTime() === today.getTime()) {
                return res.status(400).json({
                    success: false,
                    message: 'Team income already claimed today. Please try again tomorrow.',
                    data: {
                        lastClaimed: userLevel.dailyIncome.lastClaimed
                    }
                });
            }
        }
        
        // Calculate level-based team income using LevelService
        const LevelService = require('../services/levelService');
        const characterLevelIncome = await LevelService.calculateCharacterLevelIncome(userId);
        const digitLevelIncome = await LevelService.calculateDigitLevelIncome(userId);

        const dailyTeamIncome = characterLevelIncome + digitLevelIncome;
        
        // Validate team criteria before allowing claim
        const user = await User.findById(userId);
        const currentDigitLevel = userLevel?.digitLevel?.current;
        const currentCharacterLevel = userLevel?.characterLevel?.current;
        
        // Check if user has any team members (direct referrals)
        const directMembers = await User.find({ referredBy: userId });
        const directMembersCount = directMembers.length;
        
        // If no direct members, cannot claim team income
        if (directMembersCount === 0) {
            return res.status(400).json({
                success: false,
                message: 'No team members found. Cannot claim team income without building a team.',
                data: {
                    currentLevels: {
                        characterLevel: currentCharacterLevel,
                        digitLevel: currentDigitLevel
                    },
                    teamStatus: {
                        directMembers: 0,
                        required: 'At least 1 direct referral'
                    },
                    dailyTeamIncome: dailyTeamIncome,
                    characterLevelIncome: characterLevelIncome,
                    digitLevelIncome: digitLevelIncome
                }
            });
        }
        
        // Validate digit level criteria if user has digit level
        if (currentDigitLevel) {
            const levelCriteria = userLevel.digitLevel.criteria[currentDigitLevel];
            if (levelCriteria) {
                // Check if direct members meet minimum wallet requirement
                const membersWithMinWallet = directMembers.filter(member => 
                    (member.normalWallet?.balance || 0) >= levelCriteria.memberWalletMin
                ).length;
                
                // Check user's own wallet balance
                const userWalletBalance = user.normalWallet?.balance || 0;
                
                // Validate all criteria
                const criteriaMet = {
                    directMembers: directMembersCount >= levelCriteria.directMembers,
                    memberWalletMin: membersWithMinWallet >= levelCriteria.directMembers,
                    selfWalletMin: userWalletBalance >= levelCriteria.selfWalletMin
                };
                
                const allCriteriaMet = criteriaMet.directMembers && criteriaMet.memberWalletMin && criteriaMet.selfWalletMin;
                
                if (!allCriteriaMet) {
                    return res.status(400).json({
                        success: false,
                        message: 'Digit level team criteria not fulfilled. Cannot claim team income.',
                        data: {
                            currentLevel: currentDigitLevel,
                            criteria: {
                                required: {
                                    directMembers: levelCriteria.directMembers,
                                    memberWalletMin: levelCriteria.memberWalletMin,
                                    selfWalletMin: levelCriteria.selfWalletMin
                                },
                                current: {
                                    directMembers: directMembersCount,
                                    membersWithMinWallet: membersWithMinWallet,
                                    selfWalletBalance: userWalletBalance
                                },
                                met: criteriaMet
                            },
                            dailyTeamIncome: dailyTeamIncome,
                            characterLevelIncome: characterLevelIncome,
                            digitLevelIncome: digitLevelIncome
                        }
                    });
                }
            }
        }
        
        // Validate character level criteria if user has character level
        if (currentCharacterLevel) {
            // For character level, we need at least 1 direct referral with minimum wallet balance
            const membersWithMinWallet = directMembers.filter(member => 
                (member.normalWallet?.balance || 0) >= 50 // Minimum ₹50 wallet balance
            ).length;
            
            if (membersWithMinWallet === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Character level team criteria not fulfilled. Direct referrals must have minimum wallet balance.',
                    data: {
                        currentLevel: currentCharacterLevel,
                        criteria: {
                            required: {
                                directMembers: 'At least 1',
                                memberWalletMin: 50,
                                description: 'Direct referrals must have minimum ₹50 wallet balance'
                            },
                            current: {
                                directMembers: directMembersCount,
                                membersWithMinWallet: membersWithMinWallet,
                                totalDirectMembers: directMembersCount
                            },
                            met: {
                                directMembers: directMembersCount > 0,
                                memberWalletMin: membersWithMinWallet > 0
                            }
                        },
                        dailyTeamIncome: dailyTeamIncome,
                        characterLevelIncome: characterLevelIncome,
                        digitLevelIncome: digitLevelIncome
                    }
                });
            }
        }
        
        if (dailyTeamIncome <= 0) {
            return res.status(400).json({
                success: false,
                message: 'No team income available to claim.',
                data: {
                    dailyTeamIncome: 0,
                    characterLevelIncome: 0,
                    digitLevelIncome: 0
                }
            });
        }
        
        // Credit team income to normal wallet
        user.normalWallet.balance += dailyTeamIncome;
        user.normalWallet.transactions.push({
            type: 'team_income',
            amount: dailyTeamIncome,
            description: `Team income credit (Character: ${characterLevelIncome}, Digit: ${digitLevelIncome})`,
            status: 'approved'
        });
        
        // Update level tracking
        if (!userLevel) {
            // Create new level record if doesn't exist
            const newLevel = new Level({
                userId: userId,
                dailyIncome: {
                    characterLevel: characterLevelIncome,
                    digitLevel: digitLevelIncome,
                    lastClaimed: new Date()
                }
            });
            await newLevel.save();
        } else {
            // Update existing level record
            userLevel.dailyIncome.characterLevel = characterLevelIncome;
            userLevel.dailyIncome.digitLevel = digitLevelIncome;
            userLevel.dailyIncome.lastClaimed = new Date();
            
            // Update total earned
            if (userLevel.characterLevel) {
                userLevel.characterLevel.totalEarned += characterLevelIncome;
            }
            if (userLevel.digitLevel) {
                userLevel.digitLevel.totalEarned += digitLevelIncome;
            }
            
            await userLevel.save();
        }
        
        await user.save();
        
        res.json({
            success: true,
            message: 'Team income claimed successfully',
            data: {
                dailyTeamIncome: dailyTeamIncome,
                characterLevelIncome: characterLevelIncome,
                digitLevelIncome: digitLevelIncome,
                normalWalletBalance: user.normalWallet.balance,
                characterLevel: userLevel?.characterLevel?.current || null,
                digitLevel: userLevel?.digitLevel?.current || null,
                lastClaimed: new Date()
            }
        });
    } catch (error) {
        console.error('Error claiming team income:', error);
        res.status(500).json({
            success: false,
            message: 'Error claiming team income',
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
                totalDailyIncome: user.normalWallet.transactions.filter(t => t.type === 'daily_income').reduce((sum, t) => sum + t.amount, 0),
                totalLevelIncome: user.normalWallet.transactions.filter(t => t.type === 'level_income').reduce((sum, t) => sum + t.amount, 0),
                totalTeamIncome: user.normalWallet.transactions.filter(t => t.type === 'team_income').reduce((sum, t) => sum + t.amount, 0)
            },
            investmentWallet: {
                balance: user.investmentWallet.balance,
                totalTransactions: user.investmentWallet.transactions.length,
                totalDeposits: user.investmentWallet.transactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0),
                totalWithdrawals: user.investmentWallet.transactions.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + Math.abs(t.amount), 0),
                totalTransfers: user.investmentWallet.transactions.filter(t => t.type === 'transfer' || t.type === 'transfer_to_user' || t.type === 'transfer_from_user').reduce((sum, t) => sum + Math.abs(t.amount), 0),
                totalReferralBonus: user.investmentWallet.transactions.filter(t => t.type === 'referral_bonus').reduce((sum, t) => sum + t.amount, 0),
                totalCommission: user.investmentWallet.transactions.filter(t => t.type === 'commission').reduce((sum, t) => sum + t.amount, 0),
                totalLevelIncome: user.investmentWallet.transactions.filter(t => t.type === 'level_income').reduce((sum, t) => sum + t.amount, 0),
                totalTeamIncome: user.investmentWallet.transactions.filter(t => t.type === 'team_income').reduce((sum, t) => sum + t.amount, 0)
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
                level_income: filteredTransactions.filter(t => t.type === 'level_income').length,
                team_income: filteredTransactions.filter(t => t.type === 'team_income').length,
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
                dailyIncome: filteredTransactions.filter(t => t.type === 'daily_income').reduce((sum, t) => sum + t.amount, 0),
                levelIncome: filteredTransactions.filter(t => t.type === 'level_income').reduce((sum, t) => sum + t.amount, 0),
                teamIncome: filteredTransactions.filter(t => t.type === 'team_income').reduce((sum, t) => sum + t.amount, 0)
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

// Get and update user levels
router.get('/my-levels', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const LevelService = require('../services/levelService');
        
        // Force recalculate levels
        const characterLevel = await LevelService.calculateCharacterLevel(userId);
        const digitLevel = await LevelService.calculateDigitLevel(userId);
        
        // Get level status
        const levelStatus = await LevelService.getUserLevelStatus(userId);
        
        // Get direct referrals for verification
        const directReferrals = await User.find({ referredBy: userId })
            .select('name email phone normalWallet.balance createdAt');
        
        const validMembers = directReferrals.filter(ref => ref.normalWallet.balance >= 50);
        
        res.json({
            success: true,
            message: 'Level information retrieved successfully',
            data: {
                user: {
                    id: req.user._id,
                    name: req.user.name,
                    email: req.user.email,
                    referralCode: req.user.referralCode,
                    normalWalletBalance: req.user.normalWallet.balance
                },
                levels: {
                    characterLevel: characterLevel.current,
                    digitLevel: digitLevel.current,
                    characterLevelEarned: characterLevel.totalEarned || 0,
                    digitLevelEarned: digitLevel.totalEarned || 0
                },
                criteria: {
                    directReferrals: directReferrals.length,
                    validMembers: validMembers.length,
                    userWalletBalance: req.user.normalWallet.balance,
                    requirements: {
                        lvl1: { members: 5, wallet: 200 },
                        lvl2: { members: 10, wallet: 500 },
                        lvl3: { members: 40, wallet: 1100 },
                        lvl4: { members: 40, wallet: 2500 },
                        lvl5: { members: 80, wallet: 10000 }
                    }
                },
                directReferrals: directReferrals.map(ref => ({
                    id: ref._id,
                    name: ref.name,
                    email: ref.email,
                    phone: ref.phone,
                    walletBalance: ref.normalWallet.balance,
                    isValid: ref.normalWallet.balance >= 50,
                    joinedDate: ref.createdAt
                })),
                potentialIncome: levelStatus.potentialIncome,
                canClaim: levelStatus.canClaim,
                lastClaimed: levelStatus.dailyIncome.lastClaimed
            }
        });
    } catch (error) {
        console.error('Error getting user levels:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting user levels',
            error: error.message
        });
    }
});

// Force update user levels
router.post('/update-levels', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const LevelService = require('../services/levelService');
        
        // Force recalculate both levels
        const characterLevel = await LevelService.calculateCharacterLevel(userId);
        const digitLevel = await LevelService.calculateDigitLevel(userId);
        
        // Get updated level status
        const levelStatus = await LevelService.getUserLevelStatus(userId);
        
        res.json({
            success: true,
            message: 'Levels updated successfully',
            data: {
                characterLevel: characterLevel.current,
                digitLevel: digitLevel.current,
                potentialIncome: levelStatus.potentialIncome,
                canClaim: levelStatus.canClaim
            }
        });
    } catch (error) {
        console.error('Error updating user levels:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating user levels',
            error: error.message
        });
    }
});

// Debug digit level calculation
router.get('/debug-digit-level', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const LevelService = require('../services/levelService');
        const Level = require('../models/level.model');
        
        // Get user and level data
        const user = await User.findById(userId);
        let level = await Level.findOne({ userId });
        
        if (!level) {
            level = await LevelService.initializeLevel(userId);
        }
        
        // Get direct referrals
        const directReferrals = await User.find({ referredBy: userId })
            .select('name email phone normalWallet.balance createdAt');
        
        // Calculate digit level manually
        const userNormalWallet = user.normalWallet?.balance || 0;
        const validMembers = directReferrals.filter(ref => ref.normalWallet.balance >= 50);
        
        let calculatedDigitLevel = null;
        
        // Check each level criteria using level model values
        const levelChecks = {
            lvl5: { 
                members: validMembers.length >= level.digitLevel.criteria.Lvl5.directMembers, 
                wallet: userNormalWallet >= level.digitLevel.criteria.Lvl5.selfWalletMin, 
                result: validMembers.length >= level.digitLevel.criteria.Lvl5.directMembers && userNormalWallet >= level.digitLevel.criteria.Lvl5.selfWalletMin 
            },
            lvl4: { 
                members: validMembers.length >= level.digitLevel.criteria.Lvl4.directMembers, 
                wallet: userNormalWallet >= level.digitLevel.criteria.Lvl4.selfWalletMin, 
                result: validMembers.length >= level.digitLevel.criteria.Lvl4.directMembers && userNormalWallet >= level.digitLevel.criteria.Lvl4.selfWalletMin 
            },
            lvl3: { 
                members: validMembers.length >= level.digitLevel.criteria.Lvl3.directMembers, 
                wallet: userNormalWallet >= level.digitLevel.criteria.Lvl3.selfWalletMin, 
                result: validMembers.length >= level.digitLevel.criteria.Lvl3.directMembers && userNormalWallet >= level.digitLevel.criteria.Lvl3.selfWalletMin 
            },
            lvl2: { 
                members: validMembers.length >= level.digitLevel.criteria.Lvl2.directMembers, 
                wallet: userNormalWallet >= level.digitLevel.criteria.Lvl2.selfWalletMin, 
                result: validMembers.length >= level.digitLevel.criteria.Lvl2.directMembers && userNormalWallet >= level.digitLevel.criteria.Lvl2.selfWalletMin 
            },
            lvl1: { 
                members: validMembers.length >= level.digitLevel.criteria.Lvl1.directMembers, 
                wallet: userNormalWallet >= level.digitLevel.criteria.Lvl1.selfWalletMin, 
                result: validMembers.length >= level.digitLevel.criteria.Lvl1.directMembers && userNormalWallet >= level.digitLevel.criteria.Lvl1.selfWalletMin 
            }
        };
        
        // Determine level
        if (levelChecks.lvl5.result) calculatedDigitLevel = 'Lvl5';
        else if (levelChecks.lvl4.result) calculatedDigitLevel = 'Lvl4';
        else if (levelChecks.lvl3.result) calculatedDigitLevel = 'Lvl3';
        else if (levelChecks.lvl2.result) calculatedDigitLevel = 'Lvl2';
        else if (levelChecks.lvl1.result) calculatedDigitLevel = 'Lvl1';
        
        // Force update level criteria to ensure correct values
        level.digitLevel.criteria.Lvl3 = {
            directMembers: 20,
            memberWalletMin: 50,
            selfWalletMin: 1100
        };
        await level.save();
        
        // Debug: Log the actual values being used
        console.log('🔍 Debug - Level criteria values in API:');
        console.log('Lvl3 directMembers:', level.digitLevel.criteria.Lvl3.directMembers);
        console.log('Lvl3 criteria object:', level.digitLevel.criteria.Lvl3);
        
        // Additional debugging - check if level object is being modified
        console.log('🔍 Debug - Before levelChecks calculation:');
        console.log('Level object Lvl3:', level.digitLevel.criteria.Lvl3);
        console.log('Valid members count:', validMembers.length);
        console.log('User wallet:', userNormalWallet);
        
        // Debug after levelChecks calculation
        console.log('🔍 Debug - After levelChecks calculation:');
        console.log('Level object Lvl3:', level.digitLevel.criteria.Lvl3);
        console.log('LevelChecks Lvl3:', levelChecks.lvl3);
        
        // Force update digit level
        const updatedDigitLevel = await LevelService.calculateDigitLevel(userId);
        
        res.json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    normalWalletBalance: userNormalWallet
                },
                directReferrals: {
                    total: directReferrals.length,
                    valid: validMembers.length,
                    members: directReferrals.map(ref => ({
                        id: ref._id,
                        name: ref.name,
                        email: ref.email,
                        walletBalance: ref.normalWallet.balance,
                        isValid: ref.normalWallet.balance >= 50
                    }))
                },
                levelChecks: levelChecks,
                calculatedLevel: calculatedDigitLevel,
                currentLevel: level.digitLevel.current,
                updatedLevel: updatedDigitLevel.current,
                levelChanged: level.digitLevel.current !== updatedDigitLevel.current,
                dailyBenefits: {
                    currentLevel: {
                        level: calculatedDigitLevel,
                        percentage: calculatedDigitLevel ? level.digitLevel.percentages[calculatedDigitLevel] : 0,
                        dailyIncome: calculatedDigitLevel ? (userNormalWallet * level.digitLevel.percentages[calculatedDigitLevel] / 100) : 0,
                        monthlyIncome: calculatedDigitLevel ? (userNormalWallet * level.digitLevel.percentages[calculatedDigitLevel] / 100) * 30 : 0
                    },
                    nextLevel: {
                        lvl2: {
                            membersNeeded: Math.max(0, level.digitLevel.criteria.Lvl2.directMembers - validMembers.length),
                            walletNeeded: Math.max(0, level.digitLevel.criteria.Lvl2.selfWalletMin - userNormalWallet),
                            percentage: level.digitLevel.percentages.Lvl2,
                            potentialDailyIncome: (userNormalWallet * level.digitLevel.percentages.Lvl2 / 100),
                            potentialMonthlyIncome: (userNormalWallet * level.digitLevel.percentages.Lvl2 / 100) * 30
                        },
                        lvl3: {
                            membersNeeded: Math.max(0, level.digitLevel.criteria.Lvl3.directMembers - validMembers.length),
                            walletNeeded: Math.max(0, level.digitLevel.criteria.Lvl3.selfWalletMin - userNormalWallet),
                            percentage: level.digitLevel.percentages.Lvl3,
                            potentialDailyIncome: (userNormalWallet * level.digitLevel.percentages.Lvl3 / 100),
                            potentialMonthlyIncome: (userNormalWallet * level.digitLevel.percentages.Lvl3 / 100) * 30
                        },
                        lvl4: {
                            membersNeeded: Math.max(0, level.digitLevel.criteria.Lvl4.directMembers - validMembers.length),
                            walletNeeded: Math.max(0, level.digitLevel.criteria.Lvl4.selfWalletMin - userNormalWallet),
                            percentage: level.digitLevel.percentages.Lvl4,
                            potentialDailyIncome: (userNormalWallet * level.digitLevel.percentages.Lvl4 / 100),
                            potentialMonthlyIncome: (userNormalWallet * level.digitLevel.percentages.Lvl4 / 100) * 30
                        },
                        lvl5: {
                            membersNeeded: Math.max(0, level.digitLevel.criteria.Lvl5.directMembers - validMembers.length),
                            walletNeeded: Math.max(0, level.digitLevel.criteria.Lvl5.selfWalletMin - userNormalWallet),
                            percentage: level.digitLevel.percentages.Lvl5,
                            potentialDailyIncome: (userNormalWallet * level.digitLevel.percentages.Lvl5 / 100),
                            potentialMonthlyIncome: (userNormalWallet * level.digitLevel.percentages.Lvl5 / 100) * 30
                        }
                    }
                },
                requirements: {
                    lvl1: { 
                        members: level.digitLevel.criteria.Lvl1.directMembers, 
                        wallet: level.digitLevel.criteria.Lvl1.selfWalletMin 
                    },
                    lvl2: { 
                        members: level.digitLevel.criteria.Lvl2.directMembers, 
                        wallet: level.digitLevel.criteria.Lvl2.selfWalletMin 
                    },
                    lvl3: { 
                        members: level.digitLevel.criteria.Lvl3.directMembers, 
                        wallet: level.digitLevel.criteria.Lvl3.selfWalletMin 
                    },
                    lvl4: { 
                        members: level.digitLevel.criteria.Lvl4.directMembers, 
                        wallet: level.digitLevel.criteria.Lvl4.selfWalletMin 
                    },
                    lvl5: { 
                        members: level.digitLevel.criteria.Lvl5.directMembers, 
                        wallet: level.digitLevel.criteria.Lvl5.selfWalletMin 
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error debugging digit level:', error);
        res.status(500).json({
            success: false,
            message: 'Error debugging digit level',
            error: error.message
        });
    }
});

// Force update digit level only
router.post('/update-digit-level', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const LevelService = require('../services/levelService');
        const Level = require('../models/level.model');
        
        // Get current user and level data
        const user = await User.findById(userId);
        let level = await Level.findOne({ userId });
        
        if (!level) {
            level = await LevelService.initializeLevel(userId);
        }
        
        // Get direct referrals
        const directReferrals = await User.find({ referredBy: userId })
            .select('name email phone normalWallet.balance createdAt');
        
        // Update direct members list in level
        level.digitLevel.directMembers = directReferrals.map(ref => ({
            memberId: ref._id,
            joinedAt: ref.createdAt,
            walletBalance: ref.normalWallet?.balance || 0
        }));
        
        // Calculate digit level manually
        const userNormalWallet = user.normalWallet?.balance || 0;
        const validMembers = level.digitLevel.directMembers.filter(
            member => member.walletBalance >= 50
        );
        
        let newDigitLevel = null;
        
        // Check each level criteria
        if (validMembers.length >= 80 && userNormalWallet >= 10000) {
            newDigitLevel = 'Lvl5';
        } else if (validMembers.length >= 40 && userNormalWallet >= 2500) {
            newDigitLevel = 'Lvl4';
        } else if (validMembers.length >= 20 && userNormalWallet >= 1100) {
            newDigitLevel = 'Lvl3';
        } else if (validMembers.length >= 10 && userNormalWallet >= 500) {
            newDigitLevel = 'Lvl2';
        } else if (validMembers.length >= 5 && userNormalWallet >= 200) {
            newDigitLevel = 'Lvl1';
        }
        
        // Update digit level
        const oldLevel = level.digitLevel.current;
        level.digitLevel.current = newDigitLevel;
        level.digitLevel.lastCalculated = new Date();
        await level.save();
        
        // Calculate potential income
        let digitLevelIncome = 0;
        if (newDigitLevel) {
            const percentage = level.digitLevel.percentages[newDigitLevel];
            digitLevelIncome = (userNormalWallet * percentage) / 100;
        }
        
        res.json({
            success: true,
            message: 'Digit level updated successfully',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    normalWalletBalance: userNormalWallet
                },
                directReferrals: {
                    total: directReferrals.length,
                    valid: validMembers.length,
                    members: directReferrals.map(ref => ({
                        id: ref._id,
                        name: ref.name,
                        email: ref.email,
                        walletBalance: ref.normalWallet.balance,
                        isValid: ref.normalWallet.balance >= 50
                    }))
                },
                levelUpdate: {
                    oldLevel: oldLevel,
                    newLevel: newDigitLevel,
                    levelChanged: oldLevel !== newDigitLevel
                },
                criteria: {
                    validMembers: validMembers.length,
                    userWallet: userNormalWallet,
                    requirements: {
                        lvl1: { members: 5, wallet: 200, met: validMembers.length >= 5 && userNormalWallet >= 200 },
                        lvl2: { members: 10, wallet: 500, met: validMembers.length >= 10 && userNormalWallet >= 500 },
                        lvl3: { members: 20, wallet: 1100, met: validMembers.length >= 40 && userNormalWallet >= 1100 },
                        lvl4: { members: 40, wallet: 2500, met: validMembers.length >= 40 && userNormalWallet >= 2500 },
                        lvl5: { members: 80, wallet: 10000, met: validMembers.length >= 80 && userNormalWallet >= 10000 }
                    }
                },
                potentialIncome: {
                    digitLevel: digitLevelIncome,
                    percentage: newDigitLevel ? level.digitLevel.percentages[newDigitLevel] : 0
                }
            }
        });
    } catch (error) {
        console.error('Error updating digit level:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating digit level',
            error: error.message
        });
    }
});

// Debug character level calculation
router.get('/debug-character-level', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const LevelService = require('../services/levelService');
        const Level = require('../models/level.model');
        
        // Get user and level data
        const user = await User.findById(userId).populate('referredBy');
        let level = await Level.findOne({ userId });
        
        if (!level) {
            level = await LevelService.initializeLevel(userId);
        }
        
        // Get direct referrals for character level calculation
        const directReferrals = await User.find({ referredBy: userId })
            .select('name email phone normalWallet.balance createdAt');
        
        // Calculate character level manually
        let currentUser = user;
        let depth = 0;
        const characterLevels = ['A', 'B', 'C', 'D', 'E'];
        
        while (currentUser.referredBy && depth < characterLevels.length) {
            currentUser = await User.findById(currentUser.referredBy).populate('referredBy');
            depth++;
        }
        
        const calculatedCharacterLevel = depth < characterLevels.length ? characterLevels[depth] : null;
        
        // Calculate character level income from direct referrals
        let characterLevelIncome = 0;
        let totalDirectReferralBalance = 0;
        
        if (calculatedCharacterLevel && directReferrals.length > 0) {
            totalDirectReferralBalance = directReferrals.reduce((sum, ref) => sum + (ref.normalWallet?.balance || 0), 0);
            const percentage = level.characterLevel.percentages[calculatedCharacterLevel];
            characterLevelIncome = (totalDirectReferralBalance * percentage) / 100;
        }
        
        // Force update character level
        const updatedCharacterLevel = await LevelService.calculateCharacterLevel(userId);
        
        // Get referral chain for analysis
        const referralChain = [];
        let chainUser = user;
        let chainDepth = 0;
        
        while (chainUser.referredBy && chainDepth < 5) {
            const parent = await User.findById(chainUser.referredBy);
            if (parent) {
                referralChain.push({
                    level: characterLevels[chainDepth] || 'Beyond E',
                    userId: parent._id,
                    name: parent.name,
                    email: parent.email,
                    walletBalance: parent.normalWallet?.balance || 0,
                    percentage: characterLevels[chainDepth] ? level.characterLevel.percentages[characterLevels[chainDepth]] : 0,
                    potentialIncome: characterLevels[chainDepth] ? (parent.normalWallet?.balance || 0) * level.characterLevel.percentages[characterLevels[chainDepth]] / 100 : 0
                });
            }
            chainUser = parent;
            chainDepth++;
        }
        
        res.json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    referredBy: user.referredBy ? {
                        id: user.referredBy._id,
                        name: user.referredBy.name,
                        email: user.referredBy.email
                    } : null
                },
                characterLevel: {
                    calculatedLevel: calculatedCharacterLevel,
                    currentLevel: level.characterLevel.current,
                    updatedLevel: updatedCharacterLevel.current,
                    levelChanged: level.characterLevel.current !== updatedCharacterLevel.current,
                    depth: depth,
                    maxDepth: characterLevels.length
                },
                directReferrals: {
                    total: directReferrals.length,
                    totalBalance: totalDirectReferralBalance,
                    members: directReferrals.map(ref => ({
                        id: ref._id,
                        name: ref.name,
                        email: ref.email,
                        walletBalance: ref.normalWallet?.balance || 0
                    }))
                },
                dailyBenefits: {
                    currentLevel: {
                        level: calculatedCharacterLevel,
                        percentage: calculatedCharacterLevel ? level.characterLevel.percentages[calculatedCharacterLevel] : 0,
                        dailyIncome: characterLevelIncome,
                        monthlyIncome: characterLevelIncome * 30,
                        sourceBalance: totalDirectReferralBalance
                    },
                    allLevels: {
                        A: {
                            percentage: level.characterLevel.percentages.A,
                            potentialDailyIncome: totalDirectReferralBalance * level.characterLevel.percentages.A / 100,
                            potentialMonthlyIncome: (totalDirectReferralBalance * level.characterLevel.percentages.A / 100) * 30,
                            description: "Direct referral of top user (no upline) - earns from direct referrals"
                        },
                        B: {
                            percentage: level.characterLevel.percentages.B,
                            potentialDailyIncome: totalDirectReferralBalance * level.characterLevel.percentages.B / 100,
                            potentialMonthlyIncome: (totalDirectReferralBalance * level.characterLevel.percentages.B / 100) * 30,
                            description: "2nd level in referral chain - earns from direct referrals"
                        },
                        C: {
                            percentage: level.characterLevel.percentages.C,
                            potentialDailyIncome: totalDirectReferralBalance * level.characterLevel.percentages.C / 100,
                            potentialMonthlyIncome: (totalDirectReferralBalance * level.characterLevel.percentages.C / 100) * 30,
                            description: "3rd level in referral chain - earns from direct referrals"
                        },
                        D: {
                            percentage: level.characterLevel.percentages.D,
                            potentialDailyIncome: totalDirectReferralBalance * level.characterLevel.percentages.D / 100,
                            potentialMonthlyIncome: (totalDirectReferralBalance * level.characterLevel.percentages.D / 100) * 30,
                            description: "4th level in referral chain - earns from direct referrals"
                        },
                        E: {
                            percentage: level.characterLevel.percentages.E,
                            potentialDailyIncome: totalDirectReferralBalance * level.characterLevel.percentages.E / 100,
                            potentialMonthlyIncome: (totalDirectReferralBalance * level.characterLevel.percentages.E / 100) * 30,
                            description: "5th level in referral chain - earns from direct referrals"
                        }
                    }
                },
                referralChain: referralChain,
                requirements: {
                    A: { description: "Direct referral of top user (no upline)", depth: 0 },
                    B: { description: "2nd level in referral chain", depth: 1 },
                    C: { description: "3rd level in referral chain", depth: 2 },
                    D: { description: "4th level in referral chain", depth: 3 },
                    E: { description: "5th level in referral chain", depth: 4 }
                },
                analysis: {
                    hasDirectReferrals: directReferrals.length > 0,
                    totalDirectReferralBalance: totalDirectReferralBalance,
                    canEarnCharacterIncome: !!calculatedCharacterLevel && directReferrals.length > 0,
                    incomeSource: directReferrals.length > 0 ? `Direct referrals' wallets (${totalDirectReferralBalance})` : "No direct referrals",
                    recommendation: directReferrals.length === 0 ? "You need direct referrals to earn character level income" : 
                                  !calculatedCharacterLevel ? "Your referral chain is too deep for character level income" :
                                  `You can earn character level income from your ${directReferrals.length} direct referrals' wallets`
                }
            }
        });
    } catch (error) {
        console.error('Error debugging character level:', error);
        res.status(500).json({
            success: false,
            message: 'Error debugging character level',
            error: error.message
        });
    }
});

// Claim both digit level and character level income daily
router.post('/claim-level-income', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const LevelService = require('../services/levelService');
        const Level = require('../models/level.model');
        
        // Get user and level data
        const user = await User.findById(userId);
        let level = await Level.findOne({ userId });
        
        if (!level) {
            level = await LevelService.initializeLevel(userId);
        }
        
        // Check if already claimed today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (level.dailyIncome.lastClaimed) {
            const lastClaimed = new Date(level.dailyIncome.lastClaimed);
            lastClaimed.setHours(0, 0, 0, 0);
            
            if (lastClaimed.getTime() === today.getTime()) {
                return res.status(400).json({
                    success: false,
                    message: 'Level income already claimed today. Please try again tomorrow.',
                    data: {
                        lastClaimed: level.dailyIncome.lastClaimed,
                        nextClaimAvailable: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                    }
                });
            }
        }
        
        // Calculate digit level income
        let digitLevelIncome = 0;
        if (level.digitLevel.current) {
            const userWalletBalance = user.normalWallet?.balance || 0;
            const percentage = level.digitLevel.percentages[level.digitLevel.current];
            digitLevelIncome = (userWalletBalance * percentage) / 100;
        }
        
        // Calculate character level income
        let characterLevelIncome = 0;
        const directReferrals = await User.find({ referredBy: userId })
            .select('normalWallet.balance');
        
        if (level.characterLevel.current && directReferrals.length > 0) {
            const totalDirectReferralBalance = directReferrals.reduce((sum, ref) => sum + (ref.normalWallet?.balance || 0), 0);
            const percentage = level.characterLevel.percentages[level.characterLevel.current];
            characterLevelIncome = (totalDirectReferralBalance * percentage) / 100;
        }
        
        const totalLevelIncome = digitLevelIncome + characterLevelIncome;
        
        if (totalLevelIncome <= 0) {
            return res.status(400).json({
                success: false,
                message: 'No level income available to claim.',
                data: {
                    digitLevelIncome: 0,
                    characterLevelIncome: 0,
                    totalLevelIncome: 0,
                    digitLevel: level.digitLevel.current,
                    characterLevel: level.characterLevel.current
                }
            });
        }
        
        // Credit level income to normal wallet
        user.normalWallet.balance += totalLevelIncome;
        user.normalWallet.transactions.push({
            type: 'level_income',
            amount: totalLevelIncome,
            description: `Level income - Digit: ${digitLevelIncome.toFixed(2)}, Character: ${characterLevelIncome.toFixed(2)}`,
            status: 'approved'
        });
        
        // Update level tracking
        level.dailyIncome.characterLevel = characterLevelIncome;
        level.dailyIncome.digitLevel = digitLevelIncome;
        level.dailyIncome.lastClaimed = new Date();
        
        // Update total earned
        if (level.characterLevel) {
            level.characterLevel.totalEarned += characterLevelIncome;
        }
        if (level.digitLevel) {
            level.digitLevel.totalEarned += digitLevelIncome;
        }
        
        await user.save();
        await level.save();
        
        res.json({
            success: true,
            message: 'Level income claimed successfully',
            data: {
                digitLevel: {
                    level: level.digitLevel.current,
                    income: digitLevelIncome,
                    percentage: level.digitLevel.current ? level.digitLevel.percentages[level.digitLevel.current] : 0,
                    totalEarned: level.digitLevel.totalEarned
                },
                characterLevel: {
                    level: level.characterLevel.current,
                    income: characterLevelIncome,
                    percentage: level.characterLevel.current ? level.characterLevel.percentages[level.characterLevel.current] : 0,
                    totalEarned: level.characterLevel.totalEarned,
                    directReferralsCount: directReferrals.length,
                    totalDirectReferralBalance: directReferrals.reduce((sum, ref) => sum + (ref.normalWallet?.balance || 0), 0)
                },
                totalIncome: {
                    daily: totalLevelIncome,
                    monthly: totalLevelIncome * 30,
                    newBalance: user.normalWallet.balance
                },
                lastClaimed: new Date(),
                nextClaimAvailable: new Date(today.getTime() + 24 * 60 * 60 * 1000)
            }
        });
    } catch (error) {
        console.error('Error claiming level income:', error);
        res.status(500).json({
            success: false,
            message: 'Error claiming level income',
            error: error.message
        });
    }
});

// Get level progress with progress bars
router.get('/level-progress', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const LevelService = require('../services/levelService');
        const Level = require('../models/level.model');
        
        // Get user and level data
        const user = await User.findById(userId);
        let level = await Level.findOne({ userId });
        
        if (!level) {
            level = await LevelService.initializeLevel(userId);
        }
        
        // Get direct referrals
        const directReferrals = await User.find({ referredBy: userId })
            .select('name email phone normalWallet.balance createdAt');
        
        const userNormalWallet = user.normalWallet?.balance || 0;
        const validMembers = directReferrals.filter(ref => ref.normalWallet.balance >= 50);
        
        // Calculate digit level progress
        const digitLevelProgress = {
            currentLevel: level.digitLevel.current,
            currentLevelIndex: level.digitLevel.current ? ['Lvl1', 'Lvl2', 'Lvl3', 'Lvl4', 'Lvl5'].indexOf(level.digitLevel.current) : -1,
            levels: {
                lvl1: {
                    name: 'Lvl1',
                    requirements: { members: 5, wallet: 200 },
                    current: { members: validMembers.length, wallet: userNormalWallet },
                    met: validMembers.length >= 5 && userNormalWallet >= 200,
                    progress: {
                        members: Math.min(100, (validMembers.length / 5) * 100),
                        wallet: Math.min(100, (userNormalWallet / 200) * 100),
                        overall: Math.min(100, Math.min((validMembers.length / 5) * 100, (userNormalWallet / 200) * 100))
                    }
                },
                lvl2: {
                    name: 'Lvl2',
                    requirements: { members: 10, wallet: 500 },
                    current: { members: validMembers.length, wallet: userNormalWallet },
                    met: validMembers.length >= 10 && userNormalWallet >= 500,
                    progress: {
                        members: Math.min(100, (validMembers.length / 10) * 100),
                        wallet: Math.min(100, (userNormalWallet / 500) * 100),
                        overall: Math.min(100, Math.min((validMembers.length / 10) * 100, (userNormalWallet / 500) * 100))
                    }
                },
                lvl3: {
                    name: 'Lvl3',
                    requirements: { members: 20, wallet: 1100 },
                    current: { members: validMembers.length, wallet: userNormalWallet },
                    met: validMembers.length >= 20 && userNormalWallet >= 1100,
                    progress: {
                        members: Math.min(100, (validMembers.length / 40) * 100),
                        wallet: Math.min(100, (userNormalWallet / 1100) * 100),
                        overall: Math.min(100, Math.min((validMembers.length / 40) * 100, (userNormalWallet / 1100) * 100))
                    }
                },
                lvl4: {
                    name: 'Lvl4',
                    requirements: { members: 40, wallet: 2500 },
                    current: { members: validMembers.length, wallet: userNormalWallet },
                    met: validMembers.length >= 40 && userNormalWallet >= 2500,
                    progress: {
                        members: Math.min(100, (validMembers.length / 40) * 100),
                        wallet: Math.min(100, (userNormalWallet / 2500) * 100),
                        overall: Math.min(100, Math.min((validMembers.length / 40) * 100, (userNormalWallet / 2500) * 100))
                    }
                },
                lvl5: {
                    name: 'Lvl5',
                    requirements: { members: 80, wallet: 10000 },
                    current: { members: validMembers.length, wallet: userNormalWallet },
                    met: validMembers.length >= 80 && userNormalWallet >= 10000,
                    progress: {
                        members: Math.min(100, (validMembers.length / 80) * 100),
                        wallet: Math.min(100, (userNormalWallet / 10000) * 100),
                        overall: Math.min(100, Math.min((validMembers.length / 80) * 100, (userNormalWallet / 10000) * 100))
                    }
                }
            },
            nextLevel: null,
            nextLevelRequirements: null
        };
        
        // Find next level to achieve
        const digitLevels = ['Lvl1', 'Lvl2', 'Lvl3', 'Lvl4', 'Lvl5'];
        const currentIndex = digitLevelProgress.currentLevelIndex;
        if (currentIndex >= 0 && currentIndex < digitLevels.length - 1) {
            const nextLevelName = digitLevels[currentIndex + 1];
            digitLevelProgress.nextLevel = nextLevelName;
            digitLevelProgress.nextLevelRequirements = digitLevelProgress.levels[nextLevelName.toLowerCase()];
        }
        
        // Calculate character level progress
        let currentUser = user;
        let depth = 0;
        const characterLevels = ['A', 'B', 'C', 'D', 'E'];
        
        while (currentUser.referredBy && depth < characterLevels.length) {
            currentUser = await User.findById(currentUser.referredBy).populate('referredBy');
            depth++;
        }
        
        const calculatedCharacterLevel = depth < characterLevels.length ? characterLevels[depth] : null;
        
        const characterLevelProgress = {
            currentLevel: calculatedCharacterLevel,
            currentLevelIndex: calculatedCharacterLevel ? characterLevels.indexOf(calculatedCharacterLevel) : -1,
            depth: depth,
            maxDepth: characterLevels.length,
            levels: {
                A: {
                    name: 'A',
                    description: 'Direct referral of top user (no upline)',
                    depth: 0,
                    current: depth === 0,
                    met: depth === 0,
                    progress: depth === 0 ? 100 : 0
                },
                B: {
                    name: 'B',
                    description: '2nd level in referral chain',
                    depth: 1,
                    current: depth === 1,
                    met: depth <= 1,
                    progress: depth <= 1 ? 100 : 0
                },
                C: {
                    name: 'C',
                    description: '3rd level in referral chain',
                    depth: 2,
                    current: depth === 2,
                    met: depth <= 2,
                    progress: depth <= 2 ? 100 : 0
                },
                D: {
                    name: 'D',
                    description: '4th level in referral chain',
                    depth: 3,
                    current: depth === 3,
                    met: depth <= 3,
                    progress: depth <= 3 ? 100 : 0
                },
                E: {
                    name: 'E',
                    description: '5th level in referral chain',
                    depth: 4,
                    current: depth === 4,
                    met: depth <= 4,
                    progress: depth <= 4 ? 100 : 0
                }
            },
            nextLevel: null,
            nextLevelRequirements: null
        };
        
        // Find next character level (if applicable)
        if (characterLevelProgress.currentLevelIndex >= 0 && characterLevelProgress.currentLevelIndex < characterLevels.length - 1) {
            const nextLevelName = characterLevels[characterLevelProgress.currentLevelIndex + 1];
            characterLevelProgress.nextLevel = nextLevelName;
            characterLevelProgress.nextLevelRequirements = characterLevelProgress.levels[nextLevelName];
        }
        
        // Calculate current income
        let digitLevelIncome = 0;
        if (level.digitLevel.current) {
            const percentage = level.digitLevel.percentages[level.digitLevel.current];
            digitLevelIncome = (userNormalWallet * percentage) / 100;
        }
        
        let characterLevelIncome = 0;
        if (calculatedCharacterLevel && directReferrals.length > 0) {
            const totalDirectReferralBalance = directReferrals.reduce((sum, ref) => sum + (ref.normalWallet?.balance || 0), 0);
            const percentage = level.characterLevel.percentages[calculatedCharacterLevel];
            characterLevelIncome = (totalDirectReferralBalance * percentage) / 100;
        }
        
        res.json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    normalWalletBalance: userNormalWallet,
                    directReferralsCount: directReferrals.length,
                    validMembersCount: validMembers.length
                },
                digitLevel: {
                    ...digitLevelProgress,
                    currentIncome: {
                        daily: digitLevelIncome,
                        monthly: digitLevelIncome * 30,
                        percentage: level.digitLevel.current ? level.digitLevel.percentages[level.digitLevel.current] : 0,
                        totalEarned: level.digitLevel.totalEarned || 0
                    }
                },
                characterLevel: {
                    ...characterLevelProgress,
                    currentIncome: {
                        daily: characterLevelIncome,
                        monthly: characterLevelIncome * 30,
                        percentage: calculatedCharacterLevel ? level.characterLevel.percentages[calculatedCharacterLevel] : 0,
                        totalEarned: level.characterLevel.totalEarned || 0,
                        directReferralsBalance: directReferrals.reduce((sum, ref) => sum + (ref.normalWallet?.balance || 0), 0)
                    }
                },
                totalIncome: {
                    daily: digitLevelIncome + characterLevelIncome,
                    monthly: (digitLevelIncome + characterLevelIncome) * 30
                },
                summary: {
                    currentDigitLevel: level.digitLevel.current,
                    currentCharacterLevel: calculatedCharacterLevel,
                    totalLevelsAchieved: (level.digitLevel.current ? 1 : 0) + (calculatedCharacterLevel ? 1 : 0),
                    canEarnIncome: (digitLevelIncome > 0 || characterLevelIncome > 0),
                    nextMilestone: digitLevelProgress.nextLevel || characterLevelProgress.nextLevel
                }
            }
        });
    } catch (error) {
        console.error('Error getting level progress:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting level progress',
            error: error.message
        });
    }
});

// Set wallet address and QR code (first time setup)
router.post('/set-wallet-info', auth, upload.single('qrCode'), async (req, res) => {
    try {
        const { walletAddress } = req.body;
        const userId = req.user.id;

        // Validate input
        if (!walletAddress) {
            return res.status(400).json({
                success: false,
                message: 'Wallet address is required'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'QR code image is required'
            });
        }

        // Get user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if wallet info already exists
        if (user.walletInfo.address) {
            return res.status(400).json({
                success: false,
                message: 'Wallet information already set. Use change request to update.'
            });
        }

        // For first time setup, automatically approve and verify
        user.walletInfo = {
            address: walletAddress,
            qrCode: req.file.path,
            isVerified: true, // Automatically verified for first time setup
            lastUpdated: new Date()
        };

        await user.save();

        res.json({
            success: true,
            message: 'Wallet information set successfully and automatically verified',
            data: {
                walletAddress: user.walletInfo.address,
                qrCode: user.walletInfo.qrCode,
                isVerified: user.walletInfo.isVerified,
                lastUpdated: user.walletInfo.lastUpdated
            }
        });

    } catch (error) {
        console.error('Error setting wallet info:', error);
        res.status(500).json({
            success: false,
            message: 'Error setting wallet information',
            error: error.message
        });
    }
});

// Get wallet information
router.get('/wallet-info', auth, async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: {
                walletInfo: user.walletInfo,
                pendingRequests: user.walletChangeRequests.filter(req => req.status === 'pending'),
                totalRequests: user.walletChangeRequests.length
            }
        });

    } catch (error) {
        console.error('Error getting wallet info:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting wallet information',
            error: error.message
        });
    }
});

// Request wallet information change
router.post('/request-wallet-change', auth, upload.single('newQrCode'), async (req, res) => {
    try {
        const { newWalletAddress, reason } = req.body;
        const userId = req.user.id;

        // Validate input
        if (!newWalletAddress) {
            return res.status(400).json({
                success: false,
                message: 'New wallet address is required'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'New QR code image is required'
            });
        }

        // Get user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if wallet info exists
        if (!user.walletInfo.address) {
            return res.status(400).json({
                success: false,
                message: 'No wallet information found. Use set-wallet-info first.'
            });
        }

        // Check if there's already a pending request
        const pendingRequest = user.walletChangeRequests.find(req => req.status === 'pending');
        if (pendingRequest) {
            return res.status(400).json({
                success: false,
                message: 'You already have a pending wallet change request',
                data: {
                    requestId: pendingRequest.requestId,
                    requestedAt: pendingRequest.requestedAt
                }
            });
        }

        // Create change request
        const requestId = `WCR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const changeRequest = {
            requestId: requestId,
            oldAddress: user.walletInfo.address,
            newAddress: newWalletAddress,
            oldQrCode: user.walletInfo.qrCode,
            newQrCode: req.file.path,
            reason: reason || 'User requested wallet change',
            status: 'pending',
            requestedAt: new Date()
        };

        user.walletChangeRequests.push(changeRequest);
        await user.save();

        res.json({
            success: true,
            message: 'Wallet change request submitted successfully',
            data: {
                requestId: requestId,
                oldAddress: changeRequest.oldAddress,
                newAddress: changeRequest.newAddress,
                reason: changeRequest.reason,
                status: 'pending',
                requestedAt: changeRequest.requestedAt
            }
        });

    } catch (error) {
        console.error('Error requesting wallet change:', error);
        res.status(500).json({
            success: false,
            message: 'Error requesting wallet change',
            error: error.message
        });
    }
});

// Get wallet change request status
router.get('/wallet-change-status/:requestId', auth, async (req, res) => {
    try {
        const { requestId } = req.params;
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const request = user.walletChangeRequests.find(req => req.requestId === requestId);
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Change request not found'
            });
        }

        res.json({
            success: true,
            data: {
                requestId: request.requestId,
                oldAddress: request.oldAddress,
                newAddress: request.newAddress,
                reason: request.reason,
                status: request.status,
                adminNotes: request.adminNotes,
                requestedAt: request.requestedAt,
                processedAt: request.processedAt
            }
        });

    } catch (error) {
        console.error('Error getting wallet change status:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting wallet change status',
            error: error.message
        });
    }
});

// Get all wallet change requests for user
router.get('/wallet-change-requests', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 10, status } = req.query;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        let requests = user.walletChangeRequests;

        // Filter by status if provided
        if (status) {
            requests = requests.filter(req => req.status === status);
        }

        // Sort by requestedAt (newest first)
        requests.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));

        // Paginate
        const skip = (page - 1) * limit;
        const paginatedRequests = requests.slice(skip, skip + parseInt(limit));

        res.json({
            success: true,
            data: {
                requests: paginatedRequests,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: requests.length,
                    pages: Math.ceil(requests.length / limit)
                },
                summary: {
                    total: user.walletChangeRequests.length,
                    pending: user.walletChangeRequests.filter(req => req.status === 'pending').length,
                    approved: user.walletChangeRequests.filter(req => req.status === 'approved').length,
                    rejected: user.walletChangeRequests.filter(req => req.status === 'rejected').length
                }
            }
        });

    } catch (error) {
        console.error('Error getting wallet change requests:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting wallet change requests',
            error: error.message
        });
    }
});

// Get detailed user levels and earnings report with benefit structure
router.get('/levels-earnings-report', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const LevelService = require('../services/levelService');
        const Level = require('../models/level.model');
        
        // Get user and level data
        const user = await User.findById(userId);
        let level = await Level.findOne({ userId });
        
        if (!level) {
            level = await LevelService.initializeLevel(userId);
        }
        
        // Get direct referrals
        const directReferrals = await User.find({ referredBy: userId })
            .select('name email phone normalWallet.balance createdAt');
        
        // Get all team members (recursive)
        const getAllTeamMembers = async (referrerId, depth = 0, maxDepth = 10) => {
            if (depth >= maxDepth) return [];
            
            const members = await User.find({ referredBy: referrerId })
                .select('name email phone normalWallet.balance createdAt referredBy');
            
            let allMembers = [...members];
            
            for (const member of members) {
                const subMembers = await getAllTeamMembers(member._id, depth + 1, maxDepth);
                allMembers = allMembers.concat(subMembers);
            }
            
            return allMembers;
        };
        
        const allTeamMembers = await getAllTeamMembers(userId);
        
        // Calculate current wallet balances
        const userNormalWallet = user.normalWallet?.balance || 0;
        const userInvestmentWallet = user.investmentWallet?.balance || 0;
        
        // Calculate character level income
        const characterLevelIncome = await LevelService.calculateCharacterLevelIncome(userId);
        
        // Calculate digit level income
        const digitLevelIncome = await LevelService.calculateDigitLevelIncome(userId);
        
        // Calculate total daily income
        const totalDailyIncome = characterLevelIncome + digitLevelIncome;
        
        // Get level progress
        const validMembers = directReferrals.filter(ref => (ref.normalWallet?.balance || 0) >= 50);
        
        // Character level details with benefit structure
        const characterLevelDetails = {
            current: level.characterLevel?.current || null,
            totalEarned: level.characterLevel?.totalEarned || 0,
            dailyIncome: characterLevelIncome,
            monthlyIncome: characterLevelIncome * 30,
            yearlyIncome: characterLevelIncome * 365,
            referralChain: {
                depth: 0,
                members: []
            },
            benefitStructure: {
                A: {
                    percentage: 0.05,
                    description: "Level A - 0.05% daily income from total team balance",
                    dailyBenefit: "0.05% of total team members' wallet balance",
                    monthlyBenefit: "1.5% of total team members' wallet balance",
                    yearlyBenefit: "18.25% of total team members' wallet balance"
                },
                B: {
                    percentage: 0.025,
                    description: "Level B - 0.025% daily income from total team balance",
                    dailyBenefit: "0.025% of total team members' wallet balance",
                    monthlyBenefit: "0.75% of total team members' wallet balance",
                    yearlyBenefit: "9.125% of total team members' wallet balance"
                },
                C: {
                    percentage: 0.0125,
                    description: "Level C - 0.0125% daily income from total team balance",
                    dailyBenefit: "0.0125% of total team members' wallet balance",
                    monthlyBenefit: "0.375% of total team members' wallet balance",
                    yearlyBenefit: "4.5625% of total team members' wallet balance"
                },
                D: {
                    percentage: 0.00625,
                    description: "Level D - 0.00625% daily income from total team balance",
                    dailyBenefit: "0.00625% of total team members' wallet balance",
                    monthlyBenefit: "0.1875% of total team members' wallet balance",
                    yearlyBenefit: "2.28125% of total team members' wallet balance"
                },
                E: {
                    percentage: 0.003125,
                    description: "Level E - 0.003125% daily income from total team balance",
                    dailyBenefit: "0.003125% of total team members' wallet balance",
                    monthlyBenefit: "0.09375% of total team members' wallet balance",
                    yearlyBenefit: "1.140625% of total team members' wallet balance"
                }
            }
        };
        
        // Calculate referral chain depth
        let currentUser = user;
        let chainDepth = 0;
        const characterLevels = ['A', 'B', 'C', 'D', 'E'];
        
        while (currentUser.referredBy && chainDepth < characterLevels.length) {
            const parent = await User.findById(currentUser.referredBy).select('name email normalWallet.balance');
            if (parent) {
                characterLevelDetails.referralChain.members.push({
                    level: characterLevels[chainDepth],
                    name: parent.name,
                    email: parent.email,
                    walletBalance: parent.normalWallet?.balance || 0
                });
            }
            currentUser = parent;
            chainDepth++;
        }
        
        characterLevelDetails.referralChain.depth = chainDepth;
        
        // Digit level details with benefit structure
        const digitLevelDetails = {
            current: level.digitLevel?.current || null,
            totalEarned: level.digitLevel?.totalEarned || 0,
            dailyIncome: digitLevelIncome,
            monthlyIncome: digitLevelIncome * 30,
            yearlyIncome: digitLevelIncome * 365,
            progress: {},
            benefitStructure: {
                Lvl1: {
                    percentage: 0.35,
                    description: "Level 1 - 0.35% daily income from own wallet",
                    requirements: {
                        directMembers: 5,
                        memberWalletMin: 50,
                        selfWalletMin: 200
                    },
                    dailyBenefit: "0.35% of your normal wallet balance",
                    monthlyBenefit: "10.5% of your normal wallet balance",
                    yearlyBenefit: "127.75% of your normal wallet balance"
                },
                Lvl2: {
                    percentage: 0.70,
                    description: "Level 2 - 0.70% daily income from own wallet",
                    requirements: {
                        directMembers: 10,
                        memberWalletMin: 50,
                        selfWalletMin: 500
                    },
                    dailyBenefit: "0.70% of your normal wallet balance",
                    monthlyBenefit: "21% of your normal wallet balance",
                    yearlyBenefit: "255.5% of your normal wallet balance"
                },
                Lvl3: {
                    percentage: 1.40,
                    description: "Level 3 - 1.40% daily income from own wallet",
                    requirements: {
                        directMembers: 20,
                        memberWalletMin: 50,
                        selfWalletMin: 1100
                    },
                    dailyBenefit: "1.40% of your normal wallet balance",
                    monthlyBenefit: "42% of your normal wallet balance",
                    yearlyBenefit: "511% of your normal wallet balance"
                },
                Lvl4: {
                    percentage: 2.50,
                    description: "Level 4 - 2.50% daily income from own wallet",
                    requirements: {
                        directMembers: 40,
                        memberWalletMin: 50,
                        selfWalletMin: 2500
                    },
                    dailyBenefit: "2.50% of your normal wallet balance",
                    monthlyBenefit: "75% of your normal wallet balance",
                    yearlyBenefit: "912.5% of your normal wallet balance"
                },
                Lvl5: {
                    percentage: 4.00,
                    description: "Level 5 - 4.00% daily income from own wallet",
                    requirements: {
                        directMembers: 80,
                        memberWalletMin: 50,
                        selfWalletMin: 10000
                    },
                    dailyBenefit: "4.00% of your normal wallet balance",
                    monthlyBenefit: "120% of your normal wallet balance",
                    yearlyBenefit: "1460% of your normal wallet balance"
                }
            }
        };
        
        // Calculate progress for each level with detailed requirements
        const levelProgress = {
            Lvl1: {
                required: { 
                    members: 5, 
                    wallet: 200,
                    memberWalletMin: 50
                },
                current: { 
                    members: validMembers.length, 
                    wallet: userNormalWallet,
                    memberWalletMin: 50
                },
                progress: {
                    members: Math.min(100, (validMembers.length / 5) * 100),
                    wallet: Math.min(100, (userNormalWallet / 200) * 100)
                },
                achieved: validMembers.length >= 5 && userNormalWallet >= 200,
                nextLevel: 'Lvl2',
                remainingRequirements: {
                    members: Math.max(0, 5 - validMembers.length),
                    wallet: Math.max(0, 200 - userNormalWallet)
                }
            },
            Lvl2: {
                required: { 
                    members: 10, 
                    wallet: 500,
                    memberWalletMin: 50
                },
                current: { 
                    members: validMembers.length, 
                    wallet: userNormalWallet,
                    memberWalletMin: 50
                },
                progress: {
                    members: Math.min(100, (validMembers.length / 10) * 100),
                    wallet: Math.min(100, (userNormalWallet / 500) * 100)
                },
                achieved: validMembers.length >= 10 && userNormalWallet >= 500,
                nextLevel: 'Lvl3',
                remainingRequirements: {
                    members: Math.max(0, 10 - validMembers.length),
                    wallet: Math.max(0, 500 - userNormalWallet)
                }
            },
            Lvl3: {
                required: { 
                    members: 20, 
                    wallet: 1100,
                    memberWalletMin: 50
                },
                current: { 
                    members: validMembers.length, 
                    wallet: userNormalWallet,
                    memberWalletMin: 50
                },
                progress: {
                    members: Math.min(100, (validMembers.length / 20) * 100),
                    wallet: Math.min(100, (userNormalWallet / 1100) * 100)
                },
                achieved: validMembers.length >= 20 && userNormalWallet >= 1100,
                nextLevel: 'Lvl4',
                remainingRequirements: {
                    members: Math.max(0, 20 - validMembers.length),
                    wallet: Math.max(0, 1100 - userNormalWallet)
                }
            },
            Lvl4: {
                required: { 
                    members: 40, 
                    wallet: 2500,
                    memberWalletMin: 50
                },
                current: { 
                    members: validMembers.length, 
                    wallet: userNormalWallet,
                    memberWalletMin: 50
                },
                progress: {
                    members: Math.min(100, (validMembers.length / 40) * 100),
                    wallet: Math.min(100, (userNormalWallet / 2500) * 100)
                },
                achieved: validMembers.length >= 40 && userNormalWallet >= 2500,
                nextLevel: 'Lvl5',
                remainingRequirements: {
                    members: Math.max(0, 40 - validMembers.length),
                    wallet: Math.max(0, 2500 - userNormalWallet)
                }
            },
            Lvl5: {
                required: { 
                    members: 80, 
                    wallet: 10000,
                    memberWalletMin: 50
                },
                current: { 
                    members: validMembers.length, 
                    wallet: userNormalWallet,
                    memberWalletMin: 50
                },
                progress: {
                    members: Math.min(100, (validMembers.length / 80) * 100),
                    wallet: Math.min(100, (userNormalWallet / 10000) * 100)
                },
                achieved: validMembers.length >= 80 && userNormalWallet >= 10000,
                nextLevel: null,
                remainingRequirements: {
                    members: Math.max(0, 80 - validMembers.length),
                    wallet: Math.max(0, 10000 - userNormalWallet)
                }
            }
        };
        
        digitLevelDetails.progress = levelProgress;
        
        // Team statistics
        const teamStats = {
            directReferrals: {
                total: directReferrals.length,
                valid: validMembers.length,
                totalWalletBalance: directReferrals.reduce((sum, ref) => sum + (ref.normalWallet?.balance || 0), 0),
                averageWalletBalance: directReferrals.length > 0 ? 
                    directReferrals.reduce((sum, ref) => sum + (ref.normalWallet?.balance || 0), 0) / directReferrals.length : 0
            },
            totalTeam: {
                total: allTeamMembers.length,
                totalWalletBalance: allTeamMembers.reduce((sum, member) => sum + (member.normalWallet?.balance || 0), 0),
                averageWalletBalance: allTeamMembers.length > 0 ? 
                    allTeamMembers.reduce((sum, member) => sum + (member.normalWallet?.balance || 0), 0) / allTeamMembers.length : 0
            }
        };
        
        // Earnings summary
        const earningsSummary = {
            daily: {
                characterLevel: characterLevelIncome,
                digitLevel: digitLevelIncome,
                total: totalDailyIncome
            },
            monthly: {
                characterLevel: characterLevelIncome * 30,
                digitLevel: digitLevelIncome * 30,
                total: totalDailyIncome * 30
            },
            yearly: {
                characterLevel: characterLevelIncome * 365,
                digitLevel: digitLevelIncome * 365,
                total: totalDailyIncome * 365
            },
            totalEarned: {
                characterLevel: level.characterLevel?.totalEarned || 0,
                digitLevel: level.digitLevel?.totalEarned || 0,
                total: (level.characterLevel?.totalEarned || 0) + (level.digitLevel?.totalEarned || 0)
            }
        };
        
        // Next level requirements with detailed information
        const nextLevelRequirements = {
            characterLevel: {
                current: characterLevelDetails.current,
                next: characterLevelDetails.current ? 
                (characterLevels.indexOf(characterLevelDetails.current) < characterLevels.length - 1 ? 
                    characterLevels[characterLevels.indexOf(characterLevelDetails.current) + 1] : null) : 'A',
                description: characterLevelDetails.current ? 
                    (characterLevels.indexOf(characterLevelDetails.current) < characterLevels.length - 1 ? 
                        `Advance to Level ${characterLevels[characterLevels.indexOf(characterLevelDetails.current) + 1]} by having more upline members` : 
                        'You have reached the highest character level') : 
                    'Start at Level A by being referred by someone'
            },
            digitLevel: {
                current: digitLevelDetails.current,
                next: digitLevelDetails.current ? 
                (['Lvl1', 'Lvl2', 'Lvl3', 'Lvl4'].includes(digitLevelDetails.current) ? 
                        digitLevelDetails.current.replace('Lvl', 'Lvl') : null) : 'Lvl1',
                description: digitLevelDetails.current ? 
                    (['Lvl1', 'Lvl2', 'Lvl3', 'Lvl4'].includes(digitLevelDetails.current) ? 
                        `Advance to ${digitLevelDetails.current.replace('Lvl', 'Lvl')} by meeting member and wallet requirements` : 
                        'You have reached the highest digit level') : 
                    'Start at Level 1 by meeting basic requirements'
            }
        };
        
        // Current level benefits calculation
        const currentLevelBenefits = {
            characterLevel: characterLevelDetails.current ? {
                level: characterLevelDetails.current,
                dailyIncome: characterLevelIncome,
                monthlyIncome: characterLevelIncome * 30,
                yearlyIncome: characterLevelIncome * 365,
                benefitDescription: characterLevelDetails.benefitStructure[characterLevelDetails.current]?.description || 'No level achieved'
            } : {
                level: null,
                dailyIncome: 0,
                monthlyIncome: 0,
                yearlyIncome: 0,
                benefitDescription: 'No character level achieved yet'
            },
            digitLevel: digitLevelDetails.current ? {
                level: digitLevelDetails.current,
                dailyIncome: digitLevelIncome,
                monthlyIncome: digitLevelIncome * 30,
                yearlyIncome: digitLevelIncome * 365,
                benefitDescription: digitLevelDetails.benefitStructure[digitLevelDetails.current]?.description || 'No level achieved'
            } : {
                level: null,
                dailyIncome: 0,
                monthlyIncome: 0,
                yearlyIncome: 0,
                benefitDescription: 'No digit level achieved yet'
            }
        };
        
        res.json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    wallets: {
                        normal: userNormalWallet,
                        investment: userInvestmentWallet,
                        total: userNormalWallet + userInvestmentWallet
                    }
                },
                levels: {
                    character: characterLevelDetails,
                    digit: digitLevelDetails
                },
                currentBenefits: currentLevelBenefits,
                team: teamStats,
                earnings: earningsSummary,
                nextLevel: nextLevelRequirements,
                benefitStructure: {
                    characterLevels: characterLevelDetails.benefitStructure,
                    digitLevels: digitLevelDetails.benefitStructure
                },
                lastUpdated: new Date()
            }
        });
        
    } catch (error) {
        console.error('Error getting levels and earnings report:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting levels and earnings report',
            error: error.message
        });
    }
});

// Get benefit structure for all levels
router.get('/benefit-structure', auth, async (req, res) => {
    try {
        const benefitStructure = {
            characterLevels: {
                A: {
                    percentage: 0.05,
                    description: "Level A - 0.05% daily income from total team balance",
                    dailyBenefit: "0.05% of total team members' wallet balance",
                    monthlyBenefit: "1.5% of total team members' wallet balance",
                    yearlyBenefit: "18.25% of total team members' wallet balance",
                    requirements: "Be referred by someone (automatic)",
                    example: "If team has $1000 total balance, you earn $0.50 daily"
                },
                B: {
                    percentage: 0.025,
                    description: "Level B - 0.025% daily income from total team balance",
                    dailyBenefit: "0.025% of total team members' wallet balance",
                    monthlyBenefit: "0.75% of total team members' wallet balance",
                    yearlyBenefit: "9.125% of total team members' wallet balance",
                    requirements: "Have 1 upline member in your chain",
                    example: "If team has $1000 total balance, you earn $0.25 daily"
                },
                C: {
                    percentage: 0.0125,
                    description: "Level C - 0.0125% daily income from total team balance",
                    dailyBenefit: "0.0125% of total team members' wallet balance",
                    monthlyBenefit: "0.375% of total team members' wallet balance",
                    yearlyBenefit: "4.5625% of total team members' wallet balance",
                    requirements: "Have 2 upline members in your chain",
                    example: "If team has $1000 total balance, you earn $0.125 daily"
                },
                D: {
                    percentage: 0.00625,
                    description: "Level D - 0.00625% daily income from total team balance",
                    dailyBenefit: "0.00625% of total team members' wallet balance",
                    monthlyBenefit: "0.1875% of total team members' wallet balance",
                    yearlyBenefit: "2.28125% of total team members' wallet balance",
                    requirements: "Have 3 upline members in your chain",
                    example: "If team has $1000 total balance, you earn $0.0625 daily"
                },
                E: {
                    percentage: 0.003125,
                    description: "Level E - 0.003125% daily income from total team balance",
                    dailyBenefit: "0.003125% of total team members' wallet balance",
                    monthlyBenefit: "0.09375% of total team members' wallet balance",
                    yearlyBenefit: "1.140625% of total team members' wallet balance",
                    requirements: "Have 4 upline members in your chain",
                    example: "If team has $1000 total balance, you earn $0.03125 daily"
                }
            },
            digitLevels: {
                Lvl1: {
                    percentage: 0.35,
                    description: "Level 1 - 0.35% daily income from own wallet",
                    requirements: {
                        directMembers: 5,
                        memberWalletMin: 50,
                        selfWalletMin: 200,
                        description: "5 direct members with $50+ wallet each, and your wallet must be $200+"
                    },
                    dailyBenefit: "0.35% of your normal wallet balance",
                    monthlyBenefit: "10.5% of your normal wallet balance",
                    yearlyBenefit: "127.75% of your normal wallet balance",
                    example: "If you have $1000 wallet, you earn $3.50 daily"
                },
                Lvl2: {
                    percentage: 0.70,
                    description: "Level 2 - 0.70% daily income from own wallet",
                    requirements: {
                        directMembers: 10,
                        memberWalletMin: 50,
                        selfWalletMin: 500,
                        description: "10 direct members with $50+ wallet each, and your wallet must be $500+"
                    },
                    dailyBenefit: "0.70% of your normal wallet balance",
                    monthlyBenefit: "21% of your normal wallet balance",
                    yearlyBenefit: "255.5% of your normal wallet balance",
                    example: "If you have $1000 wallet, you earn $7 daily"
                },
                Lvl3: {
                    percentage: 1.40,
                    description: "Level 3 - 1.40% daily income from own wallet",
                    requirements: {
                        directMembers: 20,
                        memberWalletMin: 50,
                        selfWalletMin: 1100,
                        description: "20 direct members with $50+ wallet each, and your wallet must be $1100+"
                    },
                    dailyBenefit: "1.40% of your normal wallet balance",
                    monthlyBenefit: "42% of your normal wallet balance",
                    yearlyBenefit: "511% of your normal wallet balance",
                    example: "If you have $1000 wallet, you earn $14 daily"
                },
                Lvl4: {
                    percentage: 2.50,
                    description: "Level 4 - 2.50% daily income from own wallet",
                    requirements: {
                        directMembers: 40,
                        memberWalletMin: 50,
                        selfWalletMin: 2500,
                        description: "40 direct members with $50+ wallet each, and your wallet must be $2500+"
                    },
                    dailyBenefit: "2.50% of your normal wallet balance",
                    monthlyBenefit: "75% of your normal wallet balance",
                    yearlyBenefit: "912.5% of your normal wallet balance",
                    example: "If you have $1000 wallet, you earn $25 daily"
                },
                Lvl5: {
                    percentage: 4.00,
                    description: "Level 5 - 4.00% daily income from own wallet",
                    requirements: {
                        directMembers: 80,
                        memberWalletMin: 50,
                        selfWalletMin: 10000,
                        description: "80 direct members with $50+ wallet each, and your wallet must be $10000+"
                    },
                    dailyBenefit: "4.00% of your normal wallet balance",
                    monthlyBenefit: "120% of your normal wallet balance",
                    yearlyBenefit: "1460% of your normal wallet balance",
                    example: "If you have $1000 wallet, you earn $40 daily"
                }
            },
            summary: {
                characterLevels: {
                    description: "Character levels are based on your position in the referral chain. The deeper you are in someone's downline, the higher your character level.",
                    totalLevels: 5,
                    levels: ['A', 'B', 'C', 'D', 'E'],
                    incomeSource: "Total team members' wallet balance",
                    calculation: "Percentage of total team members' wallet balance"
                },
                digitLevels: {
                    description: "Digit levels are based on your direct referrals and your own wallet balance. More referrals and higher wallet balance unlock higher levels.",
                    totalLevels: 5,
                    levels: ['Lvl1', 'Lvl2', 'Lvl3', 'Lvl4', 'Lvl5'],
                    incomeSource: "Your own normal wallet balance",
                    calculation: "Percentage of your own wallet balance"
                },
                totalIncome: "Daily income = Character Level Income + Digit Level Income",
                claiming: "Income can be claimed once per day",
                compounding: "Higher wallet balances lead to higher daily income"
            }
        };

        res.json({
            success: true,
            data: benefitStructure
        });

    } catch (error) {
        console.error('Error getting benefit structure:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting benefit structure',
            error: error.message
        });
    }
});

// Test character level calculation API
router.get('/test-character-level-calculation', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const LevelService = require('../services/levelService');
        const Level = require('../models/level.model');
        
        // Get user and level data
        const user = await User.findById(userId);
        let level = await Level.findOne({ userId });
        
        if (!level) {
            level = await LevelService.initializeLevel(userId);
        }
        
        // Get direct referrals with their balances
        const directReferrals = await User.find({ referredBy: userId })
            .select('name email phone normalWallet.balance createdAt');
        
        // Calculate total team balance
        const totalTeamBalance = directReferrals.reduce((sum, ref) => {
            return sum + (ref.normalWallet?.balance || 0);
        }, 0);
        
        // Calculate character level income
        const characterLevelIncome = await LevelService.calculateCharacterLevelIncome(userId);
        
        // Get character level percentages
        const characterLevelPercentages = {
            'A': 0.2,      // 0.05% of total team balance
            'B': 0.025,     // 0.025% of total team balance
            'C': 0.0125,    // 0.0125% of total team balance
            'D': 0.00625,   // 0.00625% of total team balance
            'E': 0.003125   // 0.003125% of total team balance
        };
        
        // Manual calculation for verification
        const currentLevel = level.characterLevel?.current;
        const percentage = characterLevelPercentages[currentLevel] || 0;
        const manualCalculation = (totalTeamBalance * percentage) / 100;
        
        res.json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    characterLevel: currentLevel
                },
                team: {
                    totalMembers: directReferrals.length,
                    totalBalance: totalTeamBalance,
                    members: directReferrals.map(ref => ({
                        name: ref.name,
                        email: ref.email,
                        balance: ref.normalWallet?.balance || 0
                    }))
                },
                calculation: {
                    characterLevel: currentLevel,
                    percentage: percentage,
                    totalTeamBalance: totalTeamBalance,
                    manualCalculation: manualCalculation,
                    serviceCalculation: characterLevelIncome,
                    calculationMatch: Math.abs(manualCalculation - characterLevelIncome) < 0.01
                },
                percentages: characterLevelPercentages
            }
        });
        
    } catch (error) {
        console.error('Error testing character level calculation:', error);
        res.status(500).json({
            success: false,
            message: 'Error testing character level calculation',
            error: error.message
        });
    }
});

// Test specific character level calculation with given values
router.post('/test-specific-calculation', auth, async (req, res) => {
    try {
        const { teamBalance, characterLevel } = req.body;
        
        if (!teamBalance || !characterLevel) {
            return res.status(400).json({
                success: false,
                message: 'Please provide teamBalance and characterLevel'
            });
        }
        
        // Character level percentages
        const characterLevelPercentages = {
            'A': 0.2,       // 0.2% of total team balance (0.05 * 4)
            'B': 0.025,     // 0.025% of total team balance
            'C': 0.0125,    // 0.0125% of total team balance
            'D': 0.00625,   // 0.00625% of total team balance
            'E': 0.003125   // 0.003125% of total team balance
        };
        
        const percentage = characterLevelPercentages[characterLevel] || 0;
        const dailyIncome = (teamBalance * percentage) / 100;
        
        // Test with your specific values
        const testValues = {
            'A': {
                teamBalance: 3736,
                expectedIncome: (3736 * 0.05) / 100
            },
            'B': {
                teamBalance: 1111,
                expectedIncome: (1111 * 0.025) / 100
            }
        };
        
        res.json({
            success: true,
            data: {
                input: {
                    teamBalance: teamBalance,
                    characterLevel: characterLevel
                },
                calculation: {
                    percentage: percentage,
                    dailyIncome: dailyIncome,
                    formula: `(${teamBalance} * ${percentage}) / 100 = ${dailyIncome}`
                },
                testValues: testValues,
                totalExpected: testValues['A'].expectedIncome + testValues['B'].expectedIncome
            }
        });
        
    } catch (error) {
        console.error('Error testing specific calculation:', error);
        res.status(500).json({
            success: false,
            message: 'Error testing specific calculation',
            error: error.message
        });
    }
});

module.exports = router;
