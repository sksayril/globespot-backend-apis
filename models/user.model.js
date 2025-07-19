const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    // Basic Information
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        required: true,
        unique: true
    },
    
    // Password Management
    password: {
        type: String,
        required: true
    },
    originalPassword: {
        type: String,
        required: true
    },
    
    // Role and Status
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    
    // Referral System
    referralCode: {
        type: String,
        unique: true,
        required: true
    },
    referredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    referralLevel: {
        type: Number,
        default: 0
    },
    
    // Wallets
    investmentWallet: {
        balance: {
            type: Number,
            default: 0
        },
        transactions: [{
            type: {
                type: String,
                enum: ['deposit', 'withdrawal', 'transfer', 'transfer_to_user', 'transfer_from_user', 'referral_bonus', 'commission', 'level_income', 'team_income']
            },
            amount: Number,
            description: String,
            date: {
                type: Date,
                default: Date.now
            },
            status: {
                type: String,
                enum: ['pending', 'approved', 'rejected'],
                default: 'pending'
            }
        }]
    },
    normalWallet: {
        balance: {
            type: Number,
            default: 0
        },
        transactions: [{
            type: {
                type: String,
                enum: ['deposit', 'withdrawal', 'transfer', 'transfer_to_user', 'transfer_from_user', 'referral_bonus', 'daily_income', 'level_income', 'team_income']
            },
            amount: Number,
            description: String,
            date: {
                type: Date,
                default: Date.now
            },
            status: {
                type: String,
                enum: ['pending', 'approved', 'rejected'],
                default: 'pending'
            }
        }]
    },
    
    // Daily Income Tracking
    dailyIncome: {
        lastClaimed: {
            type: Date,
            default: null
        },
        totalEarned: {
            type: Number,
            default: 0
        },
        todayEarned: {
            type: Number,
            default: 0
        }
    },
    
    // First Deposit Bonus Tracking
    firstDepositBonus: {
        hasReceived: {
            type: Boolean,
            default: false
        },
        amount: {
            type: Number,
            default: 0
        },
        percentage: {
            type: Number,
            default: 10 // Default 10% bonus
        },
        receivedAt: {
            type: Date,
            default: null
        }
    },
    
    // Profile Information
    profileImage: {
        type: String,
        default: null
    },
    address: {
        street: String,
        city: String,
        state: String,
        country: String,
        zipCode: String
    },
    
    // Wallet Information
    walletInfo: {
        address: {
            type: String,
            default: null
        },
        qrCode: {
            type: String,
            default: null
        },
        isVerified: {
            type: Boolean,
            default: false
        },
        lastUpdated: {
            type: Date,
            default: null
        }
    },
    
    // Wallet Change Requests
    walletChangeRequests: [{
        requestId: {
            type: String,
            required: true
        },
        oldAddress: String,
        newAddress: {
            type: String,
            required: true
        },
        oldQrCode: String,
        newQrCode: {
            type: String,
            required: true
        },
        reason: String,
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        },
        adminNotes: String,
        requestedAt: {
            type: Date,
            default: Date.now
        },
        processedAt: {
            type: Date,
            default: null
        },
        processedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Method to generate referral code
userSchema.methods.generateReferralCode = function() {
    return this.name.substring(0, 3).toUpperCase() + 
           Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Update timestamp on save
userSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('User', userSchema);