const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { InvestmentPlan, UserInvestment } = require('../models/investment.model');
const User = require('../models/user.model');
const { auth } = require('../middleware/auth');

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'investment-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// ==================== ADMIN ROUTES ====================

// Create new investment plan (Admin only)
router.post('/admin/plans', auth, upload.single('image'), async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const { title, description, investmentRequired, dailyPercentage, durationDays, totalReturnPercentage } = req.body;

        // Validate required fields
        if (!title || !description || !investmentRequired || !dailyPercentage || !durationDays || !totalReturnPercentage) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Check if image was uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Investment plan image is required'
            });
        }

        const plan = new InvestmentPlan({
            title,
            description,
            image: req.file.filename,
            investmentRequired: parseFloat(investmentRequired),
            dailyPercentage: parseFloat(dailyPercentage),
            durationDays: parseInt(durationDays),
            totalReturnPercentage: parseFloat(totalReturnPercentage)
        });

        await plan.save();

        res.status(201).json({
            success: true,
            message: 'Investment plan created successfully',
            data: plan
        });

    } catch (error) {
        console.error('Error creating investment plan:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating investment plan',
            error: error.message
        });
    }
});

// Get all investment plans (Admin)
router.get('/admin/plans', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const plans = await InvestmentPlan.find().sort({ createdAt: -1 });

        res.json({
            success: true,
            data: plans
        });

    } catch (error) {
        console.error('Error fetching investment plans:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching investment plans',
            error: error.message
        });
    }
});

// Update investment plan (Admin)
router.put('/admin/plans/:planId', auth, upload.single('image'), async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const { planId } = req.params;
        
        // Validate planId
        if (!planId || planId === 'undefined' || planId === 'null') {
            return res.status(400).json({
                success: false,
                message: 'Invalid plan ID provided'
            });
        }

        // Validate ObjectId format
        if (!require('mongoose').Types.ObjectId.isValid(planId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid plan ID format'
            });
        }

        const updateData = { ...req.body };

        // If new image uploaded, update image field
        if (req.file) {
            updateData.image = req.file.filename;
        }

        // Convert numeric fields
        if (updateData.investmentRequired) updateData.investmentRequired = parseFloat(updateData.investmentRequired);
        if (updateData.dailyPercentage) updateData.dailyPercentage = parseFloat(updateData.dailyPercentage);
        if (updateData.durationDays) updateData.durationDays = parseInt(updateData.durationDays);
        if (updateData.totalReturnPercentage) updateData.totalReturnPercentage = parseFloat(updateData.totalReturnPercentage);

        const plan = await InvestmentPlan.findByIdAndUpdate(
            planId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Investment plan not found'
            });
        }

        res.json({
            success: true,
            message: 'Investment plan updated successfully',
            data: plan
        });

    } catch (error) {
        console.error('Error updating investment plan:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating investment plan',
            error: error.message
        });
    }
});

// Toggle investment plan status (Admin)
router.patch('/admin/plans/:planId/toggle', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const { planId } = req.params;
        
        // Validate planId
        if (!planId || planId === 'undefined' || planId === 'null') {
            return res.status(400).json({
                success: false,
                message: 'Invalid plan ID provided'
            });
        }

        // Validate ObjectId format
        if (!require('mongoose').Types.ObjectId.isValid(planId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid plan ID format'
            });
        }

        const plan = await InvestmentPlan.findById(planId);

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Investment plan not found'
            });
        }

        plan.isActive = !plan.isActive;
        await plan.save();

        res.json({
            success: true,
            message: `Investment plan ${plan.isActive ? 'activated' : 'deactivated'} successfully`,
            data: plan
        });

    } catch (error) {
        console.error('Error toggling investment plan:', error);
        res.status(500).json({
            success: false,
            message: 'Error toggling investment plan',
            error: error.message
        });
    }
});

// Delete investment plan (Admin)
router.delete('/admin/plans/:planId', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const { planId } = req.params;
        
        // Validate planId
        if (!planId || planId === 'undefined' || planId === 'null') {
            return res.status(400).json({
                success: false,
                message: 'Invalid plan ID provided'
            });
        }

        // Validate ObjectId format
        if (!require('mongoose').Types.ObjectId.isValid(planId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid plan ID format'
            });
        }

        const plan = await InvestmentPlan.findByIdAndDelete(planId);

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Investment plan not found'
            });
        }

        res.json({
            success: true,
            message: 'Investment plan deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting investment plan:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting investment plan',
            error: error.message
        });
    }
});

// Get all user investments (Admin)
router.get('/admin/investments', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const investments = await UserInvestment.find()
            .populate('userId', 'name email phone')
            .populate('planId', 'title')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: investments
        });

    } catch (error) {
        console.error('Error fetching user investments:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user investments',
            error: error.message
        });
    }
});

// ==================== USER ROUTES ====================

// Get all active investment plans (Users)
router.get('/plans', auth, async (req, res) => {
    try {
        const plans = await InvestmentPlan.find({ isActive: true }).sort({ createdAt: -1 });

        res.json({
            success: true,
            data: plans
        });

    } catch (error) {
        console.error('Error fetching investment plans:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching investment plans',
            error: error.message
        });
    }
});

