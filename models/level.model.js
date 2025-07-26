const mongoose = require('mongoose');

const levelSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    
    // Character Level System
    characterLevel: {
        current: {
            type: String,
            default: null,
            required: false
        },
        criteria: {
            A: { type: Number, default: 5 },      // 5 direct members required
            B: { type: Number, default: 10 },     // 10 direct members required
            C: { type: Number, default: 20 },     // 20 direct members required
            D: { type: Number, default: 40 },     // 40 direct members required
            E: { type: Number, default: 80 }      // 80 direct members required
        },
        percentages: {
            A: { type: Number, default: 0.05 },      // 0.05% of total direct members balance
            B: { type: Number, default: 0.025 },     // 0.025% of total direct members balance
            C: { type: Number, default: 0.0125 },    // 0.0125% of total direct members balance
            D: { type: Number, default: 0.00625 },   // 0.00625% of total direct members balance
            E: { type: Number, default: 0.003125 }   // 0.003125% of total direct members balance
        },
        lastCalculated: {
            type: Date,
            default: null
        },
        totalEarned: {
            type: Number,
            default: 0
        }
    },
    
    // Digit Level System
    digitLevel: {
        current: {
            type: String,
            default: null,
            required: false
        },
        criteria: {
            Lvl1: {
                directMembers: { type: Number, default: 5 },
                memberWalletMin: { type: Number, default: 50 },
                selfWalletMin: { type: Number, default: 200 }
            },
            Lvl2: {
                directMembers: { type: Number, default: 10 },
                memberWalletMin: { type: Number, default: 50 },
                selfWalletMin: { type: Number, default: 500 }
            },
            Lvl3: {
                directMembers: { type: Number, default: 20 },
                memberWalletMin: { type: Number, default: 50 },
                selfWalletMin: { type: Number, default: 1100 }
            },
            Lvl4: {
                directMembers: { type: Number, default: 40 },
                memberWalletMin: { type: Number, default: 50 },
                selfWalletMin: { type: Number, default: 2500 }
            },
            Lvl5: {
                directMembers: { type: Number, default: 80 },
                memberWalletMin: { type: Number, default: 50 },
                selfWalletMin: { type: Number, default: 10000 }
            }
        },
        percentages: {
            Lvl1: { type: Number, default: 0.35 },  // 0.35%
            Lvl2: { type: Number, default: 0.70 },  // 0.70%
            Lvl3: { type: Number, default: 1.40 },  // 1.40%
            Lvl4: { type: Number, default: 2.50 },  // 2.50%
            Lvl5: { type: Number, default: 4.00 }   // 4.00%
        },
        lastCalculated: {
            type: Date,
            default: null
        },
        totalEarned: {
            type: Number,
            default: 0
        },
        directMembers: [{
            memberId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            joinedAt: {
                type: Date,
                default: Date.now
            },
            walletBalance: {
                type: Number,
                default: 0
            }
        }]
    },
    
    // Level Calculation Status
    lastLevelCheck: {
        type: Date,
        default: Date.now
    },
    
    // Daily Income Tracking
    dailyIncome: {
        characterLevel: {
            type: Number,
            default: 0
        },
        digitLevel: {
            type: Number,
            default: 0
        },
        lastClaimed: {
            type: Date,
            default: null
        }
    }
}, {
    timestamps: true
});

// Indexes for better performance
levelSchema.index({ userId: 1 });
levelSchema.index({ 'characterLevel.current': 1 });
levelSchema.index({ 'digitLevel.current': 1 });

module.exports = mongoose.model('Level', levelSchema); 