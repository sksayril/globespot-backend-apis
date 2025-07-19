const mongoose = require('mongoose');
const Level = require('../models/level.model');
require('dotenv').config();

async function fixLevelData() {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/globespot');
        console.log('Connected to database');

        // Find all level records
        const levels = await Level.find({});
        console.log(`Found ${levels.length} level records`);

        let fixedCount = 0;
        let errorCount = 0;

        for (const level of levels) {
            try {
                let needsUpdate = false;

                // Fix character level if invalid
                if (level.characterLevel.current && 
                    !['A', 'B', 'C', 'D', 'E'].includes(level.characterLevel.current)) {
                    console.log(`Fixing invalid character level: ${level.characterLevel.current} -> null`);
                    level.characterLevel.current = null;
                    needsUpdate = true;
                }

                // Fix digit level if invalid
                if (level.digitLevel.current && 
                    !['Lvl1', 'Lvl2', 'Lvl3', 'Lvl4', 'Lvl5'].includes(level.digitLevel.current)) {
                    console.log(`Fixing invalid digit level: ${level.digitLevel.current} -> null`);
                    level.digitLevel.current = null;
                    needsUpdate = true;
                }

                if (needsUpdate) {
                    await level.save();
                    fixedCount++;
                }
            } catch (error) {
                console.error(`Error fixing level ${level._id}:`, error.message);
                errorCount++;
            }
        }

        console.log(`Migration completed:`);
        console.log(`- Total records: ${levels.length}`);
        console.log(`- Fixed: ${fixedCount}`);
        console.log(`- Errors: ${errorCount}`);

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from database');
    }
}

// Run the migration
fixLevelData(); 