// Purchase investment plan (User)
router.post('/purchase', auth, async (req, res) => {
    try {
        const { planId, investmentAmount } = req.body;

        if (!planId || !investmentAmount) {
            return res.status(400).json({
                success: false,
                message: 'Plan ID and investment amount are required'
            });
        }

        // Validate planId format
        if (!require('mongoose').Types.ObjectId.isValid(planId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid plan ID format'
            });
        }

        // Find the investment plan
        const plan = await InvestmentPlan.findById(planId);
        if (!plan || !plan.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Investment plan not found or inactive'
            });
        }

        // Check if user has sufficient balance in investment wallet
        const user = await User.findById(req.user.id);
        if (user.investmentWallet.balance < investmentAmount) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient balance in investment wallet',
                currentBalance: user.investmentWallet.balance,
                requiredAmount: investmentAmount
            });
        }

        // Calculate end date
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + plan.durationDays);

        // Create user investment
        const userInvestment = new UserInvestment({
            userId: req.user.id,
            planId: planId,
            investmentAmount: parseFloat(investmentAmount),
            dailyEarning: plan.dailyPercentage,
            endDate: endDate
        });

        await userInvestment.save();

        // Deduct amount from user's investment wallet
        user.investmentWallet.balance -= investmentAmount;
        user.investmentWallet.transactions.push({
            type: 'withdrawal',
            amount: -investmentAmount,
            description: `Investment in ${plan.title}`,
            status: 'approved'
        });

        await user.save();

        res.status(201).json({
            success: true,
            message: 'Investment purchased successfully',
            data: {
                investment: userInvestment,
                plan: plan,
                remainingBalance: user.investmentWallet.balance
            }
        });

    } catch (error) {
        console.error('Error purchasing investment:', error);
        res.status(500).json({
            success: false,
            message: 'Error purchasing investment',
            error: error.message
        });
    }
});

// Get user's investments
router.get('/my-investments', auth, async (req, res) => {
    try {
        const investments = await UserInvestment.find({ userId: req.user.id })
            .populate('planId')
            .sort({ createdAt: -1 });

        // Calculate remaining days and add daily earnings for active investments
        const investmentsWithDetails = investments.map(investment => {
            const investmentObj = investment.toObject();
            
            // Add daily earning if investment is active
            if (!investment.isCompleted) {
                investment.addDailyEarning();
            }
            
            investmentObj.remainingDays = investment.remainingDays;
            investmentObj.totalReturnAmount = investment.totalReturnAmount;
            
            return investmentObj;
        });

        res.json({
            success: true,
            data: investmentsWithDetails
        });

    } catch (error) {
        console.error('Error fetching user investments:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user investments',
            error: error.message
        });
    }
});

// Withdraw completed investment
router.post('/withdraw/:investmentId', auth, async (req, res) => {
    try {
        const { investmentId } = req.params;

        const investment = await UserInvestment.findById(investmentId)
            .populate('planId');

        if (!investment) {
            return res.status(404).json({
                success: false,
                message: 'Investment not found'
            });
        }

        // Check if investment belongs to user
        if (investment.userId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Check if investment is completed
        if (!investment.isCompleted) {
            return res.status(400).json({
                success: false,
                message: 'Investment is not yet completed',
                remainingDays: investment.remainingDays
            });
        }

        // Check if already withdrawn
        if (investment.isWithdrawn) {
            return res.status(400).json({
                success: false,
                message: 'Investment has already been withdrawn'
            });
        }

        // Calculate total return amount
        const totalReturnAmount = investment.investmentAmount + investment.totalEarned;

        // Update user's normal wallet
        const user = await User.findById(req.user.id);
        user.normalWallet.balance += totalReturnAmount;
        user.normalWallet.transactions.push({
            type: 'deposit',
            amount: totalReturnAmount,
            description: `Investment withdrawal from ${investment.planId.title}`,
            status: 'approved'
        });

        await user.save();

        // Mark investment as withdrawn
        investment.isWithdrawn = true;
        investment.withdrawnAt = new Date();
        await investment.save();

        res.json({
            success: true,
            message: 'Investment withdrawn successfully',
            data: {
                withdrawnAmount: totalReturnAmount,
                investmentAmount: investment.investmentAmount,
                totalEarned: investment.totalEarned,
                newBalance: user.normalWallet.balance
            }
        });

    } catch (error) {
        console.error('Error withdrawing investment:', error);
        res.status(500).json({
            success: false,
            message: 'Error withdrawing investment',
            error: error.message
        });
    }
});

// Get investment details
router.get('/investment/:investmentId', auth, async (req, res) => {
    try {
        const { investmentId } = req.params;

        const investment = await UserInvestment.findById(investmentId)
            .populate('planId');

        if (!investment) {
            return res.status(404).json({
                success: false,
                message: 'Investment not found'
            });
        }

        // Check if investment belongs to user
        if (investment.userId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Add daily earning if investment is active
        if (!investment.isCompleted) {
            investment.addDailyEarning();
        }

        const investmentData = investment.toObject();
        investmentData.remainingDays = investment.remainingDays;
        investmentData.totalReturnAmount = investment.totalReturnAmount;

        res.json({
            success: true,
            data: investmentData
        });

    } catch (error) {
        console.error('Error fetching investment details:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching investment details',
            error: error.message
        });
    }
});

module.exports = router; 