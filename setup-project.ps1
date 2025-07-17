# CMS Application Setup Script
# Run this script from the project root directory

Write-Host "🚀 Setting up CMS Application..." -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not installed. Please install npm first." -ForegroundColor Red
    exit 1
}

# Install backend dependencies
Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
Set-Location backend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install backend dependencies" -ForegroundColor Red
    exit 1
}

# Install frontend dependencies
Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location ../frontend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red
    exit 1
}

# Build backend
Write-Host "🔨 Building backend..." -ForegroundColor Yellow
Set-Location ../backend
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build backend" -ForegroundColor Red
    exit 1
}

# Build frontend
Write-Host "🔨 Building frontend..." -ForegroundColor Yellow
Set-Location ../frontend
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build frontend" -ForegroundColor Red
    exit 1
}

# Check if .env file exists in backend
Set-Location ../backend
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  No .env file found in backend directory" -ForegroundColor Yellow
    Write-Host "📝 Please create a .env file with the following content:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "# Database Configuration" -ForegroundColor White
    Write-Host 'DATABASE_URL="postgresql://username:password@localhost:5432/cms_db"' -ForegroundColor White
    Write-Host ""
    Write-Host "# Server Configuration" -ForegroundColor White
    Write-Host "PORT=5000" -ForegroundColor White
    Write-Host ""
    Write-Host "# Environment" -ForegroundColor White
    Write-Host "NODE_ENV=development" -ForegroundColor White
    Write-Host ""
    Write-Host "📖 See backend/SETUP.md for detailed setup instructions" -ForegroundColor Cyan
} else {
    Write-Host "✅ .env file found in backend directory" -ForegroundColor Green
}

# Return to project root
Set-Location ..

Write-Host ""
Write-Host "🎉 Setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Configure your database connection in backend/.env" -ForegroundColor White
Write-Host "2. Run 'cd backend && npm run db:generate && npm run db:push'" -ForegroundColor White
Write-Host "3. Start backend: 'cd backend && npm run dev'" -ForegroundColor White
Write-Host "4. Start frontend: 'cd frontend && npm run dev'" -ForegroundColor White
Write-Host "5. Access the application at http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "📚 For detailed setup instructions, see:" -ForegroundColor Cyan
Write-Host "   - backend/SETUP.md" -ForegroundColor White
Write-Host "   - README.md" -ForegroundColor White 