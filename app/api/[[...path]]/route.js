import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

let cachedClient = null;

async function connectToMongoDB() {
  if (cachedClient) {
    return cachedClient;
  }
  
  const client = new MongoClient(process.env.MONGO_URL);
  await client.connect();
  cachedClient = client;
  return client;
}

// Game state management endpoints
const gameRoutes = {
  // Get all games
  'GET /api/games': async () => {
    const client = await connectToMongoDB();
    const games = await client.db('cardgame').collection('games').find({}).toArray();
    return NextResponse.json({ games });
  },

  // Get active game
  'GET /api/games/active': async () => {
    const client = await connectToMongoDB();
    const activeGame = await client.db('cardgame').collection('games').findOne({ isActive: true });
    return NextResponse.json({ game: activeGame });
  },

  // Create new game
  'POST /api/games': async (request) => {
    const { location, players } = await request.json();
    
    const client = await connectToMongoDB();
    
    // Deactivate any existing active games
    await client.db('cardgame').collection('games').updateMany(
      { isActive: true },
      { $set: { isActive: false } }
    );
    
    const gameId = uuidv4();
    const partnerCount = players.length <= 5 ? 2 : 3; // 2 partners for 4-5 players, 3 for 6+
    
    const newGame = {
      id: gameId,
      location,
      date: new Date(),
      players,
      partnerCount,
      matches: [],
      isActive: true,
      createdAt: new Date()
    };
    
    await client.db('cardgame').collection('games').insertOne(newGame);
    return NextResponse.json({ game: newGame });
  },

  // Add match to game
  'POST /api/games/:gameId/matches': async (request, gameId) => {
    const { bidder, partners, bidAmount, won } = await request.json();
    
    const client = await connectToMongoDB();
    const game = await client.db('cardgame').collection('games').findOne({ id: gameId });
    
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }
    
    const matchId = uuidv4();
    const nonPartners = game.players.filter(p => p.id !== bidder.id && !partners.some(partner => partner.id === p.id));
    
    // Calculate scores
    const scores = {};
    if (won) {
      // Bidder gets bid + 100, partners get bid amount, non-partners get 0
      scores[bidder.id] = bidAmount + 100;
      partners.forEach(partner => {
        scores[partner.id] = bidAmount;
      });
      nonPartners.forEach(player => {
        scores[player.id] = 0;
      });
    } else {
      // Bidder and partners get 0, non-partners get bid amount
      scores[bidder.id] = 0;
      partners.forEach(partner => {
        scores[partner.id] = 0;
      });
      nonPartners.forEach(player => {
        scores[player.id] = bidAmount;
      });
    }
    
    const newMatch = {
      id: matchId,
      matchNumber: game.matches.length + 1,
      bidder,
      partners,
      nonPartners,
      bidAmount,
      won,
      scores,
      timestamp: new Date()
    };
    
    await client.db('cardgame').collection('games').updateOne(
      { id: gameId },
      { $push: { matches: newMatch } }
    );
    
    return NextResponse.json({ match: newMatch });
  },

  // Get game totals
  'GET /api/games/:gameId/totals': async (request, gameId) => {
    const client = await connectToMongoDB();
    const game = await client.db('cardgame').collection('games').findOne({ id: gameId });
    
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }
    
    const totals = {};
    game.players.forEach(player => {
      totals[player.id] = {
        player,
        totalPoints: 0,
        matchesWon: 0,
        matchesLost: 0
      };
    });
    
    game.matches.forEach(match => {
      Object.keys(match.scores).forEach(playerId => {
        if (totals[playerId]) {
          totals[playerId].totalPoints += match.scores[playerId];
          
          // Track wins/losses for bidder and partners
          if (playerId === match.bidder.id || match.partners.some(p => p.id === playerId)) {
            if (match.won) {
              totals[playerId].matchesWon++;
            } else {
              totals[playerId].matchesLost++;
            }
          }
        }
      });
    });
    
    const rankings = Object.values(totals).sort((a, b) => b.totalPoints - a.totalPoints);
    return NextResponse.json({ rankings, totalMatches: game.matches.length });
  },

  // End game
  'PUT /api/games/:gameId/end': async (request, gameId) => {
    const client = await connectToMongoDB();
    await client.db('cardgame').collection('games').updateOne(
      { id: gameId },
      { $set: { isActive: false, endedAt: new Date() } }
    );
    return NextResponse.json({ success: true });
  }
};

