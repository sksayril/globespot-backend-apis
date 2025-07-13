const User = require('../models/user.model');
const Level = require('../models/level.model');
const Deposit = require('../models/deposit.model');

class LevelService {
    
    // Initialize level for a new user
    static async initializeLevel(userId) {
        try {
            const existingLevel = await Level.findOne({ userId });
            if (existingLevel) {
                return existingLevel;
            }
            
            const newLevel = new Level({
                userId,
                characterLevel: {
                    current: null,
                    totalEarned: 0
                },
                digitLevel: {
                    current: null,
                    totalEarned: 0,
                    directMembers: []
                },
                dailyIncome: {
                    characterLevel: 0,
                    digitLevel: 0
                }
            });
            
            return await newLevel.save();
        } catch (error) {
            console.error('Error initializing level:', error);
            throw error;
        }
    }
    
    // Calculate character level based on referral chain
    static async calculateCharacterLevel(userId) {
        try {
            const user = await User.findById(userId).populate('referredBy');
            if (!user) {
                throw new Error('User not found');
            }
            
            let level = await Level.findOne({ userId });
            if (!level) {
                level = await this.initializeLevel(userId);
            }
            
            // Find the character level based on referral chain depth
            let currentUser = user;
            let depth = 0;
            const characterLevels = ['A', 'B', 'C', 'D', 'E'];
            
            while (currentUser.referredBy && depth < characterLevels.length) {
                currentUser = await User.findById(currentUser.referredBy).populate('referredBy');
                depth++;
            }
            
            const newCharacterLevel = depth < characterLevels.length ? characterLevels[depth] : null;
            
            // Update character level if changed
            if (level.characterLevel.current !== newCharacterLevel) {
                level.characterLevel.current = newCharacterLevel;
                level.characterLevel.lastCalculated = new Date();
                await level.save();
            }
            
            return level.characterLevel;
        } catch (error) {
            console.error('Error calculating character level:', error);
            throw error;
        }
    }
    
    // Calculate digit level based on direct referrals and wallet criteria
    static async calculateDigitLevel(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }
            
            let level = await Level.findOne({ userId });
            if (!level) {
                level = await this.initializeLevel(userId);
            }
            
            // Get direct referrals
            const directReferrals = await User.find({ referredBy: userId });
            
            // Update direct members list
            level.digitLevel.directMembers = directReferrals.map(ref => ({
                memberId: ref._id,
                joinedAt: ref.createdAt,
                walletBalance: ref.normalWallet?.balance || 0
            }));
            
            // Check wallet criteria for each level
            const userNormalWallet = user.normalWallet?.balance || 0;
            const validMembers = level.digitLevel.directMembers.filter(
                member => member.walletBalance >= 50
            );
            
            let newDigitLevel = null;
            
            // Check Lvl5 criteria
            if (validMembers.length >= 80 && userNormalWallet >= 10000) {
                newDigitLevel = 'Lvl5';
            }
            // Check Lvl4 criteria
            else if (validMembers.length >= 40 && userNormalWallet >= 2500) {
                newDigitLevel = 'Lvl4';
            }
            // Check Lvl3 criteria
            else if (validMembers.length >= 40 && userNormalWallet >= 1100) {
                newDigitLevel = 'Lvl3';
            }
            // Check Lvl2 criteria
            else if (validMembers.length >= 10 && userNormalWallet >= 500) {
                newDigitLevel = 'Lvl2';
            }
            // Check Lvl1 criteria
            else if (validMembers.length >= 5 && userNormalWallet >= 200) {
                newDigitLevel = 'Lvl1';
            }
            
            // Update digit level if changed
            if (level.digitLevel.current !== newDigitLevel) {
                level.digitLevel.current = newDigitLevel;
                level.digitLevel.lastCalculated = new Date();
                await level.save();
            }
            
