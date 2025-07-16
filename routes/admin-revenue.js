const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const User = require('../models/user.model');
const Deposit = require('../models/deposit.model');
const WithdrawalRequest = require('../models/withdrawal.model');
const { InvestmentPlan, UserInvestment } = require('../models/investment.model');

// ==================== ADMIN REVENUE MANAGEMENT ====================

// Get comprehensive revenue overview
router.get('/overview', adminAuth, async (req, res) => {
    try {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfYear = new Date(today.getFullYear(), 0, 1);

        // Total Revenue Calculations
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

        // Pending Amounts
        const pendingDeposits = await Deposit.aggregate([
            { $match: { status: 'pending' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const pendingWithdrawals = await WithdrawalRequest.aggregate([
            { $match: { status: 'pending' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        // Net Revenue Calculations
        const totalDepositsAmount = totalDeposits[0]?.total || 0;
        const totalWithdrawalsAmount = totalWithdrawals[0]?.total || 0;
        const monthlyDepositsAmount = monthlyDeposits[0]?.total || 0;
        const monthlyWithdrawalsAmount = monthlyWithdrawals[0]?.total || 0;
        const pendingDepositsAmount = pendingDeposits[0]?.total || 0;
        const pendingWithdrawalsAmount = pendingWithdrawals[0]?.total || 0;

        res.json({
            success: true,
            data: {
                totalRevenue: {
                    deposits: totalDepositsAmount,
                    withdrawals: totalWithdrawalsAmount,
                    investments: totalInvestments[0]?.total || 0,
                    investmentReturns: totalInvestmentReturns[0]?.total || 0,
                    netRevenue: totalDepositsAmount - totalWithdrawalsAmount,
                    profitMargin: totalDepositsAmount > 0 ? ((totalDepositsAmount - totalWithdrawalsAmount) / totalDepositsAmount * 100).toFixed(2) : 0
                },
                monthlyRevenue: {
                    deposits: monthlyDepositsAmount,
                    withdrawals: monthlyWithdrawalsAmount,
                    netRevenue: monthlyDepositsAmount - monthlyWithdrawalsAmount,
                    growthRate: monthlyDepositsAmount > 0 ? ((monthlyDepositsAmount - monthlyWithdrawalsAmount) / monthlyDepositsAmount * 100).toFixed(2) : 0
                },
                pendingAmounts: {
                    deposits: pendingDepositsAmount,
                    withdrawals: pendingWithdrawalsAmount,
                    total: pendingDepositsAmount + pendingWithdrawalsAmount
                },
                summary: {
                    totalUsers: await User.countDocuments({ role: 'user' }),
                    activeInvestments: await UserInvestment.countDocuments({ isCompleted: false }),
                    completedInvestments: await UserInvestment.countDocuments({ isCompleted: true }),
                    withdrawnInvestments: await UserInvestment.countDocuments({ isWithdrawn: true })
                }
            }
        });

    } catch (error) {
        console.error('Revenue overview error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching revenue overview',
            error: error.message
        });
    }
});

// Get all deposits with filtering and pagination
router.get('/deposits', adminAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const status = req.query.status; // pending, approved, rejected
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;

        let query = {};
        
        if (status) {
            query.status = status;
        }
        
        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const deposits = await Deposit.find(query)
            .populate('userId', 'name email phone')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Deposit.countDocuments(query);
        const totalAmount = await Deposit.aggregate([
            { $match: query },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        res.json({
            success: true,
            data: {
                deposits: deposits,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalDeposits: total,
                    hasNext: page * limit < total,
                    hasPrev: page > 1
                },
                summary: {
                    totalAmount: totalAmount[0]?.total || 0,
                    pendingCount: await Deposit.countDocuments({ status: 'pending' }),
                    approvedCount: await Deposit.countDocuments({ status: 'approved' }),
                    rejectedCount: await Deposit.countDocuments({ status: 'rejected' })
                }
            }
        });

    } catch (error) {
        console.error('Get deposits error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching deposits',
            error: error.message
        });
    }
});

// Get all withdrawal requests with filtering and pagination
router.get('/withdrawals', adminAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const status = req.query.status; // pending, approved, rejected
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;

        let query = {};
        
        if (status) {
            query.status = status;
        }
        
        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const withdrawals = await WithdrawalRequest.find(query)
            .populate('userId', 'name email phone')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await WithdrawalRequest.countDocuments(query);
        const totalAmount = await WithdrawalRequest.aggregate([
            { $match: query },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        res.json({
            success: true,
            data: {
                withdrawals: withdrawals,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalWithdrawals: total,
                    hasNext: page * limit < total,
                    hasPrev: page > 1
                },
                summary: {
                    totalAmount: totalAmount[0]?.total || 0,
                    pendingCount: await WithdrawalRequest.countDocuments({ status: 'pending' }),
                    approvedCount: await WithdrawalRequest.countDocuments({ status: 'approved' }),
                    rejectedCount: await WithdrawalRequest.countDocuments({ status: 'rejected' })
                }
            }
        });

    } catch (error) {
        console.error('Get withdrawals error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching withdrawals',
            error: error.message
        });
    }
});

// Get all user investments with filtering and pagination
router.get('/investments', adminAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const status = req.query.status; // active, completed, withdrawn
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;

        let query = {};
        
        if (status === 'active') {
            query.isCompleted = false;
        } else if (status === 'completed') {
            query.isCompleted = true;
        } else if (status === 'withdrawn') {
            query.isWithdrawn = true;
        }
        
        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const investments = await UserInvestment.find(query)
            .populate('userId', 'name email phone')
            .populate('planId', 'title dailyPercentage durationDays')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await UserInvestment.countDocuments(query);
        const totalAmount = await UserInvestment.aggregate([
            { $match: query },
            { $group: { _id: null, total: { $sum: '$investmentAmount' } } }
        ]);

        const totalEarned = await UserInvestment.aggregate([
            { $match: query },
            { $group: { _id: null, total: { $sum: '$totalEarned' } } }
        ]);

        res.json({
            success: true,
            data: {
                investments: investments,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalInvestments: total,
                    hasNext: page * limit < total,
                    hasPrev: page > 1
                },
                summary: {
                    totalAmount: totalAmount[0]?.total || 0,
                    totalEarned: totalEarned[0]?.total || 0,
                    activeCount: await UserInvestment.countDocuments({ isCompleted: false }),
                    completedCount: await UserInvestment.countDocuments({ isCompleted: true }),
                    withdrawnCount: await UserInvestment.countDocuments({ isWithdrawn: true })
                }
            }
        });

    } catch (error) {
        console.error('Get investments error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching investments',
            error: error.message
        });
    }
});

