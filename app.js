require("dotenv").config()
require("./utilities/database")
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const logger = require('morgan');

const app = express();

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var adminRouter = require('./routes/admin');
var levelsRouter = require('./routes/levels');
var contentRouter = require('./routes/content');
var investmentRouter = require('./routes/investment');
var withdrawalRouter = require('./routes/withdrawal');
var adminDashboardRouter = require('./routes/admin-dashboard');
var adminRevenueRouter = require('./routes/admin-revenue');
var adminDistributionRouter = require('./routes/admin-distribution');
var adminLuckyDrawRouter = require('./routes/admin-luckydraw');
var luckyDrawRouter = require('./routes/luckydraw');
var chatRouter = require('./routes/chat');
var adminChatRouter = require('./routes/admin-chat');
var notificationRouter = require('./routes/notification');
var adminNotificationRouter = require('./routes/admin-notification');

// CORS configuration
app.use(cors());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/admin', adminRouter);
app.use('/levels', levelsRouter);
app.use('/content', contentRouter);
app.use('/investment', investmentRouter);
app.use('/withdrawal', withdrawalRouter);
app.use('/admin-dashboard', adminDashboardRouter);
app.use('/admin-revenue', adminRevenueRouter);
app.use('/admin-distribution', adminDistributionRouter);
app.use('/admin-luckydraw', adminLuckyDrawRouter);
app.use('/luckydraw', luckyDrawRouter);
app.use('/chat', chatRouter);
app.use('/admin-chat', adminChatRouter);
app.use('/notification', notificationRouter);
app.use('/admin-notification', adminNotificationRouter);

// Error handling middleware
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size is 5MB.'
            });
        }
    }
    
    // Handle CORS errors
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({
            success: false,
            message: 'CORS: Origin not allowed'
        });
    }
    
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found.'
    });
});

module.exports = app;
