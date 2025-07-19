const cron = require('node-cron');
const User = require('../models/user.model');
const Level = require('../models/level.model');
const LevelService = require('./levelService');

class CronService {
    constructor() {
        this.isRunning = false;
    }

    // Initialize all cron jobs
    init() {
        console.log('🚀 Initializing Cron Jobs...');
        
        // Daily level update and income calculation at 12:00 AM (midnight)
        this.scheduleDailyLevelUpdate();
        
        // Weekly level recalculation on Sunday at 1:00 AM
        this.scheduleWeeklyLevelRecalculation();
        
        console.log('✅ Cron Jobs initialized successfully');
    }

    // Schedule daily level update and income calculation
    scheduleDailyLevelUpdate() {
        // Run at 12:00 AM (midnight) every day
        cron.schedule('0 0 * * *', async () => {
            console.log('🕛 Starting daily level update and income calculation...');
            await this.performDailyLevelUpdate();
        }, {
            scheduled: true,
            timezone: "Asia/Kolkata" // Indian timezone
        });
        
        console.log('📅 Scheduled daily level update at 12:00 AM (midnight)');
    }

    // Schedule weekly level recalculation
    scheduleWeeklyLevelRecalculation() {
        // Run every Sunday at 1:00 AM
        cron.schedule('0 1 * * 0', async () => {
            console.log('📊 Starting weekly level recalculation...');
            await this.performWeeklyLevelRecalculation();
        }, {
            scheduled: true,
            timezone: "Asia/Kolkata"
        });
        
        console.log('📅 Scheduled weekly level recalculation every Sunday at 1:00 AM');
    }

    // Perform daily level update and income calculation
    async performDailyLevelUpdate() {
        if (this.isRunning) {
            console.log('⚠️ Daily update already running, skipping...');
            return;
        }

        this.isRunning = true;
        const startTime = new Date();
        
        try {
            console.log('🔄 Starting daily level update process...');
            
            // Get all users
            const users = await User.find({ role: 'user' }).select('_id name email normalWallet referredBy');
            console.log(`📋 Found ${users.length} users to process`);
            
            let processedCount = 0;
            let updatedCount = 0;
            let errorCount = 0;
            
            for (const user of users) {
                try {
                    // Update user levels
                    const levelUpdated = await this.updateUserLevels(user._id);
                    
                    // Calculate and store daily income potential
                    const incomeCalculated = await this.calculateDailyIncome(user._id);
                    
                    if (levelUpdated || incomeCalculated) {
                        updatedCount++;
                    }
                    
                    processedCount++;
                    
                    // Log progress every 100 users
                    if (processedCount % 100 === 0) {
                        console.log(`📈 Processed ${processedCount}/${users.length} users...`);
                    }
                    
                } catch (error) {
                    console.error(`❌ Error processing user ${user._id}:`, error.message);
                    errorCount++;
                }
            }
            
            const endTime = new Date();
            const duration = (endTime - startTime) / 1000;
            
            console.log('✅ Daily level update completed!');
            console.log(`📊 Summary:`);
            console.log(`   - Total users: ${users.length}`);
            console.log(`   - Processed: ${processedCount}`);
            console.log(`   - Updated: ${updatedCount}`);
            console.log(`   - Errors: ${errorCount}`);
            console.log(`   - Duration: ${duration.toFixed(2)} seconds`);
            
        } catch (error) {
            console.error('❌ Error in daily level update:', error);
        } finally {
            this.isRunning = false;
        }
    }

