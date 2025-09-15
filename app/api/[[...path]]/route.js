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
          },
          orderBy: { matchNumber: 'desc' },
          take: 5
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
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

  // Get specific game by ID
  'GET /api/games/:gameId': async (request, gameId) => {
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
    
    return NextResponse.json({ game });
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
    const { bidder, partners, bidAmount, won, currentPlayers } = await request.json();
    
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
    
    // Use current players if provided, otherwise fall back to original game players
    const allPlayers = currentPlayers || game.players.map(gp => gp.player);
    const nonPartners = allPlayers.filter(p => 
      p.id !== bidder.id && !partners.some(partner => partner.id === p.id)
    );
    
    // Calculate scores
    const scores = [];
    if (won) {
      if (partners.length === 0) {
        // Solo player case: bidder gets bid amount only (not bid + 100)
        scores.push({ playerId: bidder.id, score: bidAmount });
        nonPartners.forEach(player => {
          scores.push({ playerId: player.id, score: 0 });
        });
      } else {
        // Normal case: bidder gets bid + 100, partners get bid amount, non-partners get 0
        scores.push({ playerId: bidder.id, score: bidAmount + 100 });
        partners.forEach(partner => {
          scores.push({ playerId: partner.id, score: bidAmount });
        });
        nonPartners.forEach(player => {
          scores.push({ playerId: player.id, score: 0 });
        });
      }
    } else {
      // Bidder and partners get 0, each non-partner gets full bid amount
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
          },
          orderBy: { matchNumber: 'desc' },
          take: 15
        }
      }
    });
    
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }
    
    // Get all unique players who have ever participated in this game
    const allPlayerIds = new Set();
    
    // Add players from game setup
    game.players.forEach(gp => {
      allPlayerIds.add(gp.player.id);
    });
    
    // Add players from all matches (bidder, partners, and anyone who scored)
    game.matches.forEach(match => {
      allPlayerIds.add(match.bidder.id);
      match.partners.forEach(p => allPlayerIds.add(p.player.id));
      match.scores.forEach(score => allPlayerIds.add(score.player.id));
    });
    
    // Fetch all unique players
    const allPlayers = await prisma.player.findMany({
      where: {
        id: {
          in: Array.from(allPlayerIds)
        }
      }
    });
    
    const totals = {};
    
    // Initialize totals for all players who have ever participated
    allPlayers.forEach(player => {
      totals[player.id] = {
        player: player,
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

          const isOnBidderTeam = score.player.id === match.bidder.id ||
            match.partners.some(p => p.player.id === score.player.id);
          const isOnChallengerTeam = !isOnBidderTeam; // all others in the match

          const playerWon = (match.won && isOnBidderTeam) || (!match.won && isOnChallengerTeam);
          if (playerWon) {
            totals[score.player.id].matchesWon++;
          } else {
            totals[score.player.id].matchesLost++;
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
      orderBy: { name: 'asc' },
      take: 50
    });
    return NextResponse.json({ players });
  },

  // Create new player
  'POST /api/players': async (request) => {
    const { name } = await request.json();
    
    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'Player name must be at least 2 characters' }, { status: 400 });
    }
    
    // Capitalize name properly
    const capitalizeName = (str) => {
      return str.trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    };
    
    const capitalizedName = capitalizeName(name);
    
    // Check if player already exists
    const existingPlayer = await prisma.player.findFirst({
      where: { 
        name: {
          equals: capitalizedName,
          mode: 'insensitive'
        }
      }
    });
    
    if (existingPlayer) {
      return NextResponse.json({ error: 'Player with this name already exists' }, { status: 409 });
    }
    
    const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(capitalizedName)}`;
    
    const newPlayer = await prisma.player.create({
      data: {
        name: capitalizedName,
        avatar: avatarUrl
      }
    });
    
    return NextResponse.json({ player: newPlayer });
  },

  // Get player statistics
  'GET /api/players/:playerId/stats': async (request, playerId) => {
    try {
      // Get all matches where this player participated
      const matches = await prisma.match.findMany({
        where: {
          OR: [
            { bidderId: playerId },
            { 
              partners: {
                some: { playerId: playerId }
              }
            },
            {
              scores: {
                some: { playerId: playerId }
              }
            }
          ]
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
          },
          game: {
            select: {
              location: true,
              date: true
            }
          }
        },
        orderBy: { timestamp: 'desc' }
      });

      // Get player info
      const player = await prisma.player.findUnique({
        where: { id: playerId }
      });

      if (!player) {
        return NextResponse.json({ error: 'Player not found' }, { status: 404 });
      }

      // Calculate statistics
      const totalMatches = matches.length;
      const matchesAsBidder = matches.filter(match => match.bidderId === playerId).length;
      const matchesAsPartner = matches.filter(match => 
        match.partners.some(p => p.playerId === playerId)
      ).length;
      
      const wonMatches = matches.filter(match => {
        const isBidderOrPartner = match.bidderId === playerId || 
          match.partners.some(p => p.playerId === playerId);
        return isBidderOrPartner && match.won;
      }).length;
      
      const lostMatches = matches.filter(match => {
        const isBidderOrPartner = match.bidderId === playerId || 
          match.partners.some(p => p.playerId === playerId);
        return isBidderOrPartner && !match.won;
      }).length;

      const totalPoints = matches.reduce((total, match) => {
        const playerScore = match.scores.find(score => score.playerId === playerId);
        return total + (playerScore ? playerScore.score : 0);
      }, 0);

      const averagePoints = totalMatches > 0 ? Math.round(totalPoints / totalMatches) : 0;

      // Calculate win rate
      const winRate = totalMatches > 0 ? Math.round((wonMatches / totalMatches) * 100) : 0;

      // Get highest bid
      const highestBid = Math.max(...matches
        .filter(match => match.bidderId === playerId)
        .map(match => match.bidAmount), 0);

      // Get most played location
      const locationCounts = {};
      matches.forEach(match => {
        const location = match.game.location;
        locationCounts[location] = (locationCounts[location] || 0) + 1;
      });
      const mostPlayedLocation = Object.keys(locationCounts).reduce((a, b) => 
        locationCounts[a] > locationCounts[b] ? a : b, 'N/A'
      );

      // Get recent performance (last 5 matches where player was bidder/partner)
      const recentMatches = matches.filter(match => {
        const isBidderOrPartner = match.bidderId === playerId || 
          match.partners.some(p => p.playerId === playerId);
        return isBidderOrPartner;
      }).slice(0, 5);
      
      const recentWins = recentMatches.filter(match => match.won).length;

      // 250 bid attempts and wins (as bidder only)
      const bids250 = matches.filter(m => m.bidderId === playerId && m.bidAmount === 250).length;
      const bids250Won = matches.filter(m => m.bidderId === playerId && m.bidAmount === 250 && m.won).length;

      const stats = {
        player,
        totalMatches,
        matchesAsBidder,
        matchesAsPartner,
        wonMatches,
        lostMatches,
        totalPoints,
        averagePoints,
        winRate,
        highestBid,
        mostPlayedLocation,
        bids250,
        bids250Won,
        recentPerformance: {
          matches: recentMatches.length,
          wins: recentWins,
          winRate: recentMatches.length > 0 ? Math.round((recentWins / recentMatches.length) * 100) : 0
        },
        matches: matches.slice(0, 10).map(match => {
          const isBidder = match.bidderId === playerId;
          const isPartner = match.partners.some(p => p.playerId === playerId);
          const role = isBidder ? 'BIDDER' : (isPartner ? 'PARTNER' : 'NON_PARTNER');
          return ({
            id: match.id,
            matchNumber: match.matchNumber,
            bidder: match.bidder.name,
            partners: match.partners.map(p => p.player.name),
            bidAmount: match.bidAmount,
            won: match.won,
            role,
            playerScore: match.scores.find(s => s.playerId === playerId)?.score || 0,
            location: match.game.location,
            date: match.timestamp
          });
        })
      };

      return NextResponse.json({ stats });
    } catch (error) {
      console.error('Error fetching player stats:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
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
    const defaultLocations = ['Farmhouse', 'Rahul\'s Home', 'Tisha\'s Home'];
    const customLocations = locations.map(loc => loc.name);
    
    // Combine and remove duplicates
    const allLocations = [...new Set([...defaultLocations, ...customLocations])];
    
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
      if (segments[0] === 'games' && segments[1] && !segments[2]) {
        return await gameRoutes['GET /api/games/:gameId'](request, segments[1]);
      }
      if (segments[0] === 'players' && segments[1] && segments[2] === 'stats') {
        return await playerRoutes['GET /api/players/:playerId/stats'](request, segments[1]);
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