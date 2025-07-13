const mongoose = require('mongoose');

// Investment Plan Schema (created by admin)
const investmentPlanSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    investmentRequired: {
        type: Number,
        required: true,
        min: 0
    },
    dailyPercentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    durationDays: {
        type: Number,
        required: true,
        min: 1
    },
    isActive: {
        type: Boolean,
        default: true
    },
    totalReturnPercentage: {
        type: Number,
        required: true,
        min: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// User Investment Schema (when user purchases a plan)
const userInvestmentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    planId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InvestmentPlan',
        required: true
    },
    investmentAmount: {
        type: Number,
        required: true,
        min: 0
    },
    dailyEarning: {
        type: Number,
        required: true,
        min: 0
    },
    totalEarned: {
        type: Number,
        default: 0
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date,
        required: true
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    isWithdrawn: {
        type: Boolean,
        default: false
    },
    withdrawnAt: {
        type: Date,
        default: null
    },
    dailyEarnings: [{
        date: {
            type: Date,
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        isClaimed: {
            type: Boolean,
            default: false
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Pre-save middleware to update timestamps
investmentPlanSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

userInvestmentSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Virtual for remaining days
userInvestmentSchema.virtual('remainingDays').get(function() {
    if (this.isCompleted) return 0;
    const now = new Date();
    const end = new Date(this.endDate);
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
});

// Virtual for total return amount
userInvestmentSchema.virtual('totalReturnAmount').get(function() {
    return this.investmentAmount + this.totalEarned;
});

// Method to calculate daily earnings
userInvestmentSchema.methods.calculateDailyEarning = function() {
    return (this.investmentAmount * this.dailyEarning) / 100;
};

// Method to check if investment is completed
userInvestmentSchema.methods.checkCompletion = function() {
    const now = new Date();
    if (now >= this.endDate && !this.isCompleted) {
        this.isCompleted = true;
        return true;
    }
    return false;
};

// Method to add daily earning
userInvestmentSchema.methods.addDailyEarning = function() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if already added for today
    const existingEarning = this.dailyEarnings.find(earning => {
        const earningDate = new Date(earning.date);
        earningDate.setHours(0, 0, 0, 0);
        return earningDate.getTime() === today.getTime();
    });
    
    if (!existingEarning && !this.isCompleted) {
        const dailyAmount = this.calculateDailyEarning();
        this.dailyEarnings.push({
            date: today,
            amount: dailyAmount,
            isClaimed: false
        });
        this.totalEarned += dailyAmount;
        return dailyAmount;
    }
    
    return 0;
};

const InvestmentPlan = mongoose.model('InvestmentPlan', investmentPlanSchema);
const UserInvestment = mongoose.model('UserInvestment', userInvestmentSchema);

module.exports = {
    InvestmentPlan,
    UserInvestment
}; 