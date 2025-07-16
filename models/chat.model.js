const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    senderType: {
        type: String,
        enum: ['user', 'admin'],
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'file'],
        default: 'text'
    },
    fileUrl: {
        type: String,
        default: null
    },
    isRead: {
        type: Boolean,
        default: false
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const chatSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['open', 'in_progress', 'resolved', 'closed'],
        default: 'open'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    category: {
        type: String,
        enum: ['general', 'technical', 'payment', 'investment', 'withdrawal', 'account', 'other'],
        default: 'general'
    },
    messages: [messageSchema],
    lastMessage: {
        type: Date,
        default: Date.now
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

// Update timestamp on save
chatSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Method to add message to chat
chatSchema.methods.addMessage = function(sender, senderType, content, messageType = 'text', fileUrl = null) {
    const message = {
        sender: sender,
        senderType: senderType,
        content: content,
        messageType: messageType,
        fileUrl: fileUrl,
        timestamp: Date.now()
    };
    
    this.messages.push(message);
    this.lastMessage = Date.now();
    return this.save();
};

// Method to mark messages as read
chatSchema.methods.markAsRead = function(userId) {
    this.messages.forEach(message => {
        if (message.sender.toString() !== userId.toString() && !message.isRead) {
            message.isRead = true;
        }
    });
    return this.save();
};

module.exports = mongoose.model('Chat', chatSchema); 