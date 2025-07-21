const cron = require('node-cron');
const User = require('../models/user.model');

class SelfIncomeCronService {
    constructor() {
        this.isRunning = false;
    }

    // Initialize self-income cron job
    init() {
        console.log('💰 Initializing Self-Income Cron Job...');
        
        // Daily self-income generation at 12:00 PM (noon)
        this.scheduleSelfIncomeGeneration();
        
        console.log('✅ Self-Income Cron Job initialized successfully');
    }

    // Schedule daily self-income generation
    scheduleSelfIncomeGeneration() {
        // Run at 12:00 PM (noon) every day
        cron.schedule('0 12 * * *', async () => {
            console.log('🕛 Starting daily self-income generation...');
            await this.performSelfIncomeGeneration();
        }, {
            scheduled: true,
            timezone: "Asia/Kolkata" // Indian timezone
        });
        
        console.log('📅 Scheduled self-income generation at 12:00 PM (noon) daily');
    }

    // Perform self-income generation
    async performSelfIncomeGeneration() {
        if (this.isRunning) {
            console.log('⚠️ Self-income generation already running, skipping...');
            return;
        }

        this.isRunning = true;
        const startTime = new Date();
        
        try {
            console.log('🔄 Starting self-income generation process...');
            
            // Get all active users
            const users = await User.find({ 
                role: 'user', 
                isActive: true, 
                isBlocked: false 
            }).select('_id name email normalWallet dailyIncome');
            
            console.log(`📋 Found ${users.length} active users to process`);
            
            let processedCount = 0;
            let updatedCount = 0;
            let errorCount = 0;
            let totalIncomeGenerated = 0;
            
            for (const user of users) {
                try {
                    const currentBalance = user.normalWallet?.balance || 0;
                    
                    // Skip users with zero balance
                    if (currentBalance <= 0) {
                        processedCount++;
                        continue;
                    }
                    
                    // Calculate self-income (0.50% of normal wallet balance)
                    const selfIncomeAmount = (currentBalance * 0.50) / 100;
                    
                    // Add self-income to normal wallet
                    user.normalWallet.balance += selfIncomeAmount;
                    
                    // Add transaction record
                    user.normalWallet.transactions.push({
                        type: 'daily_income',
                        amount: selfIncomeAmount,
                        description: `Daily self-income (0.50% of wallet balance: ${currentBalance})`,
                        date: new Date(),
                        status: 'approved'
                    });
                    
                    // Update daily income tracking
                    user.dailyIncome.todayEarned += selfIncomeAmount;
                    user.dailyIncome.totalEarned += selfIncomeAmount;
                    user.dailyIncome.lastClaimed = new Date();
                    
                    // Save user
                    await user.save();
                    
                    totalIncomeGenerated += selfIncomeAmount;
                    updatedCount++;
                    processedCount++;
                    
                    // Log progress every 50 users
                    if (processedCount % 50 === 0) {
                        console.log(`📈 Processed ${processedCount}/${users.length} users...`);
                    }
                    
                } catch (error) {
                    console.error(`❌ Error processing user ${user._id}:`, error.message);
                    errorCount++;
                }
            }
            
            const endTime = new Date();
            const duration = (endTime - startTime) / 1000;
            
            console.log('✅ Self-income generation completed!');
            console.log(`📊 Summary:`);
            console.log(`   - Total users: ${users.length}`);
            console.log(`   - Processed: ${processedCount}`);
            console.log(`   - Updated: ${updatedCount}`);
            console.log(`   - Errors: ${errorCount}`);
            console.log(`   - Total income generated: ₹${totalIncomeGenerated.toFixed(2)}`);
            console.log(`   - Duration: ${duration.toFixed(2)} seconds`);
            
        } catch (error) {
            console.error('❌ Error in self-income generation:', error);
        } finally {
            this.isRunning = false;
        }
    }

    // Manual trigger for testing
    async triggerSelfIncomeGeneration() {
        console.log('🔧 Manually triggering self-income generation...');
        await this.performSelfIncomeGeneration();
    }

    // Get cron job status
    getStatus() {
        return {
            isRunning: this.isRunning,
            jobs: {
                selfIncomeGeneration: '0 12 * * *' // 12:00 PM daily
            },
            timezone: 'Asia/Kolkata'
        };
    }
}

module.exports = new SelfIncomeCronService(); 