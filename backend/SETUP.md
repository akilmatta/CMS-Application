# Backend Setup Guide

## Environment Configuration

### 1. Create Environment File

Create a `.env` file in the backend directory with the following content:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/cms_db"

# Server Configuration
PORT=5000

# Environment
NODE_ENV=development
```

### 2. Database Setup

#### Option A: Local PostgreSQL
1. Install PostgreSQL on your system
2. Create a database named `cms_db`
3. Update the DATABASE_URL with your credentials:
   ```env
   DATABASE_URL="postgresql://your_username:your_password@localhost:5432/cms_db"
   ```

#### Option B: Docker PostgreSQL
```bash
docker run --name cms-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=cms_db -p 5432:5432 -d postgres:15
```

Then use:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/cms_db"
```

#### Option C: Cloud Database (Railway, Supabase, etc.)
Use the connection string provided by your cloud database service.

### 3. Initialize Database

After setting up the environment file, run:

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push
```

### 4. Start Development Server

```bash
npm run dev
```

## Troubleshooting

### Common Issues:

1. **"Environment variable not found: DATABASE_URL"**
   - Make sure the `.env` file exists in the backend directory
   - Check that the file name is exactly `.env` (not `.env.txt`)

2. **Database connection failed**
   - Verify PostgreSQL is running
   - Check database credentials in DATABASE_URL
   - Ensure database `cms_db` exists

3. **Port already in use**
   - Change PORT in .env file to another value (e.g., 5001)
   - Or kill the process using the current port

## Development Workflow

1. Start the backend server: `npm run dev`
2. Start the frontend server: `cd ../frontend && npm run dev`
3. Access the application at: http://localhost:3000
4. Backend API will be available at: http://localhost:5000 