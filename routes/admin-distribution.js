const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const User = require('../models/user.model');
const Level = require('../models/level.model');
const LevelService = require('../services/levelService');

// Get Total Distribution Overview
router.get('/overview', adminAuth, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        // Parse date filters
        let dateFilter = {};
        if (startDate && endDate) {
            dateFilter = {
                createdAt: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            };
        }

        // Get all users with their level and income data
        const users = await User.find({ role: 'user', ...dateFilter })
            .populate('referredBy', 'name email referralCode');

        // Get all level data
        const levels = await Level.find({ userId: { $in: users.map(u => u._id) } });

        let totalDistribution = {
            totalUsers: users.length,
            totalDailyIncome: 0,
            totalLevelIncome: 0,
            totalCharacterLevelIncome: 0,
            totalDigitLevelIncome: 0,
            totalNormalWalletBalance: 0,
            totalInvestmentWalletBalance: 0,
            totalReferralBonus: 0,
            totalDeposits: 0,
            totalWithdrawals: 0,
            dailyDistribution: 0,
            weeklyDistribution: 0,
            monthlyDistribution: 0,
            userBreakdown: []
        };

        // Calculate for each user
        for (const user of users) {
            const userLevel = levels.find(l => l.userId.toString() === user._id.toString());
            
            // Calculate daily income (0.5% of normal wallet)
            const dailyIncome = user.normalWallet.balance * 0.005;
            
            // Calculate level incomes
            let characterLevelIncome = 0;
            let digitLevelIncome = 0;
            
            if (userLevel) {
                // Character level income from parent
                if (userLevel.characterLevel.current && user.referredBy) {
                    const parentUser = users.find(u => u._id.toString() === user.referredBy.toString());
                    if (parentUser) {
                        const parentBalance = parentUser.normalWallet.balance;
                        const percentage = userLevel.characterLevel.percentages[userLevel.characterLevel.current];
                        characterLevelIncome = (parentBalance * percentage) / 100;
                    }
                }
                
                // Digit level income from own wallet
                if (userLevel.digitLevel.current) {
                    const userBalance = user.normalWallet.balance;
                    const percentage = userLevel.digitLevel.percentages[userLevel.digitLevel.current];
                    digitLevelIncome = (userBalance * percentage) / 100;
                }
            }
            
            // Calculate referral bonus from transactions
            const referralBonus = user.normalWallet.transactions
                .filter(t => t.type === 'referral_bonus' && t.status === 'approved')
                .reduce((sum, t) => sum + t.amount, 0);
            
            // Calculate deposits and withdrawals
            const deposits = user.investmentWallet.transactions
                .filter(t => t.type === 'deposit' && t.status === 'approved')
                .reduce((sum, t) => sum + t.amount, 0);
            
            const withdrawals = user.normalWallet.transactions
                .filter(t => t.type === 'withdrawal' && t.status === 'approved')
                .reduce((sum, t) => sum + t.amount, 0);
            
            const userTotal = dailyIncome + characterLevelIncome + digitLevelIncome;
            
            totalDistribution.totalDailyIncome += dailyIncome;
            totalDistribution.totalCharacterLevelIncome += characterLevelIncome;
            totalDistribution.totalDigitLevelIncome += digitLevelIncome;
            totalDistribution.totalLevelIncome += characterLevelIncome + digitLevelIncome;
            totalDistribution.totalNormalWalletBalance += user.normalWallet.balance;
            totalDistribution.totalInvestmentWalletBalance += user.investmentWallet.balance;
            totalDistribution.totalReferralBonus += referralBonus;
            totalDistribution.totalDeposits += deposits;
            totalDistribution.totalWithdrawals += withdrawals;
            
            // Add user breakdown
            totalDistribution.userBreakdown.push({
                userId: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                referralCode: user.referralCode,
                referredBy: user.referredBy ? {
                    id: user.referredBy._id,
                    name: user.referredBy.name,
                    email: user.referredBy.email
                } : null,
                normalWalletBalance: user.normalWallet.balance,
                investmentWalletBalance: user.investmentWallet.balance,
                dailyIncome: dailyIncome,
                characterLevelIncome: characterLevelIncome,
                digitLevelIncome: digitLevelIncome,
                totalLevelIncome: characterLevelIncome + digitLevelIncome,
                totalIncome: userTotal,
                referralBonus: referralBonus,
                deposits: deposits,
                withdrawals: withdrawals,
                characterLevel: userLevel?.characterLevel?.current || null,
                digitLevel: userLevel?.digitLevel?.current || null,
                joinedDate: user.createdAt,
                lastActive: user.updatedAt
            });
        }
        
        // Calculate time-based distributions
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        // Filter for time periods
        const weeklyUsers = users.filter(u => u.createdAt >= weekAgo);
        const monthlyUsers = users.filter(u => u.createdAt >= monthAgo);
        
        totalDistribution.dailyDistribution = totalDistribution.totalDailyIncome;
        totalDistribution.weeklyDistribution = weeklyUsers.reduce((sum, user) => {
            const userLevel = levels.find(l => l.userId.toString() === user._id.toString());
            let income = user.normalWallet.balance * 0.005; // Daily income
            
            if (userLevel) {
                if (userLevel.characterLevel.current && user.referredBy) {
                    const parentUser = users.find(u => u._id.toString() === user.referredBy.toString());
                    if (parentUser) {
                        const percentage = userLevel.characterLevel.percentages[userLevel.characterLevel.current];
                        income += (parentUser.normalWallet.balance * percentage) / 100;
                    }
                }
                if (userLevel.digitLevel.current) {
                    const percentage = userLevel.digitLevel.percentages[userLevel.digitLevel.current];
                    income += (user.normalWallet.balance * percentage) / 100;
                }
            }
            return sum + income;
        }, 0);
        
        totalDistribution.monthlyDistribution = monthlyUsers.reduce((sum, user) => {
            const userLevel = levels.find(l => l.userId.toString() === user._id.toString());
            let income = user.normalWallet.balance * 0.005; // Daily income
            
            if (userLevel) {
                if (userLevel.characterLevel.current && user.referredBy) {
                    const parentUser = users.find(u => u._id.toString() === user.referredBy.toString());
                    if (parentUser) {
                        const percentage = userLevel.characterLevel.percentages[userLevel.characterLevel.current];
                        income += (parentUser.normalWallet.balance * percentage) / 100;
                    }
                }
                if (userLevel.digitLevel.current) {
                    const percentage = userLevel.digitLevel.percentages[userLevel.digitLevel.current];
                    income += (user.normalWallet.balance * percentage) / 100;
                }
            }
            return sum + income;
        }, 0);

        res.json({
            success: true,
            data: totalDistribution
        });
    } catch (error) {
        console.error('Error getting distribution overview:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting distribution overview',
            error: error.message
        });
    }
});

