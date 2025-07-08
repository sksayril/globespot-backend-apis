# Setup Guide for GlobeSpot MLM System

## Environment Configuration

### Step 1: Create .env file
Copy the example environment file and rename it to `.env`:

```bash
cp env.example .env
```

### Step 2: Configure Required Variables

#### Essential Variables (Required)

1. **JWT_SECRET**
   ```env
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   ```
   - Generate a strong random string for production
   - Used for signing JWT tokens
   - Example: `JWT_SECRET=my-super-secret-key-2024-mlm-system`

2. **MONGODB_URI**
   ```env
   MONGODB_URI=mongodb://localhost:27017/globespot-mlm
   ```
   - For local MongoDB: `mongodb://localhost:27017/globespot-mlm`
   - For MongoDB Atlas: `mongodb+srv://username:password@cluster.mongodb.net/globespot-mlm?retryWrites=true&w=majority`

3. **NODE_ENV**
   ```env
   NODE_ENV=development
   ```
   - Use `development` for development
   - Use `production` for production

#### Optional Variables

4. **PORT** (defaults to 3000)
   ```env
   PORT=3000
   ```

5. **MAX_FILE_SIZE** (defaults to 5MB)
   ```env
   MAX_FILE_SIZE=5242880
   ```

### Step 3: Example .env File

Here's a complete example `.env` file:

```env
# GlobeSpot MLM System Environment Variables

# JWT Configuration
JWT_SECRET=my-super-secret-jwt-key-2024-mlm-system

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/globespot-mlm

# Server Configuration
PORT=3000
NODE_ENV=development

# File Upload Configuration
MAX_FILE_SIZE=5242880
```

### Step 4: MongoDB Setup

#### Option A: Local MongoDB
1. Install MongoDB on your system
2. Start MongoDB service
3. Create database: `globespot-mlm`

#### Option B: MongoDB Atlas (Cloud)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get connection string
4. Replace username, password, and cluster details

### Step 5: Test Configuration

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

3. Test admin signup:
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

### Security Notes

1. **Never commit .env file to version control**
2. **Use strong JWT_SECRET in production**
3. **Use environment-specific MongoDB connections**
4. **Regularly update dependencies**

### Troubleshooting

#### Common Issues:

1. **MongoDB Connection Error**
   - Check if MongoDB is running
   - Verify connection string
   - Check network connectivity

2. **JWT Token Issues**
   - Ensure JWT_SECRET is set
   - Check token expiration

3. **File Upload Issues**
   - Ensure uploads directory exists
   - Check file size limits
   - Verify file type restrictions

### Production Checklist

- [ ] Change JWT_SECRET to a strong random string
- [ ] Use production MongoDB connection
- [ ] Set NODE_ENV=production
- [ ] Configure proper CORS settings
- [ ] Set up SSL/TLS certificates
- [ ] Configure proper logging
- [ ] Set up monitoring and alerts 