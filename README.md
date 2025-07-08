# GlobeSpot MLM System

A comprehensive Multi-Level Marketing (MLM) system with admin and user management, referral system, and dual wallet functionality.

## 🚀 Features

### Admin Features
- ✅ Admin signup and login (only one admin allowed)
- ✅ View all users with original passwords
- ✅ Block/unblock users
- ✅ Manage deposit requests with approval/rejection
- ✅ System statistics dashboard
- ✅ 10% referral bonus processing

### User Features
- ✅ User signup with referral code validation
- ✅ User login and profile management
- ✅ Dual wallet system (Investment & Normal)
- ✅ Deposit requests with payment proof upload
- ✅ Referral system tracking
- ✅ Wallet transfers between accounts
- ✅ Transaction history

### Security Features
- ✅ JWT authentication
- ✅ Password hashing with bcrypt
- ✅ Original password storage for admin access
- ✅ File upload validation
- ✅ Role-based access control

## 📁 Project Structure

```
basic-apiBuilding/
├── models/
│   ├── user.model.js          # User and admin model
│   └── deposit.model.js       # Deposit request model
├── routes/
│   ├── admin.js              # Admin APIs
│   ├── users.js              # User APIs
│   └── index.js              # Basic routes
├── middleware/
│   ├── auth.js               # Authentication middleware
│   └── upload.js             # File upload middleware
├── utilities/
│   └── database.js           # Database connection
├── uploads/                  # Payment proof images
├── app.js                    # Main application file
├── package.json              # Dependencies
└── API_DOCUMENTATION.md      # Complete API documentation
```

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd basic-apiBuilding
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   Create a `.env` file in the root directory:
   ```
   JWT_SECRET=your-secret-key-here
   MONGODB_URI=your-mongodb-connection-string
   NODE_ENV=development
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Create admin account**
   Make a POST request to `/admin/signup` to create the first admin account.

## 📚 API Documentation

Complete API documentation is available in [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

### Quick Start Examples

#### Create Admin Account
```bash
curl -X POST http://localhost:3000/admin/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@example.com",
    "phone": "1234567890",
    "password": "adminpass123"
  }'
```

#### Create User Account
```bash
curl -X POST http://localhost:3000/users/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "password": "userpass123",
    "referralCode": "ADMIN123456"
  }'
```

#### User Login
```bash
curl -X POST http://localhost:3000/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "userpass123"
  }'
```

## 🔧 Key Features Explained

### Referral System
- Users can sign up using referral codes
- Referrers get 10% bonus on their referred user's first deposit
- Multi-level referral tracking

### Dual Wallet System
- **Investment Wallet**: For MLM investments and bonuses
- **Normal Wallet**: For regular transactions
- Users can transfer between wallets

### Deposit Management
- Users upload payment proof images
- Admin approves/rejects deposits
- Automatic referral bonus processing
- Transaction history tracking

### Security
- Passwords are hashed using bcrypt
- Original passwords stored for admin access
- JWT token authentication
- Role-based access control

## 🚨 Important Notes

1. **Admin Account**: Only one admin account is allowed in the system
2. **Original Passwords**: Stored in plain text for admin access as requested
3. **File Uploads**: Limited to 5MB, only image files accepted
4. **Referral Bonus**: 10% bonus automatically processed on first deposit approval
5. **JWT Tokens**: Expire after 7 days

## 🔍 API Endpoints Summary

### Admin Endpoints
- `POST /admin/signup` - Create admin account
- `POST /admin/login` - Admin login
- `GET /admin/users` - Get all users
- `GET /admin/users/:userId` - Get user with original password
- `POST /admin/users/:userId/block` - Block/unblock user
- `GET /admin/deposits` - Get all deposits
- `POST /admin/deposits/:depositId/approve` - Approve/reject deposit
- `GET /admin/statistics` - System statistics

### User Endpoints
- `POST /users/signup` - User registration
- `POST /users/login` - User login
- `GET /users/profile` - Get profile
- `POST /users/profile` - Update profile
- `GET /users/wallets` - Get wallet balances
- `POST /users/deposits` - Create deposit request
- `GET /users/deposits` - Get user deposits
- `GET /users/referrals` - Get referral info
- `POST /users/transfer` - Transfer between wallets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please refer to the API documentation or create an issue in the repository.