// Get Daily Distribution Statistics
router.get('/daily', adminAuth, async (req, res) => {
    try {
        const { date } = req.query;
        const targetDate = date ? new Date(date) : new Date();
        targetDate.setHours(0, 0, 0, 0);
        
        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);
        
        // Get users who were active on this date
        const users = await User.find({
            role: 'user',
            createdAt: { $lte: nextDay }
        }).populate('referredBy', 'name email referralCode');
        
        const levels = await Level.find({ userId: { $in: users.map(u => u._id) } });
        
        let dailyStats = {
            date: targetDate,
            totalUsers: users.length,
            activeUsers: 0,
            totalDailyIncome: 0,
            totalLevelIncome: 0,
            totalCharacterLevelIncome: 0,
            totalDigitLevelIncome: 0,
            averageIncomePerUser: 0,
            topEarners: [],
            levelBreakdown: {
                characterLevels: {},
                digitLevels: {}
            }
        };
        
        const userIncomes = [];
        
        for (const user of users) {
            const userLevel = levels.find(l => l.userId.toString() === user._id.toString());
            
            // Check if user was active (has transactions on this date)
            const hasActivity = user.normalWallet.transactions.some(t => {
                const transactionDate = new Date(t.date);
                return transactionDate >= targetDate && transactionDate < nextDay;
            });
            
            if (hasActivity) {
                dailyStats.activeUsers++;
            }
            
            // Calculate incomes
            const dailyIncome = user.normalWallet.balance * 0.005;
            let characterLevelIncome = 0;
            let digitLevelIncome = 0;
            
            if (userLevel) {
                if (userLevel.characterLevel.current && user.referredBy) {
                    const parentUser = users.find(u => u._id.toString() === user.referredBy.toString());
                    if (parentUser) {
                        const percentage = userLevel.characterLevel.percentages[userLevel.characterLevel.current];
                        characterLevelIncome = (parentUser.normalWallet.balance * percentage) / 100;
                    }
                }
                
                if (userLevel.digitLevel.current) {
                    const percentage = userLevel.digitLevel.percentages[userLevel.digitLevel.current];
                    digitLevelIncome = (user.normalWallet.balance * percentage) / 100;
                }
            }
            
            const totalIncome = dailyIncome + characterLevelIncome + digitLevelIncome;
            
            dailyStats.totalDailyIncome += dailyIncome;
            dailyStats.totalCharacterLevelIncome += characterLevelIncome;
            dailyStats.totalDigitLevelIncome += digitLevelIncome;
            dailyStats.totalLevelIncome += characterLevelIncome + digitLevelIncome;
            
            userIncomes.push({
                userId: user._id,
                name: user.name,
                email: user.email,
                totalIncome: totalIncome,
                dailyIncome: dailyIncome,
                characterLevelIncome: characterLevelIncome,
                digitLevelIncome: digitLevelIncome,
                characterLevel: userLevel?.characterLevel?.current || null,
                digitLevel: userLevel?.digitLevel?.current || null
            });
            
            // Track level breakdown
            if (userLevel?.characterLevel?.current) {
                const level = userLevel.characterLevel.current;
                if (!dailyStats.levelBreakdown.characterLevels[level]) {
                    dailyStats.levelBreakdown.characterLevels[level] = {
                        count: 0,
                        totalIncome: 0
                    };
                }
                dailyStats.levelBreakdown.characterLevels[level].count++;
                dailyStats.levelBreakdown.characterLevels[level].totalIncome += characterLevelIncome;
            }
            
            if (userLevel?.digitLevel?.current) {
                const level = userLevel.digitLevel.current;
                if (!dailyStats.levelBreakdown.digitLevels[level]) {
                    dailyStats.levelBreakdown.digitLevels[level] = {
                        count: 0,
                        totalIncome: 0
                    };
                }
                dailyStats.levelBreakdown.digitLevels[level].count++;
                dailyStats.levelBreakdown.digitLevels[level].totalIncome += digitLevelIncome;
            }
        }
        
        // Calculate average income
        dailyStats.averageIncomePerUser = dailyStats.totalDailyIncome / dailyStats.totalUsers;
        
        // Get top earners
        dailyStats.topEarners = userIncomes
            .sort((a, b) => b.totalIncome - a.totalIncome)
            .slice(0, 10);
        
        res.json({
            success: true,
            data: dailyStats
        });
    } catch (error) {
        console.error('Error getting daily distribution:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting daily distribution',
            error: error.message
        });
    }
});

