require('dotenv').config();
require('../utilities/database');

const SelfIncomeCronService = require('../services/selfincomecorn');

async function testSelfIncomeGeneration() {
    try {
        console.log('🧪 Starting Self-Income Generation Test...');
        console.log('=====================================');
        
        // Trigger the self-income generation
        await SelfIncomeCronService.triggerSelfIncomeGeneration();
        
        console.log('=====================================');
        console.log('✅ Self-Income Generation Test Completed!');
        
        // Get status
        const status = SelfIncomeCronService.getStatus();
        console.log('📊 Cron Job Status:', JSON.stringify(status, null, 2));
        
    } catch (error) {
        console.error('❌ Error during test:', error);
    } finally {
        // Close database connection
        const mongoose = require('mongoose');
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);
    }
}

// Run the test
testSelfIncomeGeneration(); 