// Player management endpoints
const playerRoutes = {
  // Get all players
  'GET /api/players': async () => {
    const client = await connectToMongoDB();
    const players = await client.db('cardgame').collection('players').find({}).sort({ name: 1 }).toArray();
    return NextResponse.json({ players });
  },

  // Create new player
  'POST /api/players': async (request) => {
    const { name } = await request.json();
    
    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'Player name must be at least 2 characters' }, { status: 400 });
    }
    
    const client = await connectToMongoDB();
    
    // Check if player already exists
    const existingPlayer = await client.db('cardgame').collection('players').findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
    });
    
    if (existingPlayer) {
      return NextResponse.json({ error: 'Player with this name already exists' }, { status: 409 });
    }
    
    const playerId = uuidv4();
    const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name.trim())}`;
    
    const newPlayer = {
      id: playerId,
      name: name.trim(),
      avatar: avatarUrl,
      dateAdded: new Date()
    };
    
    await client.db('cardgame').collection('players').insertOne(newPlayer);
    return NextResponse.json({ player: newPlayer });
  }
};

// Location management endpoints
const locationRoutes = {
  // Get all locations
  'GET /api/locations': async () => {
    const client = await connectToMongoDB();
    const locations = await client.db('cardgame').collection('locations').find({}).sort({ name: 1 }).toArray();
    
    // Default locations
    const defaultLocations = ['Farmhouse', 'Atishay\'s Home', 'Tisha\'s Home'];
    const customLocations = locations.map(loc => loc.name);
    const allLocations = [...defaultLocations, ...customLocations];
    
    return NextResponse.json({ locations: allLocations });
  },

  // Add new location
  'POST /api/locations': async (request) => {
    const { name } = await request.json();
    
    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'Location name must be at least 2 characters' }, { status: 400 });
    }
    
    const client = await connectToMongoDB();
    
    // Check if location already exists
    const existingLocation = await client.db('cardgame').collection('locations').findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
    });
    
    if (existingLocation) {
      return NextResponse.json({ error: 'Location already exists' }, { status: 409 });
    }
    
    const locationId = uuidv4();
    const newLocation = {
      id: locationId,
      name: name.trim(),
      dateAdded: new Date()
    };
    
    await client.db('cardgame').collection('locations').insertOne(newLocation);
    return NextResponse.json({ location: newLocation });
  }
};

export async function GET(request, { params }) {
  try {
    const path = params?.path ? params.path.join('/') : '';
    const routeKey = `GET /api/${path}`;
    
    if (gameRoutes[routeKey]) {
      return await gameRoutes[routeKey](request);
    }
    
    if (playerRoutes[routeKey]) {
      return await playerRoutes[routeKey](request);
    }
    
    if (locationRoutes[routeKey]) {
      return await locationRoutes[routeKey](request);
    }
    
    // Handle parameterized routes
    if (path.includes('/')) {
      const segments = path.split('/');
      if (segments[0] === 'games' && segments[1] && segments[2] === 'totals') {
        return await gameRoutes['GET /api/games/:gameId/totals'](request, segments[1]);
      }
    }
    
    return NextResponse.json({ error: 'Route not found' }, { status: 404 });
  } catch (error) {
    console.error('GET Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const path = params?.path ? params.path.join('/') : '';
    const routeKey = `POST /api/${path}`;
    
    if (gameRoutes[routeKey]) {
      return await gameRoutes[routeKey](request);
    }
    
    if (playerRoutes[routeKey]) {
      return await playerRoutes[routeKey](request);
    }
    
    if (locationRoutes[routeKey]) {
      return await locationRoutes[routeKey](request);
    }
    
    // Handle parameterized routes
    if (path.includes('/')) {
      const segments = path.split('/');
      if (segments[0] === 'games' && segments[1] && segments[2] === 'matches') {
        return await gameRoutes['POST /api/games/:gameId/matches'](request, segments[1]);
      }
    }
    
    return NextResponse.json({ error: 'Route not found' }, { status: 404 });
  } catch (error) {
    console.error('POST Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const path = params?.path ? params.path.join('/') : '';
    
    // Handle parameterized routes
    if (path.includes('/')) {
      const segments = path.split('/');
      if (segments[0] === 'games' && segments[1] && segments[2] === 'end') {
        return await gameRoutes['PUT /api/games/:gameId/end'](request, segments[1]);
      }
    }
    
    return NextResponse.json({ error: 'Route not found' }, { status: 404 });
  } catch (error) {
    console.error('PUT Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}