// Get Weekly Distribution Statistics
router.get('/weekly', adminAuth, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        let start, end;
        if (startDate && endDate) {
            start = new Date(startDate);
            end = new Date(endDate);
        } else {
            // Default to current week
            const now = new Date();
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
            end = new Date(start);
            end.setDate(end.getDate() + 7);
        }
        
        const users = await User.find({
            role: 'user',
            createdAt: { $lte: end }
        }).populate('referredBy', 'name email referralCode');
        
        const levels = await Level.find({ userId: { $in: users.map(u => u._id) } });
        
        let weeklyStats = {
            startDate: start,
            endDate: end,
            totalUsers: users.length,
            newUsers: 0,
            totalDailyIncome: 0,
            totalLevelIncome: 0,
            totalCharacterLevelIncome: 0,
            totalDigitLevelIncome: 0,
            averageIncomePerUser: 0,
            dailyBreakdown: [],
            topEarners: []
        };
        
        const userIncomes = [];
        
        // Calculate daily breakdown for the week
        for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
            const dayStart = new Date(d);
            const dayEnd = new Date(d);
            dayEnd.setDate(dayEnd.getDate() + 1);
            
            let dayIncome = 0;
            let dayLevelIncome = 0;
            
            for (const user of users) {
                const userLevel = levels.find(l => l.userId.toString() === user._id.toString());
                
                // Count new users for this day
                if (user.createdAt >= dayStart && user.createdAt < dayEnd) {
                    weeklyStats.newUsers++;
                }
                
                // Calculate incomes
                const dailyIncome = user.normalWallet.balance * 0.005;
                let characterLevelIncome = 0;
                let digitLevelIncome = 0;
                
                if (userLevel) {
                    if (userLevel.characterLevel.current && user.referredBy) {
                        const parentUser = users.find(u => u._id.toString() === user.referredBy.toString());
                        if (parentUser) {
                            const percentage = userLevel.characterLevel.percentages[userLevel.characterLevel.current];
                            characterLevelIncome = (parentUser.normalWallet.balance * percentage) / 100;
                        }
                    }
                    
                    if (userLevel.digitLevel.current) {
                        const percentage = userLevel.digitLevel.percentages[userLevel.digitLevel.current];
                        digitLevelIncome = (user.normalWallet.balance * percentage) / 100;
                    }
                }
                
                const totalIncome = dailyIncome + characterLevelIncome + digitLevelIncome;
                
                dayIncome += dailyIncome;
                dayLevelIncome += characterLevelIncome + digitLevelIncome;
                
                // Accumulate for total week
                weeklyStats.totalDailyIncome += dailyIncome;
                weeklyStats.totalCharacterLevelIncome += characterLevelIncome;
                weeklyStats.totalDigitLevelIncome += digitLevelIncome;
                weeklyStats.totalLevelIncome += characterLevelIncome + digitLevelIncome;
                
                userIncomes.push({
                    userId: user._id,
                    name: user.name,
                    email: user.email,
                    totalIncome: totalIncome,
                    dailyIncome: dailyIncome,
                    characterLevelIncome: characterLevelIncome,
                    digitLevelIncome: digitLevelIncome
                });
            }
            
            weeklyStats.dailyBreakdown.push({
                date: new Date(dayStart),
                dailyIncome: dayIncome,
                levelIncome: dayLevelIncome,
                totalIncome: dayIncome + dayLevelIncome
            });
        }
        
        // Calculate average income
        weeklyStats.averageIncomePerUser = weeklyStats.totalDailyIncome / weeklyStats.totalUsers;
        
        // Get top earners
        weeklyStats.topEarners = userIncomes
            .sort((a, b) => b.totalIncome - a.totalIncome)
            .slice(0, 10);
        
        res.json({
            success: true,
            data: weeklyStats
        });
    } catch (error) {
        console.error('Error getting weekly distribution:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting weekly distribution',
            error: error.message
        });
    }
});

