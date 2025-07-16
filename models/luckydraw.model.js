const mongoose = require('mongoose');

const luckyDrawSchema = new mongoose.Schema({
    // Lucky Draw Details
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    maxParticipants: {
        type: Number,
        required: true,
        min: 1
    },
    currentParticipants: {
        type: Number,
        default: 0
    },
    
    // Status and Timing
    status: {
        type: String,
        enum: ['active', 'completed', 'cancelled'],
        default: 'active'
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    drawDate: {
        type: Date,
        required: true
    },
    
    // Participants
    participants: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        userName: {
            type: String,
            required: true
        },
        userEmail: {
            type: String,
            required: true
        },
        joinedAt: {
            type: Date,
            default: Date.now
        },
        isWinner: {
            type: Boolean,
            default: false
        },
        hasClaimed: {
            type: Boolean,
            default: false
        },
        claimedAt: {
            type: Date,
            default: null
        }
    }],
    
    // Winners
    winners: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        userName: {
            type: String,
            required: true
        },
        userEmail: {
            type: String,
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        hasClaimed: {
            type: Boolean,
            default: false
        },
        claimedAt: {
            type: Date,
            default: null
        }
    }],
    
    // Admin Details
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
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

// Pre-save middleware to update timestamps
luckyDrawSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Method to check if lucky draw is active
luckyDrawSchema.methods.isActive = function() {
    const now = new Date();
    return this.status === 'active' && 
           now >= this.startDate && 
           now <= this.endDate &&
           this.currentParticipants < this.maxParticipants;
};

// Method to check if user can join
luckyDrawSchema.methods.canUserJoin = function(userId) {
    if (!this.isActive()) {
        return { canJoin: false, reason: 'Lucky draw is not active' };
    }
    
    if (this.currentParticipants >= this.maxParticipants) {
        return { canJoin: false, reason: 'Maximum participants reached' };
    }
    
    const isAlreadyParticipant = this.participants.some(p => p.userId.toString() === userId.toString());
    if (isAlreadyParticipant) {
        return { canJoin: false, reason: 'User already participated' };
    }
    
    return { canJoin: true, reason: 'User can join' };
};

// Method to add participant
luckyDrawSchema.methods.addParticipant = function(user) {
    const canJoin = this.canUserJoin(user._id);
    if (!canJoin.canJoin) {
        throw new Error(canJoin.reason);
    }
    
    this.participants.push({
        userId: user._id,
        userName: user.name,
        userEmail: user.email
    });
    
    this.currentParticipants++;
    return this.save();
};

// Method to check if user is winner
luckyDrawSchema.methods.isUserWinner = function(userId) {
    return this.winners.some(w => w.userId.toString() === userId.toString());
};

// Method to check if user can claim
luckyDrawSchema.methods.canUserClaim = function(userId) {
    const winner = this.winners.find(w => w.userId.toString() === userId.toString());
    if (!winner) {
        return { canClaim: false, reason: 'User is not a winner' };
    }
    
    if (winner.hasClaimed) {
        return { canClaim: false, reason: 'Prize already claimed' };
    }
    
    return { canClaim: true, reason: 'User can claim prize' };
};

// Method to mark prize as claimed
luckyDrawSchema.methods.claimPrize = function(userId) {
    const winner = this.winners.find(w => w.userId.toString() === userId.toString());
    if (!winner) {
        throw new Error('User is not a winner');
    }
    
    if (winner.hasClaimed) {
        throw new Error('Prize already claimed');
    }
    
    winner.hasClaimed = true;
    winner.claimedAt = new Date();
    
    // Also update participant record
    const participant = this.participants.find(p => p.userId.toString() === userId.toString());
    if (participant) {
        participant.hasClaimed = true;
        participant.claimedAt = new Date();
    }
    
    return this.save();
};

const LuckyDraw = mongoose.model('LuckyDraw', luckyDrawSchema);

module.exports = LuckyDraw; 