            return level.digitLevel;
        } catch (error) {
            console.error('Error calculating digit level:', error);
            throw error;
        }
    }
    
    // Calculate daily income for character level
    static async calculateCharacterLevelIncome(userId) {
        try {
            const user = await User.findById(userId);
            const level = await Level.findOne({ userId });
            
            if (!user || !level || !level.characterLevel.current) {
                return 0;
            }
            
            // Get parent user's normal wallet balance
            const parentUser = await User.findById(user.referredBy);
            if (!parentUser) {
                return 0;
            }
            
            const parentWalletBalance = parentUser.normalWallet?.balance || 0;
            const percentage = level.characterLevel.percentages[level.characterLevel.current];
            
            const dailyIncome = (parentWalletBalance * percentage) / 100;
            
            return dailyIncome;
        } catch (error) {
            console.error('Error calculating character level income:', error);
            return 0;
        }
    }
    
    // Calculate daily income for digit level
    static async calculateDigitLevelIncome(userId) {
        try {
            const user = await User.findById(userId);
            const level = await Level.findOne({ userId });
            
            if (!user || !level || !level.digitLevel.current) {
                return 0;
            }
            
            const userWalletBalance = user.normalWallet?.balance || 0;
            const percentage = level.digitLevel.percentages[level.digitLevel.current];
            
            const dailyIncome = (userWalletBalance * percentage) / 100;
            
            return dailyIncome;
        } catch (error) {
            console.error('Error calculating digit level income:', error);
            return 0;
        }
    }
    
    // Claim daily income for both character and digit levels
    static async claimDailyIncome(userId) {
        try {
            const user = await User.findById(userId);
            const level = await Level.findOne({ userId });
            
            if (!user || !level) {
                throw new Error('User or level not found');
            }
            
            // Check if already claimed today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (level.dailyIncome.lastClaimed) {
                const lastClaimed = new Date(level.dailyIncome.lastClaimed);
                lastClaimed.setHours(0, 0, 0, 0);
                
                if (lastClaimed.getTime() === today.getTime()) {
                    throw new Error('Daily income already claimed today');
                }
            }
            
            // Calculate incomes
            const characterIncome = await this.calculateCharacterLevelIncome(userId);
            const digitIncome = await this.calculateDigitLevelIncome(userId);
            
            const totalIncome = characterIncome + digitIncome;
            
            if (totalIncome <= 0) {
                throw new Error('No income available to claim');
            }
            
            // Update user's normal wallet
            if (!user.normalWallet) {
                user.normalWallet = { balance: 0 };
            }
            user.normalWallet.balance += totalIncome;
            
            // Add transaction to wallet history
            if (!user.normalWallet.transactions) {
                user.normalWallet.transactions = [];
            }
            
            user.normalWallet.transactions.push({
                type: 'level_income',
                amount: totalIncome,
                description: `Level income - Character: ${characterIncome.toFixed(2)}, Digit: ${digitIncome.toFixed(2)}`,
                date: new Date(),
                status: 'approved'
            });
            
            // Update level tracking
            level.dailyIncome.characterLevel = characterIncome;
            level.dailyIncome.digitLevel = digitIncome;
            level.dailyIncome.lastClaimed = new Date();
            level.characterLevel.totalEarned += characterIncome;
            level.digitLevel.totalEarned += digitIncome;
            
            await user.save();
            await level.save();
            
            return {
                characterIncome,
                digitIncome,
                totalIncome,
                newBalance: user.normalWallet.balance
            };
        } catch (error) {
            console.error('Error claiming daily income:', error);
            throw error;
        }
    }
    
    // Get level status for a user
    static async getUserLevelStatus(userId) {
        try {
            const user = await User.findById(userId);
            let level = await Level.findOne({ userId });
            
            if (!user) {
                throw new Error('User not found');
            }
            
            if (!level) {
                level = await this.initializeLevel(userId);
            }
            
            // Calculate current levels
            const characterLevel = await this.calculateCharacterLevel(userId);
            const digitLevel = await this.calculateDigitLevel(userId);
            
            // Calculate potential incomes
            const characterIncome = await this.calculateCharacterLevelIncome(userId);
            const digitIncome = await this.calculateDigitLevelIncome(userId);
            
            return {
                characterLevel,
                digitLevel,
                potentialIncome: {
                    character: characterIncome,
                    digit: digitIncome,
                    total: characterIncome + digitIncome
                },
                dailyIncome: level.dailyIncome,
                canClaim: this.canClaimDailyIncome(level.dailyIncome.lastClaimed)
            };
        } catch (error) {
            console.error('Error getting user level status:', error);
            throw error;
        }
    }
    
    // Check if user can claim daily income
    static canClaimDailyIncome(lastClaimed) {
        if (!lastClaimed) {
            return true;
        }
        
        const today = new Date();
        const lastClaimedDate = new Date(lastClaimed);
        
        today.setHours(0, 0, 0, 0);
        lastClaimedDate.setHours(0, 0, 0, 0);
        
        return today.getTime() !== lastClaimedDate.getTime();
    }
    
    // Update levels when a new user joins
    static async updateLevelsOnNewUser(newUserId, referrerId) {
        try {
            // Update character levels for the entire referral chain
            let currentUserId = referrerId;
            while (currentUserId) {
                await this.calculateCharacterLevel(currentUserId);
                const currentUser = await User.findById(currentUserId);
                currentUserId = currentUser?.referredBy;
            }
            
            // Update digit level for the direct referrer
            await this.calculateDigitLevel(referrerId);
            
            return true;
        } catch (error) {
            console.error('Error updating levels on new user:', error);
            throw error;
        }
    }
    
    // Update levels when wallet balance changes
    static async updateLevelsOnWalletChange(userId) {
        try {
            await this.calculateDigitLevel(userId);
            
            // Update character levels for all users who have this user in their referral chain
            const usersWithThisReferrer = await User.find({ referredBy: userId });
            for (const user of usersWithThisReferrer) {
                await this.calculateCharacterLevel(user._id);
            }
            
            return true;
        } catch (error) {
            console.error('Error updating levels on wallet change:', error);
            throw error;
        }
    }
}

module.exports = LevelService; 