// Get revenue chart data by period
router.get('/revenue-chart', adminAuth, async (req, res) => {
    try {
        const { period = '30' } = req.query; // days
        const days = parseInt(period);
        const today = new Date();
        const startDate = new Date(today.getTime() - (days * 24 * 60 * 60 * 1000));

        // Daily deposits
        const dailyDeposits = await Deposit.aggregate([
            { $match: { 
                status: 'approved',
                createdAt: { $gte: startDate }
            }},
            { $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                amount: { $sum: '$amount' },
                count: { $sum: 1 }
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
                amount: { $sum: '$amount' },
                count: { $sum: 1 }
            }},
            { $sort: { _id: 1 } }
        ]);

        // Daily investments
        const dailyInvestments = await UserInvestment.aggregate([
            { $match: { 
                createdAt: { $gte: startDate }
            }},
            { $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                amount: { $sum: '$investmentAmount' },
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
            
            const depositData = dailyDeposits.find(item => item._id === dateStr);
            const withdrawalData = dailyWithdrawals.find(item => item._id === dateStr);
            const investmentData = dailyInvestments.find(item => item._id === dateStr);
            
            filledData.push({
                date: dateStr,
                deposits: depositData ? depositData.amount : 0,
                withdrawals: withdrawalData ? withdrawalData.amount : 0,
                investments: investmentData ? investmentData.amount : 0,
                netRevenue: (depositData ? depositData.amount : 0) - (withdrawalData ? withdrawalData.amount : 0),
                depositCount: depositData ? depositData.count : 0,
                withdrawalCount: withdrawalData ? withdrawalData.count : 0,
                investmentCount: investmentData ? investmentData.count : 0
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

// Get top revenue generating users
router.get('/top-users', adminAuth, async (req, res) => {
    try {
        const { type = 'deposits' } = req.query; // deposits, withdrawals, investments

        let topUsers = [];

        if (type === 'deposits') {
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
                    phone: '$user.phone',
                    totalDeposits: 1,
                    depositCount: 1
                }}
            ]);
        } else if (type === 'withdrawals') {
            topUsers = await WithdrawalRequest.aggregate([
                { $match: { status: 'approved' } },
                { $group: {
                    _id: '$userId',
                    totalWithdrawals: { $sum: '$amount' },
                    withdrawalCount: { $sum: 1 }
                }},
                { $sort: { totalWithdrawals: -1 } },
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
                    phone: '$user.phone',
                    totalWithdrawals: 1,
                    withdrawalCount: 1
                }}
            ]);
        } else if (type === 'investments') {
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
                    phone: '$user.phone',
                    totalInvestment: 1,
                    totalEarned: 1,
                    investmentCount: 1
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

// Export revenue data
router.get('/export', adminAuth, async (req, res) => {
    try {
        const { type, startDate, endDate } = req.query;
        
        let query = {};
        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        let data = [];

        if (type === 'deposits') {
            data = await Deposit.find(query)
                .populate('userId', 'name email phone')
                .sort({ createdAt: -1 });
        } else if (type === 'withdrawals') {
            data = await WithdrawalRequest.find(query)
                .populate('userId', 'name email phone')
                .sort({ createdAt: -1 });
        } else if (type === 'investments') {
            data = await UserInvestment.find(query)
                .populate('userId', 'name email phone')
                .populate('planId', 'title')
                .sort({ createdAt: -1 });
        }

        res.json({
            success: true,
            data: {
                type: type,
                records: data,
                totalRecords: data.length,
                exportDate: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({
            success: false,
            message: 'Error exporting data',
            error: error.message
        });
    }
});

module.exports = router; 