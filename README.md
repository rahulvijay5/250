# 250 Card Game Scoring App

A modern, mobile-friendly scoring application for the 250/Partner card game with dynamic partnerships and flexible scoring rules.

## Features

- 🎮 **Flexible Player Count**: Support for 4-10+ players
- 🤝 **Dynamic Partnerships**: 2 partners for 4-5 players, 3 partners for 6+ players
- 📍 **Location Management**: Track games by location with custom locations
- 👥 **Player Management**: Add/remove players with Dicebear avatars
- 📊 **Real-time Scoring**: Live score tracking and rankings
- 🏆 **Game Statistics**: Win/loss records and detailed match history
- 📱 **Mobile-First Design**: Optimized for mobile devices
- 🎉 **Confetti Animations**: Celebrate winners with visual effects
- 📄 **Export Results**: Download game results as text files

## Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **UI Components**: Radix UI, Lucide React
- **Deployment**: Docker Compose

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd 250
   ```

2. **Run the setup script**
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

   This will:
   - Install all dependencies
   - Start PostgreSQL database
   - Set up the database schema
   - Seed initial data
   - Create environment configuration

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Manual Setup

If you prefer to set up manually:

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start PostgreSQL**
   ```bash
   docker-compose up -d postgres
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env.local
   ```

4. **Generate Prisma client**
   ```bash
   npx prisma generate
   ```

5. **Set up database**
   ```bash
   npx prisma db push
   npm run db:seed
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

## Database Management

### Prisma Studio
View and edit your data with Prisma Studio:
```bash
npm run db:studio
```

### Database Reset
Reset the database and reseed:
```bash
npx prisma db push --force-reset
npm run db:seed
```

### pgAdmin
Access the PostgreSQL admin interface at [http://localhost:8081](http://localhost:8081):
- Email: `admin@cardgame.com`
- Password: `admin123`

## Game Rules

### Partnership Structure
- **4-5 players**: 2 partners (1 bidder + 1 partner)
- **6+ players**: 3 partners (1 bidder + 2 partners)

### Scoring System
- **If bidder's team wins**:
  - Bidder gets: `bid amount + 100 points`
  - Partners get: `bid amount points each`
  - Non-partners get: `0 points`

- **If bidder's team loses**:
  - Bidder gets: `0 points`
  - Partners get: `0 points`
  - Non-partners get: `bid amount points each`

### Minimum Bid
- Minimum bid amount is 130 points

## API Endpoints

### Games
- `GET /api/games` - Get all games
- `GET /api/games/active` - Get active game
- `POST /api/games` - Create new game
- `GET /api/games/:id/totals` - Get game totals
- `POST /api/games/:id/matches` - Add match to game
- `PUT /api/games/:id/end` - End game

### Players
- `GET /api/players` - Get all players
- `POST /api/players` - Create new player

### Locations
- `GET /api/locations` - Get all locations
- `POST /api/locations` - Create new location

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with initial data

### Project Structure
```
250/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.js          # Root layout
│   └── page.js            # Home page
├── components/            # Reusable components
│   └── ui/               # UI components
├── lib/                   # Utility functions
│   ├── prisma.js         # Prisma client
│   └── utils.js          # Helper functions
├── prisma/               # Database schema and migrations
│   ├── schema.prisma     # Prisma schema
│   └── seed.js           # Database seed file
├── docker-compose.yml    # Docker services
├── setup.sh             # Setup script
└── README.md            # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

If you encounter any issues or have questions, please open an issue on GitHub.
