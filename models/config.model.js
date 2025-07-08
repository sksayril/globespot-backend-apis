const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

configSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Config', configSchema); 