// Get Monthly Distribution Statistics
router.get('/monthly', adminAuth, async (req, res) => {
    try {
        const { year, month } = req.query;
        
        let start, end;
        if (year && month) {
            start = new Date(parseInt(year), parseInt(month) - 1, 1);
            end = new Date(parseInt(year), parseInt(month), 1);
        } else {
            // Default to current month
            const now = new Date();
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        }
        
        const users = await User.find({
            role: 'user',
            createdAt: { $lte: end }
        }).populate('referredBy', 'name email referralCode');
        
        const levels = await Level.find({ userId: { $in: users.map(u => u._id) } });
        
        let monthlyStats = {
            year: start.getFullYear(),
            month: start.getMonth() + 1,
            startDate: start,
            endDate: end,
            totalUsers: users.length,
            newUsers: 0,
            totalDailyIncome: 0,
            totalLevelIncome: 0,
            totalCharacterLevelIncome: 0,
            totalDigitLevelIncome: 0,
            averageIncomePerUser: 0,
            weeklyBreakdown: [],
            topEarners: []
        };
        
        const userIncomes = [];
        
        // Calculate weekly breakdown for the month
        let currentWeek = new Date(start);
        while (currentWeek < end) {
            const weekEnd = new Date(currentWeek);
            weekEnd.setDate(weekEnd.getDate() + 7);
            if (weekEnd > end) weekEnd.setTime(end.getTime());
            
            let weekIncome = 0;
            let weekLevelIncome = 0;
            let weekNewUsers = 0;
            
            for (const user of users) {
                const userLevel = levels.find(l => l.userId.toString() === user._id.toString());
                
                // Count new users for this week
                if (user.createdAt >= currentWeek && user.createdAt < weekEnd) {
                    weekNewUsers++;
                    monthlyStats.newUsers++;
                }
                
                // Calculate incomes
                const dailyIncome = user.normalWallet.balance * 0.005;
                let characterLevelIncome = 0;
                let digitLevelIncome = 0;
                
                if (userLevel) {
                    if (userLevel.characterLevel.current && user.referredBy) {
                        const parentUser = users.find(u => u._id.toString() === user.referredBy.toString());
                        if (parentUser) {
                            const percentage = userLevel.characterLevel.percentages[userLevel.characterLevel.current];
                            characterLevelIncome = (parentUser.normalWallet.balance * percentage) / 100;
                        }
                    }
                    
                    if (userLevel.digitLevel.current) {
                        const percentage = userLevel.digitLevel.percentages[userLevel.digitLevel.current];
                        digitLevelIncome = (user.normalWallet.balance * percentage) / 100;
                    }
                }
                
                const totalIncome = dailyIncome + characterLevelIncome + digitLevelIncome;
                
                weekIncome += dailyIncome;
                weekLevelIncome += characterLevelIncome + digitLevelIncome;
                
                // Accumulate for total month
                monthlyStats.totalDailyIncome += dailyIncome;
                monthlyStats.totalCharacterLevelIncome += characterLevelIncome;
                monthlyStats.totalDigitLevelIncome += digitLevelIncome;
                monthlyStats.totalLevelIncome += characterLevelIncome + digitLevelIncome;
                
                userIncomes.push({
                    userId: user._id,
                    name: user.name,
                    email: user.email,
                    totalIncome: totalIncome,
                    dailyIncome: dailyIncome,
                    characterLevelIncome: characterLevelIncome,
                    digitLevelIncome: digitLevelIncome
                });
            }
            
            monthlyStats.weeklyBreakdown.push({
                weekStart: new Date(currentWeek),
                weekEnd: new Date(weekEnd),
                dailyIncome: weekIncome,
                levelIncome: weekLevelIncome,
                totalIncome: weekIncome + weekLevelIncome,
                newUsers: weekNewUsers
            });
            
            currentWeek.setDate(currentWeek.getDate() + 7);
        }
        
        // Calculate average income
        monthlyStats.averageIncomePerUser = monthlyStats.totalDailyIncome / monthlyStats.totalUsers;
        
        // Get top earners
        monthlyStats.topEarners = userIncomes
            .sort((a, b) => b.totalIncome - a.totalIncome)
            .slice(0, 10);
        
        res.json({
            success: true,
            data: monthlyStats
        });
    } catch (error) {
        console.error('Error getting monthly distribution:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting monthly distribution',
            error: error.message
        });
    }
});

