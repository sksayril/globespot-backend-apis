const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const User = require('../models/user.model');
const Deposit = require('../models/deposit.model');
const WithdrawalRequest = require('../models/withdrawal.model');
const { InvestmentPlan, UserInvestment } = require('../models/investment.model');

// ==================== ADMIN DASHBOARD STATISTICS ====================

// Get comprehensive dashboard statistics
router.get('/statistics', adminAuth, async (req, res) => {
    try {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfYear = new Date(today.getFullYear(), 0, 1);

        // User Statistics
        const totalUsers = await User.countDocuments({ role: 'user' });
        const activeUsers = await User.countDocuments({ role: 'user', isActive: true });
        const blockedUsers = await User.countDocuments({ role: 'user', isBlocked: true });
        const newUsersToday = await User.countDocuments({
            role: 'user',
            createdAt: { $gte: new Date(today.setHours(0, 0, 0, 0)) }
        });
        const newUsersThisMonth = await User.countDocuments({
            role: 'user',
            createdAt: { $gte: startOfMonth }
        });
        const newUsersThisYear = await User.countDocuments({
            role: 'user',
            createdAt: { $gte: startOfYear }
        });

        // Revenue Statistics
        const totalDeposits = await Deposit.aggregate([
            { $match: { status: 'approved' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const totalWithdrawals = await WithdrawalRequest.aggregate([
            { $match: { status: 'approved' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const totalInvestments = await UserInvestment.aggregate([
            { $group: { _id: null, total: { $sum: '$investmentAmount' } } }
        ]);

        const totalInvestmentReturns = await UserInvestment.aggregate([
            { $match: { isWithdrawn: true } },
            { $group: { _id: null, total: { $sum: '$totalEarned' } } }
        ]);

        // Monthly Revenue
        const monthlyDeposits = await Deposit.aggregate([
            { $match: { 
                status: 'approved',
                createdAt: { $gte: startOfMonth }
            }},
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const monthlyWithdrawals = await WithdrawalRequest.aggregate([
            { $match: { 
                status: 'approved',
                createdAt: { $gte: startOfMonth }
            }},
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        // Pending Transactions
        const pendingDeposits = await Deposit.countDocuments({ status: 'pending' });
        const pendingWithdrawals = await WithdrawalRequest.countDocuments({ status: 'pending' });

        // Investment Statistics
        const activeInvestments = await UserInvestment.countDocuments({ isCompleted: false });
        const completedInvestments = await UserInvestment.countDocuments({ isCompleted: true });
        const withdrawnInvestments = await UserInvestment.countDocuments({ isWithdrawn: true });

        // User Joining Flow (Last 30 days)
        const last30Days = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
        const dailyRegistrations = await User.aggregate([
            { $match: { 
                role: 'user',
                createdAt: { $gte: last30Days }
            }},
            { $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                count: { $sum: 1 }
            }},
            { $sort: { _id: 1 } }
        ]);

        // Referral Statistics
        const usersWithReferrals = await User.countDocuments({
            role: 'user',
            referralLevel: { $gt: 0 }
        });

        const totalReferralBonus = await User.aggregate([
            { $match: { role: 'user' } },
            { $unwind: '$normalWallet.transactions' },
            { $match: { 'normalWallet.transactions.type': 'referral_bonus' } },
            { $group: { _id: null, total: { $sum: '$normalWallet.transactions.amount' } } }
        ]);

        // Wallet Balances
        const totalNormalWalletBalance = await User.aggregate([
            { $match: { role: 'user' } },
            { $group: { _id: null, total: { $sum: '$normalWallet.balance' } } }
        ]);

        const totalInvestmentWalletBalance = await User.aggregate([
            { $match: { role: 'user' } },
            { $group: { _id: null, total: { $sum: '$investmentWallet.balance' } } }
        ]);

        res.json({
            success: true,
            data: {
                // User Statistics
                users: {
                    total: totalUsers,
                    active: activeUsers,
                    blocked: blockedUsers,
                    newToday: newUsersToday,
                    newThisMonth: newUsersThisMonth,
                    newThisYear: newUsersThisYear,
                    withReferrals: usersWithReferrals
                },

                // Revenue Statistics
                revenue: {
                    totalDeposits: totalDeposits[0]?.total || 0,
                    totalWithdrawals: totalWithdrawals[0]?.total || 0,
                    totalInvestments: totalInvestments[0]?.total || 0,
                    totalInvestmentReturns: totalInvestmentReturns[0]?.total || 0,
                    monthlyDeposits: monthlyDeposits[0]?.total || 0,
                    monthlyWithdrawals: monthlyWithdrawals[0]?.total || 0,
                    netRevenue: (totalDeposits[0]?.total || 0) - (totalWithdrawals[0]?.total || 0),
                    monthlyNetRevenue: (monthlyDeposits[0]?.total || 0) - (monthlyWithdrawals[0]?.total || 0)
                },

                // Transaction Statistics
                transactions: {
                    pendingDeposits: pendingDeposits,
                    pendingWithdrawals: pendingWithdrawals,
                    totalReferralBonus: totalReferralBonus[0]?.total || 0
                },

                // Investment Statistics
                investments: {
                    active: activeInvestments,
                    completed: completedInvestments,
                    withdrawn: withdrawnInvestments
                },

                // Wallet Balances
                wallets: {
                    totalNormalBalance: totalNormalWalletBalance[0]?.total || 0,
                    totalInvestmentBalance: totalInvestmentWalletBalance[0]?.total || 0
                },

                // User Joining Flow
                userFlow: {
                    dailyRegistrations: dailyRegistrations
                }
            }
        });

    } catch (error) {
        console.error('Dashboard statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard statistics',
            error: error.message
        });
    }
});

// Get recent user registrations
router.get('/recent-users', adminAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const users = await User.find({ role: 'user' })
            .select('name email phone referralCode referredBy createdAt isActive isBlocked')
            .populate('referredBy', 'name email')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await User.countDocuments({ role: 'user' });

        res.json({
            success: true,
            data: {
                users: users,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalUsers: total,
                    hasNext: page * limit < total,
                    hasPrev: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Recent users error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching recent users',
            error: error.message
        });
    }
});

// Get recent transactions
router.get('/recent-transactions', adminAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        // Get recent deposits
        const deposits = await Deposit.find()
            .populate('userId', 'name email')
            .sort({ createdAt: -1 })
            .limit(limit);

        // Get recent withdrawals
        const withdrawals = await WithdrawalRequest.find()
            .populate('userId', 'name email')
            .sort({ createdAt: -1 })
            .limit(limit);

        // Combine and sort by date
        const allTransactions = [
            ...deposits.map(d => ({ ...d.toObject(), type: 'deposit' })),
            ...withdrawals.map(w => ({ ...w.toObject(), type: 'withdrawal' }))
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json({
            success: true,
            data: {
                transactions: allTransactions.slice(0, limit),
                deposits: deposits,
                withdrawals: withdrawals
            }
        });

    } catch (error) {
        console.error('Recent transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching recent transactions',
            error: error.message
        });
    }
});

// Get user growth chart data
router.get('/user-growth', adminAuth, async (req, res) => {
    try {
        const { period = '30' } = req.query; // days
        const days = parseInt(period);
        const startDate = new Date(today.getTime() - (days * 24 * 60 * 60 * 1000));

        const userGrowth = await User.aggregate([
            { $match: { 
                role: 'user',
                createdAt: { $gte: startDate }
            }},
            { $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                count: { $sum: 1 }
            }},
            { $sort: { _id: 1 } }
        ]);

        // Fill missing dates with 0
        const filledData = [];
        for (let i = 0; i < days; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            const existingData = userGrowth.find(item => item._id === dateStr);
            filledData.push({
                date: dateStr,
                count: existingData ? existingData.count : 0
            });
        }

        res.json({
            success: true,
            data: {
                period: days,
                growthData: filledData
            }
        });

    } catch (error) {
        console.error('User growth error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user growth data',
            error: error.message
        });
    }
});

// Get revenue chart data
router.get('/revenue-chart', adminAuth, async (req, res) => {
    try {
        const { period = '30' } = req.query; // days
        const days = parseInt(period);
        const startDate = new Date(today.getTime() - (days * 24 * 60 * 60 * 1000));

        // Daily deposits
        const dailyDeposits = await Deposit.aggregate([
            { $match: { 
                status: 'approved',
                createdAt: { $gte: startDate }
            }},
            { $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                amount: { $sum: '$amount' }
            }},
            { $sort: { _id: 1 } }
        ]);

        // Daily withdrawals
        const dailyWithdrawals = await WithdrawalRequest.aggregate([
            { $match: { 
                status: 'approved',
                createdAt: { $gte: startDate }
            }},
            { $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                amount: { $sum: '$amount' }
            }},
            { $sort: { _id: 1 } }
        ]);

        // Fill missing dates with 0
        const filledData = [];
        for (let i = 0; i < days; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            
            const depositData = dailyDeposits.find(item => item._id === dateStr);
            const withdrawalData = dailyWithdrawals.find(item => item._id === dateStr);
            
            filledData.push({
                date: dateStr,
                deposits: depositData ? depositData.amount : 0,
                withdrawals: withdrawalData ? withdrawalData.amount : 0,
                netRevenue: (depositData ? depositData.amount : 0) - (withdrawalData ? withdrawalData.amount : 0)
            });
        }

        res.json({
            success: true,
            data: {
                period: days,
                revenueData: filledData
            }
        });

    } catch (error) {
        console.error('Revenue chart error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching revenue chart data',
            error: error.message
        });
    }
});

// Get top performing users
router.get('/top-users', adminAuth, async (req, res) => {
    try {
        const { type = 'investment' } = req.query; // investment, referral, deposit

        let topUsers = [];

        if (type === 'investment') {
            topUsers = await UserInvestment.aggregate([
                { $group: {
                    _id: '$userId',
                    totalInvestment: { $sum: '$investmentAmount' },
                    totalEarned: { $sum: '$totalEarned' },
                    investmentCount: { $sum: 1 }
                }},
                { $sort: { totalInvestment: -1 } },
                { $limit: 10 },
                { $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }},
                { $unwind: '$user' },
                { $project: {
                    name: '$user.name',
                    email: '$user.email',
                    totalInvestment: 1,
                    totalEarned: 1,
                    investmentCount: 1
                }}
            ]);
        } else if (type === 'referral') {
            topUsers = await User.aggregate([
                { $match: { role: 'user' } },
                { $project: {
                    name: 1,
                    email: 1,
                    referralLevel: 1,
                    referralCount: { $size: { $ifNull: ['$referredUsers', []] } }
                }},
                { $sort: { referralLevel: -1 } },
                { $limit: 10 }
            ]);
        } else if (type === 'deposit') {
            topUsers = await Deposit.aggregate([
                { $match: { status: 'approved' } },
                { $group: {
                    _id: '$userId',
                    totalDeposits: { $sum: '$amount' },
                    depositCount: { $sum: 1 }
                }},
                { $sort: { totalDeposits: -1 } },
                { $limit: 10 },
                { $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }},
                { $unwind: '$user' },
                { $project: {
                    name: '$user.name',
                    email: '$user.email',
                    totalDeposits: 1,
                    depositCount: 1
                }}
            ]);
        }

        res.json({
            success: true,
            data: {
                type: type,
                topUsers: topUsers
            }
        });

    } catch (error) {
        console.error('Top users error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching top users',
            error: error.message
        });
    }
});

module.exports = router; 