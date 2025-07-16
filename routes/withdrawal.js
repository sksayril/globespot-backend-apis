const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../models/user.model');
const WithdrawalRequest = require('../models/withdrawal.model');

// User: Request withdrawal from normal wallet
router.post('/request', auth, async (req, res) => {
    try {
        const { amount, walletAddress } = req.body;
        const userId = req.user.id;

        // Validate input
        if (!amount || !walletAddress) {
            return res.status(400).json({
                success: false,
                message: 'Amount and wallet address are required'
            });
        }

        if (amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Amount must be greater than 0'
            });
        }

        // Get user with current wallet balance
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user has sufficient balance
        if (user.normalWallet.balance < amount) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient balance in normal wallet',
                availableBalance: user.normalWallet.balance
            });
        }

        // Check if user is blocked
        if (user.isBlocked) {
            return res.status(403).json({
                success: false,
                message: 'Account is blocked. Cannot request withdrawal.'
            });
        }

        // Create withdrawal request
        const withdrawalRequest = new WithdrawalRequest({
            userId: userId,
            userEmail: user.email,
            userName: user.name,
            walletAddress: walletAddress,
            amount: amount,
            walletType: 'normal',
            status: 'pending'
        });

        await withdrawalRequest.save();

        // Add transaction to user's normal wallet
        user.normalWallet.transactions.push({
            type: 'withdrawal',
            amount: -amount,
            description: `Withdrawal request - ${walletAddress}`,
            status: 'pending'
        });

        // Deduct amount from wallet balance
        user.normalWallet.balance -= amount;
        await user.save();

        res.status(201).json({
            success: true,
            message: 'Withdrawal request submitted successfully',
            data: {
                requestId: withdrawalRequest._id,
                amount: amount,
                walletAddress: walletAddress,
                status: 'pending',
                createdAt: withdrawalRequest.createdAt
            }
        });

    } catch (error) {
        console.error('Withdrawal request error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// User: Get their withdrawal requests
router.get('/my-requests', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status; // optional filter

        let query = { userId: userId };
        if (status) {
            query.status = status;
        }

        const requests = await WithdrawalRequest.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await WithdrawalRequest.countDocuments(query);

        res.json({
            success: true,
            data: {
                requests: requests,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalRequests: total,
                    hasNext: page * limit < total,
                    hasPrev: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Get withdrawal requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Admin: Get all withdrawal requests
router.get('/all-requests', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status; // optional filter

        let query = {};
        if (status) {
            query.status = status;
        }

        const requests = await WithdrawalRequest.find(query)
            .populate('userId', 'name email phone')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await WithdrawalRequest.countDocuments(query);

        res.json({
            success: true,
            data: {
                requests: requests,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalRequests: total,
                    hasNext: page * limit < total,
                    hasPrev: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Get all withdrawal requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Admin: Approve withdrawal request
router.post('/approve/:requestId', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const { requestId } = req.params;
        const { transactionHash, notes } = req.body;

        const withdrawalRequest = await WithdrawalRequest.findById(requestId);
        if (!withdrawalRequest) {
            return res.status(404).json({
                success: false,
                message: 'Withdrawal request not found'
            });
        }

        if (withdrawalRequest.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Request is already processed'
            });
        }

        // Update withdrawal request
        withdrawalRequest.status = 'approved';
        withdrawalRequest.adminId = req.user.id;
        withdrawalRequest.adminName = req.user.name;
        withdrawalRequest.approvedAt = new Date();
        withdrawalRequest.transactionHash = transactionHash || null;
        withdrawalRequest.notes = notes || null;

        await withdrawalRequest.save();

        // Update user's wallet transaction status
        const user = await User.findById(withdrawalRequest.userId);
        if (user) {
            const transaction = user.normalWallet.transactions.find(
                t => t.type === 'withdrawal' && 
                     t.amount === -withdrawalRequest.amount &&
                     t.status === 'pending'
            );
            
            if (transaction) {
                transaction.status = 'approved';
                transaction.description = `Withdrawal approved - ${withdrawalRequest.walletAddress}`;
            }
            
            await user.save();
        }

        res.json({
            success: true,
            message: 'Withdrawal request approved successfully',
            data: {
                requestId: withdrawalRequest._id,
                status: 'approved',
                approvedAt: withdrawalRequest.approvedAt,
                adminName: withdrawalRequest.adminName
            }
        });

    } catch (error) {
        console.error('Approve withdrawal error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Admin: Reject withdrawal request
router.post('/reject/:requestId', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const { requestId } = req.params;
        const { rejectionReason } = req.body;

        if (!rejectionReason) {
            return res.status(400).json({
                success: false,
                message: 'Rejection reason is required'
            });
        }

        const withdrawalRequest = await WithdrawalRequest.findById(requestId);
        if (!withdrawalRequest) {
            return res.status(404).json({
                success: false,
                message: 'Withdrawal request not found'
            });
        }

        if (withdrawalRequest.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Request is already processed'
            });
        }

        // Update withdrawal request
        withdrawalRequest.status = 'rejected';
        withdrawalRequest.adminId = req.user.id;
        withdrawalRequest.adminName = req.user.name;
        withdrawalRequest.rejectedAt = new Date();
        withdrawalRequest.rejectionReason = rejectionReason;

        await withdrawalRequest.save();

        // Refund amount to user's wallet
        const user = await User.findById(withdrawalRequest.userId);
        if (user) {
            // Update wallet balance
            user.normalWallet.balance += withdrawalRequest.amount;

            // Update transaction status
            const transaction = user.normalWallet.transactions.find(
                t => t.type === 'withdrawal' && 
                     t.amount === -withdrawalRequest.amount &&
                     t.status === 'pending'
            );
            
            if (transaction) {
                transaction.status = 'rejected';
                transaction.description = `Withdrawal rejected - ${rejectionReason}`;
            }
            
            await user.save();
        }

        res.json({
            success: true,
            message: 'Withdrawal request rejected successfully',
            data: {
                requestId: withdrawalRequest._id,
                status: 'rejected',
                rejectedAt: withdrawalRequest.rejectedAt,
                rejectionReason: withdrawalRequest.rejectionReason,
                adminName: withdrawalRequest.adminName
            }
        });

    } catch (error) {
        console.error('Reject withdrawal error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Admin: Get withdrawal statistics
router.get('/statistics', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const totalRequests = await WithdrawalRequest.countDocuments();
        const pendingRequests = await WithdrawalRequest.countDocuments({ status: 'pending' });
        const approvedRequests = await WithdrawalRequest.countDocuments({ status: 'approved' });
        const rejectedRequests = await WithdrawalRequest.countDocuments({ status: 'rejected' });

        const totalAmount = await WithdrawalRequest.aggregate([
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const pendingAmount = await WithdrawalRequest.aggregate([
            { $match: { status: 'pending' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const approvedAmount = await WithdrawalRequest.aggregate([
            { $match: { status: 'approved' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        res.json({
            success: true,
            data: {
                totalRequests: totalRequests,
                pendingRequests: pendingRequests,
                approvedRequests: approvedRequests,
                rejectedRequests: rejectedRequests,
                totalAmount: totalAmount[0]?.total || 0,
                pendingAmount: pendingAmount[0]?.total || 0,
                approvedAmount: approvedAmount[0]?.total || 0
            }
        });

    } catch (error) {
        console.error('Get withdrawal statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router; 