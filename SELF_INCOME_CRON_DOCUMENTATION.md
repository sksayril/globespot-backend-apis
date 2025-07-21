# Self-Income Cron Job Documentation

## Overview
The self-income cron job automatically generates daily income for users based on their normal wallet balance. It adds 0.50% of the user's normal wallet balance as self-income every day at 12:00 PM (noon) Indian time.

## Features

### 🕛 Automatic Execution
- **Schedule**: Every day at 12:00 PM (noon)
- **Timezone**: Asia/Kolkata (Indian Standard Time)
- **Cron Expression**: `0 12 * * *`

### 💰 Income Calculation
- **Rate**: 0.50% of normal wallet balance
- **Formula**: `(normalWallet.balance × 0.50) ÷ 100`
- **Example**: If user has ₹1000 in normal wallet, they get ₹5.00 daily self-income

### 📊 User Eligibility
- Only active users (`isActive: true`)
- Non-blocked users (`isBlocked: false`)
- Users with role 'user'
- Users with positive normal wallet balance (> 0)

### 🔄 Transaction Tracking
- Adds transaction record to `normalWallet.transactions`
- Updates `dailyIncome` tracking fields
- Records timestamp of last claimed income

## Files Created/Modified

### New Files
1. **`services/selfincomecorn.js`** - Main self-income cron service
2. **`scripts/testSelfIncome.js`** - Test script for manual execution
3. **`scripts/runSelfIncomeTest.js`** - Simplified test script
4. **`SELF_INCOME_CRON_DOCUMENTATION.md`** - This documentation

### Modified Files
1. **`services/cronService.js`** - Integrated self-income cron initialization
2. **`routes/admin.js`** - Added test routes for admin panel

## Testing

### Method 1: Standalone Script
```bash
node scripts/runSelfIncomeTest.js
```

### Method 2: Admin API Route
```bash
POST /admin/test-self-income
Headers: Authorization: Bearer <admin_token>
```

### Method 3: Get Cron Status
```bash
GET /admin/cron-status
Headers: Authorization: Bearer <admin_token>
```

## API Endpoints

### Test Self-Income Generation
- **URL**: `POST /admin/test-self-income`
- **Auth**: Admin token required
- **Response**:
```json
{
  "success": true,
  "message": "Self-income generation test completed successfully",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Get Cron Status
- **URL**: `GET /admin/cron-status`
- **Auth**: Admin token required
- **Response**:
```json
{
  "success": true,
  "data": {
    "isRunning": false,
    "jobs": {
      "dailyUpdate": "0 0 * * *",
      "weeklyRecalculation": "0 1 * * 0",
      "selfIncomeGeneration": "0 12 * * *"
    },
    "timezone": "Asia/Kolkata"
  }
}
```

## Database Changes

### User Model Updates
The self-income generation updates the following fields:
- `normalWallet.balance` - Adds calculated self-income
- `normalWallet.transactions` - Adds transaction record
- `dailyIncome.todayEarned` - Updates today's earned amount
- `dailyIncome.totalEarned` - Updates total earned amount
- `dailyIncome.lastClaimed` - Updates last claimed timestamp

### Transaction Record Format
```json
{
  "type": "daily_income",
  "amount": 5.00,
  "description": "Daily self-income (0.50% of wallet balance: 1000)",
  "date": "2024-01-01T12:00:00.000Z",
  "status": "approved"
}
```

## Monitoring

### Console Logs
The cron job provides detailed console logs:
- Process start/end times
- Number of users processed
- Total income generated
- Error counts
- Processing duration

### Example Output
```
🕛 Starting daily self-income generation...
🔄 Starting self-income generation process...
📋 Found 8 active users to process
✅ Self-income generation completed!
📊 Summary:
   - Total users: 8
   - Processed: 8
   - Updated: 8
   - Errors: 0
   - Total income generated: ₹53.80
   - Duration: 1.17 seconds
```

## Configuration

### Timezone
Currently set to `Asia/Kolkata` (Indian Standard Time)
To change timezone, modify the `timezone` parameter in `scheduleSelfIncomeGeneration()`

### Income Rate
Currently set to 0.50%
To change the rate, modify the calculation in `performSelfIncomeGeneration()`:
```javascript
const selfIncomeAmount = (currentBalance * 0.50) / 100; // Change 0.50 to desired percentage
```

## Error Handling

### Duplicate Execution Prevention
- Uses `isRunning` flag to prevent concurrent executions
- Skips execution if already running

### User Processing Errors
- Individual user errors don't stop the entire process
- Errors are logged and counted
- Process continues with remaining users

### Database Connection
- Graceful handling of database connection issues
- Proper cleanup of database connections in test scripts

## Security Considerations

### Admin Access Only
- Test routes require admin authentication
- Uses `adminAuth` middleware for protection

### Data Validation
- Validates user eligibility before processing
- Checks for positive wallet balances
- Ensures proper transaction status

## Troubleshooting

### Common Issues

1. **Cron not running**
   - Check if server is running
   - Verify timezone settings
   - Check console logs for initialization messages

2. **No income generated**
   - Verify users have positive wallet balances
   - Check if users are active and not blocked
   - Review console logs for processing details

3. **Database connection issues**
   - Check MongoDB connection string
   - Verify database server is running
   - Review error logs

### Manual Testing
Use the provided test scripts to verify functionality:
```bash
node scripts/runSelfIncomeTest.js
```

## Future Enhancements

### Potential Improvements
1. **Configurable rates** - Make income rate configurable via admin panel
2. **Multiple time slots** - Allow multiple daily executions
3. **User notifications** - Send notifications when income is generated
4. **Detailed reporting** - Add comprehensive reporting dashboard
5. **Rate limits** - Add maximum daily income limits per user 