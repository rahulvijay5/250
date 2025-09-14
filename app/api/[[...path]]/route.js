import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Game state management endpoints
const gameRoutes = {
  // Get all games
  'GET /api/games': async () => {
    const games = await prisma.game.findMany({
      include: {
        players: {
          include: {
            player: true
          }
        },
        matches: {
          include: {
            bidder: true,
            partners: {
              include: {
                player: true
              }
            },
            scores: {
              include: {
                player: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ games });
  },

  // Get active game
  'GET /api/games/active': async () => {
    const activeGame = await prisma.game.findFirst({
      where: { isActive: true },
      include: {
        players: {
          include: {
            player: true
          }
        },
        matches: {
          include: {
            bidder: true,
            partners: {
              include: {
                player: true
              }
            },
            scores: {
              include: {
                player: true
              }
            }
          }
        }
      }
    });
    return NextResponse.json({ game: activeGame });
  },

  // Create new game
  'POST /api/games': async (request) => {
    const { location, players } = await request.json();
    
    // Deactivate any existing active games
    await prisma.game.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    });
    
    // Ensure location exists in database
    await prisma.location.upsert({
      where: { name: location },
      update: {},
      create: { name: location }
    });
    
    const partnerCount = players.length <= 5 ? 2 : 3; // 2 partners for 4-5 players, 3 for 6+
    
    const newGame = await prisma.game.create({
      data: {
        location,
        partnerCount,
        players: {
          create: players.map(player => ({
            playerId: player.id
          }))
        }
      },
      include: {
        players: {
          include: {
            player: true
          }
        }
      }
    });
    
    return NextResponse.json({ game: newGame });
  },

  // Add match to game
  'POST /api/games/:gameId/matches': async (request, gameId) => {
    const { bidder, partners, bidAmount, won } = await request.json();
    
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        players: {
          include: {
            player: true
          }
        }
      }
    });
    
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }
    
    const matchNumber = await prisma.match.count({
      where: { gameId }
    }) + 1;
    
    // Get all players in the game
    const allPlayers = game.players.map(gp => gp.player);
    const nonPartners = allPlayers.filter(p => 
      p.id !== bidder.id && !partners.some(partner => partner.id === p.id)
    );
    
    // Calculate scores
    const scores = [];
    if (won) {
      // Bidder gets bid + 100, partners get bid amount, non-partners get 0
      scores.push({ playerId: bidder.id, score: bidAmount + 100 });
      partners.forEach(partner => {
        scores.push({ playerId: partner.id, score: bidAmount });
      });
      nonPartners.forEach(player => {
        scores.push({ playerId: player.id, score: 0 });
      });
    } else {
      // Bidder and partners get 0, non-partners get bid amount
      scores.push({ playerId: bidder.id, score: 0 });
      partners.forEach(partner => {
        scores.push({ playerId: partner.id, score: 0 });
      });
      nonPartners.forEach(player => {
        scores.push({ playerId: player.id, score: bidAmount });
      });
    }
    
    const newMatch = await prisma.match.create({
      data: {
        gameId,
        matchNumber,
        bidderId: bidder.id,
        bidAmount,
        won,
        partners: {
          create: partners.map(partner => ({
            playerId: partner.id
          }))
        },
        scores: {
          create: scores
        }
      },
      include: {
        bidder: true,
        partners: {
          include: {
            player: true
          }
        },
        scores: {
          include: {
            player: true
          }
        }
      }
    });
    
    return NextResponse.json({ match: newMatch });
  },

  // Get game totals
  'GET /api/games/:gameId/totals': async (request, gameId) => {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        players: {
          include: {
            player: true
          }
        },
        matches: {
          include: {
            bidder: true,
            partners: {
              include: {
                player: true
              }
            },
            scores: {
              include: {
                player: true
              }
            }
          }
        }
      }
    });
    
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }
    
    const totals = {};
    
    // Initialize totals for all players
    game.players.forEach(gp => {
      totals[gp.player.id] = {
        player: gp.player,
        totalPoints: 0,
        matchesWon: 0,
        matchesLost: 0
      };
    });
    
    // Calculate totals from matches
    game.matches.forEach(match => {
      match.scores.forEach(score => {
        if (totals[score.player.id]) {
          totals[score.player.id].totalPoints += score.score;
          
          // Track wins/losses for bidder and partners
          const isBidderOrPartner = score.player.id === match.bidder.id || 
            match.partners.some(p => p.player.id === score.player.id);
          
          if (isBidderOrPartner) {
            if (match.won) {
              totals[score.player.id].matchesWon++;
            } else {
              totals[score.player.id].matchesLost++;
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
    await prisma.game.update({
      where: { id: gameId },
      data: { 
        isActive: false, 
        endedAt: new Date() 
      }
    });
    return NextResponse.json({ success: true });
  }
};

// Player management endpoints
const playerRoutes = {
  // Get all players
  'GET /api/players': async () => {
    const players = await prisma.player.findMany({
      orderBy: { name: 'asc' }
    });
    return NextResponse.json({ players });
  },

  // Create new player
  'POST /api/players': async (request) => {
    const { name } = await request.json();
    
    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'Player name must be at least 2 characters' }, { status: 400 });
    }
    
    // Check if player already exists
    const existingPlayer = await prisma.player.findFirst({
      where: { 
        name: {
          equals: name.trim(),
          mode: 'insensitive'
        }
      }
    });
    
    if (existingPlayer) {
      return NextResponse.json({ error: 'Player with this name already exists' }, { status: 409 });
    }
    
    const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name.trim())}`;
    
    const newPlayer = await prisma.player.create({
      data: {
        name: name.trim(),
        avatar: avatarUrl
      }
    });
    
    return NextResponse.json({ player: newPlayer });
  }
};

// Location management endpoints
const locationRoutes = {
  // Get all locations
  'GET /api/locations': async () => {
    const locations = await prisma.location.findMany({
      orderBy: { name: 'asc' }
    });
    
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
    
    // Check if location already exists
    const existingLocation = await prisma.location.findFirst({
      where: { 
        name: {
          equals: name.trim(),
          mode: 'insensitive'
        }
      }
    });
    
    if (existingLocation) {
      return NextResponse.json({ error: 'Location already exists' }, { status: 409 });
    }
    
    const newLocation = await prisma.location.create({
      data: {
        name: name.trim()
      }
    });
    
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
      if (segments[0] === 'games' && segments[1] && segments[2] === 'matches') {
        return await gameRoutes['POST /api/games/:gameId/matches'](request, segments[1]);
      }
      if (segments[0] === 'games' && segments[1] && segments[2] === 'end') {
        return await gameRoutes['PUT /api/games/:gameId/end'](request, segments[1]);
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