// Get User Distribution Details
router.get('/user/:userId', adminAuth, async (req, res) => {
    try {
        const { userId } = req.params;
        const { startDate, endDate } = req.query;
        
        const user = await User.findById(userId)
            .populate('referredBy', 'name email referralCode');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        const level = await Level.findOne({ userId });
        
        // Parse date filters
        let dateFilter = {};
        if (startDate && endDate) {
            dateFilter = {
                date: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            };
        }
        
        // Calculate user's income breakdown
        const dailyIncome = user.normalWallet.balance * 0.005;
        let characterLevelIncome = 0;
        let digitLevelIncome = 0;
        
        if (level) {
            if (level.characterLevel.current && user.referredBy) {
                const parentUser = await User.findById(user.referredBy);
                if (parentUser) {
                    const percentage = level.characterLevel.percentages[level.characterLevel.current];
                    characterLevelIncome = (parentUser.normalWallet.balance * percentage) / 100;
                }
            }
            
            if (level.digitLevel.current) {
                const percentage = level.digitLevel.percentages[level.digitLevel.current];
                digitLevelIncome = (user.normalWallet.balance * percentage) / 100;
            }
        }
        
        // Calculate transaction history
        const normalWalletTransactions = user.normalWallet.transactions
            .filter(t => !dateFilter.date || (t.date >= dateFilter.date.$gte && t.date <= dateFilter.date.$lte))
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        const investmentWalletTransactions = user.investmentWallet.transactions
            .filter(t => !dateFilter.date || (t.date >= dateFilter.date.$gte && t.date <= dateFilter.date.$lte))
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        const userDistribution = {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                referralCode: user.referralCode,
                referredBy: user.referredBy ? {
                    id: user.referredBy._id,
                    name: user.referredBy.name,
                    email: user.referredBy.email
                } : null,
                joinedDate: user.createdAt,
                lastActive: user.updatedAt
            },
            wallets: {
                normalWallet: {
                    balance: user.normalWallet.balance,
                    transactions: normalWalletTransactions
                },
                investmentWallet: {
                    balance: user.investmentWallet.balance,
                    transactions: investmentWalletTransactions
                }
            },
            income: {
                dailyIncome: dailyIncome,
                characterLevelIncome: characterLevelIncome,
                digitLevelIncome: digitLevelIncome,
                totalLevelIncome: characterLevelIncome + digitLevelIncome,
                totalIncome: dailyIncome + characterLevelIncome + digitLevelIncome
            },
            levels: {
                characterLevel: level?.characterLevel?.current || null,
                digitLevel: level?.digitLevel?.current || null,
                characterLevelEarned: level?.characterLevel?.totalEarned || 0,
                digitLevelEarned: level?.digitLevel?.totalEarned || 0
            },
            statistics: {
                totalDeposits: investmentWalletTransactions
                    .filter(t => t.type === 'deposit' && t.status === 'approved')
                    .reduce((sum, t) => sum + t.amount, 0),
                totalWithdrawals: normalWalletTransactions
                    .filter(t => t.type === 'withdrawal' && t.status === 'approved')
                    .reduce((sum, t) => sum + t.amount, 0),
                totalReferralBonus: normalWalletTransactions
                    .filter(t => t.type === 'referral_bonus' && t.status === 'approved')
                    .reduce((sum, t) => sum + t.amount, 0),
                totalDailyIncomeEarned: normalWalletTransactions
                    .filter(t => t.type === 'daily_income' && t.status === 'approved')
                    .reduce((sum, t) => sum + t.amount, 0)
            }
        };
        
        res.json({
            success: true,
            data: userDistribution
        });
    } catch (error) {
        console.error('Error getting user distribution:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting user distribution',
            error: error.message
        });
    }
});