    // Perform weekly level recalculation
    async performWeeklyLevelRecalculation() {
        if (this.isRunning) {
            console.log('⚠️ Weekly recalculation already running, skipping...');
            return;
        }

        this.isRunning = true;
        const startTime = new Date();
        
        try {
            console.log('🔄 Starting weekly level recalculation...');
            
            // Get all users
            const users = await User.find({ role: 'user' }).select('_id name email normalWallet referredBy');
            console.log(`📋 Found ${users.length} users to recalculate`);
            
            let processedCount = 0;
            let updatedCount = 0;
            let errorCount = 0;
            
            for (const user of users) {
                try {
                    // Force recalculation of both levels
                    const characterLevel = await LevelService.calculateCharacterLevel(user._id);
                    const digitLevel = await LevelService.calculateDigitLevel(user._id);
                    
                    // Update levels for referral chain
                    if (user.referredBy) {
                        await LevelService.updateLevelsOnNewUser(user._id, user.referredBy);
                    }
                    
                    updatedCount++;
                    processedCount++;
                    
                    // Log progress every 50 users
                    if (processedCount % 50 === 0) {
                        console.log(`📈 Recalculated ${processedCount}/${users.length} users...`);
                    }
                    
                } catch (error) {
                    console.error(`❌ Error recalculating user ${user._id}:`, error.message);
                    errorCount++;
                }
            }
            
            const endTime = new Date();
            const duration = (endTime - startTime) / 1000;
            
            console.log('✅ Weekly level recalculation completed!');
            console.log(`📊 Summary:`);
            console.log(`   - Total users: ${users.length}`);
            console.log(`   - Processed: ${processedCount}`);
            console.log(`   - Updated: ${updatedCount}`);
            console.log(`   - Errors: ${errorCount}`);
            console.log(`   - Duration: ${duration.toFixed(2)} seconds`);
            
        } catch (error) {
            console.error('❌ Error in weekly level recalculation:', error);
        } finally {
            this.isRunning = false;
        }
    }

    // Update user levels
    async updateUserLevels(userId) {
        try {
            // Get or create level record
            let level = await Level.findOne({ userId });
            if (!level) {
                level = await LevelService.initializeLevel(userId);
            }
            
            // Update character level
            const characterLevel = await LevelService.calculateCharacterLevel(userId);
            
            // Update digit level
            const digitLevel = await LevelService.calculateDigitLevel(userId);
            
            // Check if any level changed
            const characterChanged = level.characterLevel.current !== characterLevel.current;
            const digitChanged = level.digitLevel.current !== digitLevel.current;
            
            if (characterChanged || digitChanged) {
                console.log(`🔄 User ${userId}: Character ${level.characterLevel.current} → ${characterLevel.current}, Digit ${level.digitLevel.current} → ${digitLevel.current}`);
            }
            
            return characterChanged || digitChanged;
            
        } catch (error) {
            console.error(`❌ Error updating levels for user ${userId}:`, error.message);
            return false;
        }
    }

    // Calculate and store daily income potential
    async calculateDailyIncome(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) return false;
            
            let level = await Level.findOne({ userId });
            if (!level) {
                level = await LevelService.initializeLevel(userId);
            }
            
            // Calculate digit level income
            let digitLevelIncome = 0;
            if (level.digitLevel.current) {
                const userWalletBalance = user.normalWallet?.balance || 0;
                const percentage = level.digitLevel.percentages[level.digitLevel.current];
                digitLevelIncome = (userWalletBalance * percentage) / 100;
            }
            
            // Calculate character level income
            let characterLevelIncome = 0;
            const directReferrals = await User.find({ referredBy: userId })
                .select('normalWallet.balance');
            
            if (level.characterLevel.current && directReferrals.length > 0) {
                const totalDirectReferralBalance = directReferrals.reduce((sum, ref) => sum + (ref.normalWallet?.balance || 0), 0);
                const percentage = level.characterLevel.percentages[level.characterLevel.current];
                characterLevelIncome = (totalDirectReferralBalance * percentage) / 100;
            }
            
            // Store calculated income
            level.dailyIncome.characterLevel = characterLevelIncome;
            level.dailyIncome.digitLevel = digitLevelIncome;
            level.lastCalculated = new Date();
            
            await level.save();
            
            return true;
            
        } catch (error) {
            console.error(`❌ Error calculating daily income for user ${userId}:`, error.message);
            return false;
        }
    }

    // Manual trigger for testing
    async triggerDailyUpdate() {
        console.log('🔧 Manually triggering daily update...');
        await this.performDailyLevelUpdate();
    }

    // Manual trigger for testing
    async triggerWeeklyRecalculation() {
        console.log('🔧 Manually triggering weekly recalculation...');
        await this.performWeeklyLevelRecalculation();
    }

    // Get cron job status
    getStatus() {
        return {
            isRunning: this.isRunning,
            jobs: {
                dailyUpdate: '0 0 * * *', // 12:00 AM daily
                weeklyRecalculation: '0 1 * * 0' // 1:00 AM every Sunday
            },
            timezone: 'Asia/Kolkata'
        };
    }
}

module.exports = new CronService(); 