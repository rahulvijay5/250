#!/bin/bash

echo "🎮 Setting up 250 Card Game Scoring App..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install npm dependencies
echo "📦 Installing npm dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install npm dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Create .env.local file if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating environment configuration..."
    cat > .env.local << EOF
# Database Configuration
DATABASE_URL="postgresql://postgres:password123@localhost:5433/cardgame?schema=public"

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Application Configuration
NODE_ENV=development
EOF
    echo "✅ Environment file created"
else
    echo "✅ Environment file already exists"
fi

# Start PostgreSQL with Docker Compose
echo "🐳 Starting PostgreSQL with Docker Compose..."
docker-compose up -d postgres

if [ $? -ne 0 ]; then
    echo "❌ Failed to start PostgreSQL"
    exit 1
fi

echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 15

# Check if PostgreSQL is running
if docker ps | grep -q "cardgame-postgres"; then
    echo "✅ PostgreSQL is running"
else
    echo "❌ PostgreSQL failed to start"
    exit 1
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

if [ $? -ne 0 ]; then
    echo "❌ Failed to generate Prisma client"
    exit 1
fi

# Push database schema
echo "🗄️  Setting up database schema..."
npx prisma db push

if [ $? -ne 0 ]; then
    echo "❌ Failed to push database schema"
    exit 1
fi

# Seed the database
echo "🌱 Seeding database with initial data..."
npm run db:seed

if [ $? -ne 0 ]; then
    echo "❌ Failed to seed database"
    exit 1
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Run 'npm run dev' to start the development server"
echo "2. Open http://localhost:3000 in your browser"
echo "3. PostgreSQL is running on localhost:5432"
echo "4. pgAdmin (database admin) is available at http://localhost:8081"
echo "   - Email: admin@cardgame.com"
echo "   - Password: admin123"
echo "5. Run 'npm run db:studio' to open Prisma Studio"
echo ""
echo "🛠️  To stop PostgreSQL: docker-compose down"
echo "🛠️  To view logs: docker-compose logs postgres"
echo "🛠️  To reset database: npx prisma db push --force-reset"