// Get Top Earners Distribution
router.get('/top-earners', adminAuth, async (req, res) => {
    try {
        const { limit = 20, period = 'all' } = req.query;
        
        const users = await User.find({ role: 'user' })
            .populate('referredBy', 'name email referralCode');
        
        const levels = await Level.find({ userId: { $in: users.map(u => u._id) } });
        
        const userEarnings = [];
        
        for (const user of users) {
            const userLevel = levels.find(l => l.userId.toString() === user._id.toString());
            
            // Calculate incomes
            const dailyIncome = user.normalWallet.balance * 0.005;
            let characterLevelIncome = 0;
            let digitLevelIncome = 0;
            
            if (userLevel) {
                if (userLevel.characterLevel.current && user.referredBy) {
                    const parentUser = users.find(u => u._id.toString() === user.referredBy.toString());
                    if (parentUser) {
                        const percentage = userLevel.characterLevel.percentages[userLevel.characterLevel.current];
                        characterLevelIncome = (parentUser.normalWallet.balance * percentage) / 100;
                    }
                }
                
                if (userLevel.digitLevel.current) {
                    const percentage = userLevel.digitLevel.percentages[userLevel.digitLevel.current];
                    digitLevelIncome = (user.normalWallet.balance * percentage) / 100;
                }
            }
            
            const totalIncome = dailyIncome + characterLevelIncome + digitLevelIncome;
            
            userEarnings.push({
                userId: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                referralCode: user.referralCode,
                normalWalletBalance: user.normalWallet.balance,
                investmentWalletBalance: user.investmentWallet.balance,
                dailyIncome: dailyIncome,
                characterLevelIncome: characterLevelIncome,
                digitLevelIncome: digitLevelIncome,
                totalIncome: totalIncome,
                characterLevel: userLevel?.characterLevel?.current || null,
                digitLevel: userLevel?.digitLevel?.current || null,
                joinedDate: user.createdAt,
                lastActive: user.updatedAt
            });
        }
        
        // Sort by total income and get top earners
        const topEarners = userEarnings
            .sort((a, b) => b.totalIncome - a.totalIncome)
            .slice(0, parseInt(limit));
        
        res.json({
            success: true,
            data: {
                totalUsers: users.length,
                topEarners: topEarners,
                summary: {
                    totalIncome: topEarners.reduce((sum, user) => sum + user.totalIncome, 0),
                    averageIncome: topEarners.reduce((sum, user) => sum + user.totalIncome, 0) / topEarners.length,
                    highestIncome: topEarners[0]?.totalIncome || 0,
                    lowestIncome: topEarners[topEarners.length - 1]?.totalIncome || 0
                }
            }
        });
    } catch (error) {
        console.error('Error getting top earners:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting top earners',
            error: error.message
        });
    }
});

module.exports = router; 