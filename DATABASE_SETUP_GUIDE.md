# Database Setup Guide

## Step 1: Clear Test Data

Run this command to remove the test data from the current SQLite database:

```bash
cd backend
node clear-test-data.js
```

## Step 2: Choose Your Database Option

### Option A: Local PostgreSQL (Recommended)

1. **Install PostgreSQL** on your system
2. **Create a database** named `cms_db`
3. **Create a `.env` file** in the backend directory:

```env
DATABASE_URL="postgresql://your_username:your_password@localhost:5432/cms_db"
PORT=5000
NODE_ENV=development
```

### Option B: Docker PostgreSQL (Easiest)

1. **Run PostgreSQL in Docker**:

```bash
docker run --name cms-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=cms_db -p 5432:5432 -d postgres:15
```

2. **Create a `.env` file** in the backend directory:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/cms_db"
PORT=5000
NODE_ENV=development
```

### Option C: Cloud Database

Use a cloud database service like:
- **Railway**: https://railway.app/
- **Supabase**: https://supabase.com/
- **Neon**: https://neon.tech/

Get your connection string and add it to `.env`:

```env
DATABASE_URL="your_cloud_database_connection_string"
PORT=5000
NODE_ENV=development
```

## Step 3: Set Up Database Schema

After creating the `.env` file, run:

```bash
cd backend
npm run db:generate
npm run db:push
```

## Step 4: Start the Application

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## Step 5: Test the Connection

1. Open browser to `http://localhost:3000`
2. Navigate to Employee Management
3. The database should be empty and ready for real data

## Troubleshooting

### If you get permission errors:
```bash
# Windows: Run PowerShell as Administrator
# Mac/Linux: Use sudo if needed
```

### If database connection fails:
1. Check if PostgreSQL is running
2. Verify credentials in `.env` file
3. Ensure database `cms_db` exists
4. Check firewall settings

### If Prisma client generation fails:
```bash
cd backend
npx prisma generate --force
```

## Database Schema

The application uses these tables:
- **Employee**: Stores employee information
- **Certification**: Stores certification details with validity rules
- **Validity Rules**: Managed through the certification validity service

## Next Steps

After setup:
1. Upload real employee data via Excel
2. Configure certification validity rules
3. Use the application for real employee management 