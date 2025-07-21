require('dotenv').config();
require('../utilities/database');

const SelfIncomeCronService = require('../services/selfincomecorn');

console.log('🧪 Starting Self-Income Generation Test...');
console.log('=====================================');

// Trigger the self-income generation
SelfIncomeCronService.triggerSelfIncomeGeneration()
    .then(() => {
        console.log('✅ Self-Income Generation Test Completed!');
        
        // Get status
        const status = SelfIncomeCronService.getStatus();
        console.log('📊 Cron Job Status:', JSON.stringify(status, null, 2));
    })
    .catch((error) => {
        console.error('❌ Error during test:', error);
    })
    .finally(() => {
        // Close database connection after a delay
        setTimeout(async () => {
            const mongoose = require('mongoose');
            await mongoose.connection.close();
            console.log('🔌 Database connection closed');
            process.exit(0);
        }, 2000);
    }); 