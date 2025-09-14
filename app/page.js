'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Plus, Users, Trophy, FileText, Settings, ArrowLeft, Crown, Target, Gamepad2 } from 'lucide-react';
import Confetti from 'react-confetti';
import { useRouter } from 'next/navigation';

// Game Context for state management
const GameContext = createContext();

const GameProvider = ({ children }) => {
  const [currentScreen, setCurrentScreen] = useState('setup');
  const [gameData, setGameData] = useState(null);
  const [players, setPlayers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');

  return (
    <GameContext.Provider value={{
      currentScreen, setCurrentScreen,
      gameData, setGameData,
      players, setPlayers,
      locations, setLocations,
      selectedPlayers, setSelectedPlayers,
      selectedLocation, setSelectedLocation
    }}>
      {children}
    </GameContext.Provider>
  );
};

const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
};

// Game Setup Screen
const GameSetupScreen = () => {
  const { setCurrentScreen, locations, setLocations, selectedLocation, setSelectedLocation } = useGame();
  const [newLocationName, setNewLocationName] = useState('');
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/locations');
      const data = await response.json();
      setLocations(data.locations || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const handleAddLocation = async () => {
    if (!newLocationName.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newLocationName })
      });
      
      if (response.ok) {
        await fetchLocations();
        setSelectedLocation(newLocationName);
        setNewLocationName('');
        setShowAddLocation(false);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add location');
      }
    } catch (error) {
      console.error('Error adding location:', error);
      alert('Failed to add location');
    }
    setLoading(false);
  };

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
  };

  const handleContinue = () => {
    if (selectedLocation) {
      setCurrentScreen('playerSelection');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-900 p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center text-white mb-8">
          <h1 className="text-3xl font-bold mb-2">250 Card Game</h1>
          <p className="text-green-200">Setup New Game</p>
        </div>

        <Card className="bg-white/95 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Game Setup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-sm font-medium mb-3 block">Choose Location</Label>
              <div className="grid grid-cols-1 gap-2">
                {locations.map((location) => (
                  <Button
                    key={location}
                    variant={selectedLocation === location ? "default" : "outline"}
                    className={`w-full justify-start ${
                      selectedLocation === location 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleLocationSelect(location)}
                  >
                    {location}
                  </Button>
                ))}
                
                {!showAddLocation ? (
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-500 hover:text-gray-700"
                    onClick={() => setShowAddLocation(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Location
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter location name"
                      value={newLocationName}
                      onChange={(e) => setNewLocationName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddLocation()}
                    />
                    <Button 
                      onClick={handleAddLocation} 
                      disabled={loading || !newLocationName.trim()}
                      size="sm"
                    >
                      Add
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => setShowAddLocation(false)}
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <Button 
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={handleContinue}
              disabled={!selectedLocation}
            >
              Continue to Player Selection
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Player Selection Screen
const PlayerSelectionScreen = () => {
  const { setCurrentScreen, players, setPlayers, selectedPlayers, setSelectedPlayers } = useGame();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const response = await fetch('/api/players');
      const data = await response.json();
      setPlayers(data.players || []);
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  const handleAddPlayer = async () => {
    if (!newPlayerName.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPlayerName })
      });
      
      if (response.ok) {
        const result = await response.json();
        await fetchPlayers();
        setSelectedPlayers([...selectedPlayers, result.player]);
        setNewPlayerName('');
        setShowAddPlayer(false);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add player');
      }
    } catch (error) {
      console.error('Error adding player:', error);
      alert('Failed to add player');
    }
    setLoading(false);
  };

  const togglePlayerSelection = (player) => {
    setSelectedPlayers(prev => {
      const isSelected = prev.some(p => p.id === player.id);
      if (isSelected) {
        return prev.filter(p => p.id !== player.id);
      } else {
        return [...prev, player];
      }
    });
  };

  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleContinue = () => {
    if (selectedPlayers.length >= 4) {
      setCurrentScreen('partnershipConfirmation');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-900 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between text-white">
          <Button
            variant="ghost"
            className="text-white hover:bg-white/20"
            onClick={() => setCurrentScreen('setup')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="text-center">
            <h1 className="text-2xl font-bold">Select Players</h1>
            <p className="text-green-200">{selectedPlayers.length} players selected</p>
          </div>
          <div className="w-20"></div>
        </div>

        <Card className="bg-white/95 shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Players
              </CardTitle>
              <Dialog open={showAddPlayer} onOpenChange={setShowAddPlayer}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Player
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Player</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Enter player name"
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
                    />
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setShowAddPlayer(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddPlayer} disabled={loading || !newPlayerName.trim()}>
                        Add Player
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search players..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              {filteredPlayers.map((player) => {
                const isSelected = selectedPlayers.some(p => p.id === player.id);
                return (
                  <div
                    key={player.id}
                    className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                      isSelected 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => togglePlayerSelection(player)}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={player.avatar} alt={player.name} />
                        <AvatarFallback>{player.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-center">{player.name}</span>
                      {isSelected && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Selected
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Button 
          className="w-full bg-green-600 hover:bg-green-700"
          onClick={handleContinue}
          disabled={selectedPlayers.length < 4}
        >
          Continue ({selectedPlayers.length >= 4 ? 'Ready' : `Need ${4 - selectedPlayers.length} more players`})
        </Button>
      </div>
    </div>
  );
};

// Partnership Confirmation Screen
const PartnershipConfirmationScreen = () => {
  const { setCurrentScreen, selectedPlayers, setGameData, selectedLocation } = useGame();
  const [customPartnerCount, setCustomPartnerCount] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const defaultPartnerCount = selectedPlayers.length <= 5 ? 2 : 3;
  const nonPartnerCount = selectedPlayers.length - defaultPartnerCount;
  const maxPartners = Math.floor(selectedPlayers.length / 2);

  const handleConfirm = async (partnerCount = defaultPartnerCount) => {
    try {
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: selectedLocation,
          players: selectedPlayers
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setGameData(result.game);
        setCurrentScreen('mainGame');
      } else {
        alert('Failed to create game');
      }
    } catch (error) {
      console.error('Error creating game:', error);
      alert('Failed to create game');
    }
  };

  const isValidCustomCount = () => {
    const count = parseInt(customPartnerCount);
    return count >= 2 && count <= maxPartners;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-900 p-4">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center justify-between text-white">
          <Button
            variant="ghost"
            className="text-white hover:bg-white/20"
            onClick={() => setCurrentScreen('playerSelection')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Partnership Setup</h1>
          <div className="w-20"></div>
        </div>

        <Card className="bg-white/95 shadow-xl">
          <CardHeader>
            <CardTitle className="text-center text-xl">Team Structure</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Player Count Display */}
            <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl border-2 border-blue-200">
              <div className="text-4xl font-bold text-blue-600 mb-2">{selectedPlayers.length}</div>
              <p className="text-lg font-medium text-gray-700">Total Players</p>
            </div>

            {/* Default Partnership Structure */}
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Recommended Structure</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-100 rounded-lg border-2 border-green-300">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Users className="w-6 h-6 text-green-600" />
                      <span className="text-2xl font-bold text-green-600">{defaultPartnerCount}</span>
                    </div>
                    <p className="text-sm font-medium text-green-800">Partners</p>
                    <p className="text-xs text-green-600">1 bidder + {defaultPartnerCount - 1} partner{defaultPartnerCount > 2 ? 's' : ''}</p>
                  </div>
                  <div className="p-4 bg-gray-100 rounded-lg border-2 border-gray-300">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Users className="w-6 h-6 text-gray-600" />
                      <span className="text-2xl font-bold text-gray-600">{nonPartnerCount}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-800">Non-partners</p>
                    <p className="text-xs text-gray-600">Challengers</p>
                  </div>
                </div>
              </div>

              <Button 
                className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg"
                onClick={() => handleConfirm()}
              >
                ✓ Let's Go!
              </Button>
            </div>

            {/* Custom Partnership Option */}
            <div className="border-t pt-4">
              <Button 
                variant="ghost"
                className="w-full text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                onClick={() => setShowCustom(!showCustom)}
              >
                {showCustom ? 'Hide Custom Options' : 'Customize Partnership Count'}
              </Button>

              {showCustom && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Number of partners (including bidder)
                    </Label>
                    <p className="text-xs text-gray-500 mb-2">
                      Must be between 2 and {maxPartners} (max half of total players)
                    </p>
                    <Input
                      type="number"
                      min="2"
                      max={maxPartners}
                      value={customPartnerCount}
                      onChange={(e) => setCustomPartnerCount(e.target.value)}
                      placeholder="Enter number"
                      className="text-center text-lg"
                    />
                    {customPartnerCount && !isValidCustomCount() && (
                      <p className="text-xs text-red-500 mt-1">
                        Must be between 2 and {maxPartners}
                      </p>
                    )}
                  </div>
                  
                  {customPartnerCount && isValidCustomCount() && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>{customPartnerCount} partners</strong> vs <strong>{selectedPlayers.length - parseInt(customPartnerCount)} non-partners</strong>
                      </p>
                    </div>
                  )}
                  
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleConfirm(parseInt(customPartnerCount))}
                    disabled={!isValidCustomCount()}
                  >
                    ✓ Use Custom Structure
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Main Game Screen
const MainGameScreen = () => {
  const { setCurrentScreen, gameData, selectedPlayers } = useGame();

  const menuItems = [
    {
      title: 'Modify Players',
      description: 'Add/remove players',
      icon: <Users className="w-5 h-5" />,
      action: () => setCurrentScreen('modifyPlayers')
    },
    {
      title: 'View Totals',
      description: 'Current standings',
      icon: <Trophy className="w-5 h-5" />,
      action: () => setCurrentScreen('viewTotals')
    },
    {
      title: 'End Game',
      description: 'Finalize & export',
      icon: <FileText className="w-5 h-5" />,
      action: () => setCurrentScreen('endGame')
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-900 p-4">
      <div className="max-w-2xl mx-auto space-y-6 flex flex-col h-[90vh] justify-between">
        <div className="text-center text-white">
          <h1 className="text-3xl font-bold mb-2">250 Card Game</h1>
          <p className="text-green-200">
            {/* {selectedPlayers.length} Players • {gameData?.matches?.length || 0} Matches Played */}
            {selectedPlayers.length} Players
          </p>
        </div>

        {/* Main New Match Button */}
        <div className="flex justify-center mb-8">
          <Button
            onClick={() => setCurrentScreen('newMatch')}
            className="w-64 h-64 rounded-2xl bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-2xl transform hover:scale-105 transition-all duration-200"
          >
            <div className="flex flex-col items-center space-y-2">
              <Plus className="w-12 h-12" />
              <span className="text-lg font-bold">New Match</span>
            </div>
          </Button>
        </div>

        {/* Other Menu Items */}
        <div className="flex justify-between gap-4">
          {menuItems.map((item, index) => (
            <Button
              key={index}
              variant="ghost"
              className="flex-1 h-16 bg-white/10 hover:bg-white/20 text-white border border-white/20"
              onClick={item.action}
            >
              <div className="flex flex-col items-center space-y-2">
                {item.icon}
                <span className="text-xs font-medium">{item.title}</span>
              </div>
            </Button>
          ))}
        </div>

        {gameData?.matches && gameData.matches.length > 0 && (
          <Card className="bg-white/95 shadow-xl">
            <CardHeader>
              <CardTitle>Recent Matches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {gameData.matches.slice(-3).reverse().map((match, index) => (
                  <div key={match.id} className="flex items-center justify-between p-3 bg-green-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">Match {match.matchNumber}</Badge>
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-yellow-600" />
                        <span className="font-medium">{match.bidder.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      <span className="font-bold">{match.bidAmount}</span>
                      <Badge className={match.won ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {match.won ? 'WON' : 'LOST'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

// New Match Screen - Simplified for now
const NewMatchScreen = () => {
  const { setCurrentScreen, gameData, selectedPlayers } = useGame();
  const [step, setStep] = useState('bidder'); // bidder -> partners -> bid -> result
  const [selectedBidder, setSelectedBidder] = useState(null);
  const [selectedPartners, setSelectedPartners] = useState([]);
  const [bidAmount, setBidAmount] = useState('');
  const [loading, setLoading] = useState(false);

  // Dynamic partner count based on current player count
  const getPartnerCount = (playerCount) => {
    if (playerCount < 4) return 1; // 1 partner for 4 players
    if (playerCount < 6) return 2; // 2 partners for 5-6 players  
    return 3; // 3 partners for 7+ players
  };
  
  const partnerCount = getPartnerCount(selectedPlayers.length);
  const requiredPartners = partnerCount - 1; // Excluding bidder

  const availablePartners = selectedPlayers.filter(p => p.id !== selectedBidder?.id);

  const handleBidderSelect = (player) => {
    setSelectedBidder(player);
    setSelectedPartners([]); // Reset partners when bidder changes
    setStep('partners');
  };

  const togglePartnerSelection = (player) => {
    setSelectedPartners(prev => {
      const isSelected = prev.some(p => p.id === player.id);
      if (isSelected) {
        return prev.filter(p => p.id !== player.id);
      } else if (prev.length < requiredPartners) {
        const newPartners = [...prev, player];
        // Auto-advance when required partners are selected
        if (newPartners.length === requiredPartners) {
          setTimeout(() => setStep('bid'), 300);
        }
        return newPartners;
      }
      return prev;
    });
  };

  // Reset state when going back to bidder selection
  const handleBackToBidder = () => {
    setSelectedBidder(null);
    setSelectedPartners([]);
    setStep('bidder');
  };

  const handleResult = async (won) => {
    if (!selectedBidder || !bidAmount) return;
    // Allow solo player (0 partners) or exact required partners
    if (selectedPartners.length !== 0 && selectedPartners.length !== requiredPartners) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/games/${gameData.id}/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bidder: selectedBidder,
          partners: selectedPartners,
          bidAmount: parseInt(bidAmount),
          won
        })
      });

      if (response.ok) {
        // // Refresh game data to get updated match count
        // const gameResponse = await fetch(`/api/games/${gameData.id}`);
        // if (gameResponse.ok) {
        //   const gameData = await gameResponse.json();
        //   setGameData(gameData.game);
        // }
        setCurrentScreen('mainGame');
      } else {
        alert('Failed to record match');
      }
    } catch (error) {
      console.error('Error recording match:', error);
      alert('Failed to record match');
    }
    setLoading(false);
  };

  if (step === 'bidder') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-900 p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between text-white">
            <Button
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={() => setCurrentScreen('mainGame')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {/* Back */}
            </Button>
            <h1 className="text-2xl font-bold">Select Bidder</h1>
            <div className="w-20"></div>
          </div>

          <Card className="bg-white/95 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-600" />
                Who is the bidder?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {selectedPlayers.map((player) => (
                  <div
                    key={player.id}
                    className="cursor-pointer p-4 rounded-lg border-2 border-gray-200 hover:border-yellow-400 transition-all"
                    onClick={() => handleBidderSelect(player)}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={player.avatar} alt={player.name} />
                        <AvatarFallback>{player.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-center">{player.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (step === 'partners') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-900 p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between text-white">
            <Button
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={handleBackToBidder}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold">Select Partners</h1>
            <div className="w-20"></div>
          </div>

          <Card className="bg-white/95 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Select {requiredPartners} partner{requiredPartners > 1 ? 's' : ''} for {selectedBidder?.name}
              </CardTitle>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{selectedPartners.length}/{requiredPartners} selected</span>
                <div className="flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    {selectedPlayers.length} players
                  </span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                    {partnerCount} total partners
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {availablePartners.map((player) => {
                  const isSelected = selectedPartners.some(p => p.id === player.id);
                  return (
                    <div
                      key={player.id}
                      className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50' 
                          : selectedPartners.length >= requiredPartners
                          ? 'border-gray-200 opacity-50 cursor-not-allowed'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                      onClick={() => togglePartnerSelection(player)}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={player.avatar} alt={player.name} />
                          <AvatarFallback>{player.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-center">{player.name}</span>
                        {isSelected && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            Partner
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Only One Partner Button */}
              <div className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                  onClick={() => setStep('bid')}
                >
                  {requiredPartners === 1 ? 'Skip Partner' : 'Only One Partner'}
                </Button>
                <p className="text-xs text-gray-500 mt-1">
                  {requiredPartners === 1 
                    ? 'Proceed with just the bidder (no partners needed)'
                    : 'Skip partner selection and proceed with just the bidder'
                  }
                </p>
              </div>
              </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (step === 'bid') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-900 p-4">
        <div className="max-w-md mx-auto space-y-6">
          <div className="flex items-center justify-between text-white">
            <Button
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={() => setStep('partners')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold">Enter Bid</h1>
            <div className="w-20"></div>
          </div>

          <Card className="bg-white/95 shadow-xl">
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Target className="w-5 h-5 text-green-600" />
      Bid Amount
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-6">
    <div className="text-center p-4 bg-gray-50 rounded-lg">
      <p className="text-sm text-gray-600 mb-2">Team:</p>
      <div className="flex flex-wrap justify-center gap-2">
        <Badge className="bg-yellow-100 text-yellow-800">
          {selectedBidder?.name} (Bidder)
        </Badge>
        {selectedPartners.length > 0 ? (
          selectedPartners.map(partner => (
            <Badge key={partner.id} className="bg-blue-100 text-blue-800">
              {partner.name}
            </Badge>
          ))
        ) : (
          <Badge className="bg-gray-100 text-gray-600">
            Solo Player
          </Badge>
        )}
      </div>
    </div>

    <div>
      <Label htmlFor="bid">Bid Amount (130-250, multiples of 5)</Label>
      <Input
        id="bid"
        type="number"
        min="130"
        max="250"
        step="5"
        value={bidAmount}
        onChange={(e) => {
          const value = e.target.value;
          
          // Allow empty string for clearing
          if (value === '') {
            setBidAmount('');
            return;
          }
          
          // Allow partial input while typing (don't constrain until blur or complete)
          const num = parseInt(value);
          if (isNaN(num)) return;
          
          // Only apply constraints if the number is complete (3 digits for this range)
          // or if user is trying to go beyond reasonable bounds
          if (num > 999) return; // Prevent unreasonably large numbers
          if (num < 0) return;   // Prevent negative numbers
          
          setBidAmount(value);
        }}
        onBlur={(e) => {
          // Apply rounding and constraints only when user finishes editing
          const value = e.target.value;
          if (value === '') return;
          
          let num = parseInt(value);
          if (isNaN(num)) return;
          
          // Round to nearest 5
          num = Math.round(num / 5) * 5;
          // Apply min/max constraints
          num = Math.max(130, Math.min(250, num));
          
          setBidAmount(num.toString());
        }}
        placeholder="Enter bid amount"
        className="mt-1 text-lg text-center"
      />
      {bidAmount && !isNaN(parseInt(bidAmount)) && (
        <p className="text-sm text-gray-500 mt-1 text-center">
          {(() => {
            const num = parseInt(bidAmount);
            const rounded = Math.round(num / 5) * 5;
            const constrained = Math.max(130, Math.min(250, rounded));
            
            if (num !== constrained) {
              return `Will be adjusted to: ${constrained} points`;
            } else if (num !== rounded) {
              return `Will be rounded to: ${rounded} points`;
            } else if (num >= 130 && num <= 250) {
              return `Valid bid: ${num} points ✓`;
            }
            return '';
          })()}
        </p>
      )}
    </div>

    {/* Default Bid Buttons */}
    <div>
      <Label className="text-sm font-medium mb-3 block">Quick Select</Label>
      <div className="grid grid-cols-4 gap-2">
        {(() => {
          const playerCount = selectedPlayers.length;
          const bids = [];
          
          if (playerCount === 4) {
            for (let i = 130; i <= 180; i += 5) bids.push(i);
          } else if (playerCount === 5) {
            for (let i = 140; i <= 190; i += 5) bids.push(i);
          } else if (playerCount === 6) {
            for (let i = 150; i <= 220; i += 5) bids.push(i);
          } else {
            for (let i = 160; i <= 220; i += 5) bids.push(i);
            bids.push(250);
          }
          return bids;
        })().map((amount) => (
          <Button
            key={amount}
            variant={bidAmount === amount.toString() ? "default" : "outline"}
            size="sm"
            className={`text-xs ${
              bidAmount === amount.toString() 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'hover:bg-gray-50'
            }`}
            onClick={() => setBidAmount(amount.toString())}
          >
            {amount}
          </Button>
        ))}
      </div>
    </div>

    <Button 
      className="w-full bg-green-600 hover:bg-green-700"
      onClick={() => setStep('result')}
      disabled={(() => {
        if (!bidAmount) return true;
        const num = parseInt(bidAmount);
        if (isNaN(num)) return true;
        const rounded = Math.round(num / 5) * 5;
        const constrained = Math.max(130, Math.min(250, rounded));
        return constrained < 130 || constrained > 250;
      })()}
    >
      Continue to Result
    </Button>
  </CardContent>
</Card>
        </div>
      </div>
    );
  }

  if (step === 'result') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-900 p-4">
        <div className="max-w-md mx-auto space-y-6">
          <div className="flex items-center justify-between text-white">
            <Button
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={() => setStep('bid')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {/* Back */}
            </Button>
            <h1 className="text-2xl font-bold">Match Result</h1>
            <div className="w-20"></div>
          </div>

          <Card className="bg-white/95 shadow-xl">
            <CardHeader>
              <CardTitle className="text-center">Did the team achieve their bid?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg space-y-2 flex flex-col w-full items-center justify-center">
                <div className=" flex-col items-center justify-center gap-2 flex w-full">
                  <Target className="w-12 h-12 opacity-50" />
                  <span className="font-bold text-2xl">{bidAmount} points</span>
                </div>
                <div className="text-sm text-gray-600">
                  Team: {selectedBidder?.name}{selectedPartners.length > 0 ? ' + ' + selectedPartners.map(p => p.name).join(', ') : ' (Solo)'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button 
                  className="bg-green-600 hover:bg-green-700 h-16 text-lg"
                  onClick={() => handleResult(true)}
                  disabled={loading}
                >
                  <div className="text-center">
                    <div className="font-bold">WON</div>
                    <div className="text-xs opacity-90">Team gets points</div>
                  </div>
                </Button>
                
                <Button 
                  className="bg-red-600 hover:bg-red-700 h-16 text-lg"
                  onClick={() => handleResult(false)}
                  disabled={loading}
                >
                  <div className="text-center">
                    <div className="font-bold">LOST</div>
                    <div className="text-xs opacity-90">Others get points</div>
                  </div>
                </Button>
              </div>

              {loading && (
                <div className="text-center text-gray-500">
                  Recording match result...
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
};

// Modify Players Screen
const ModifyPlayersScreen = () => {
  const { setCurrentScreen, selectedPlayers, setSelectedPlayers, players, setPlayers } = useGame();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const response = await fetch('/api/players');
      const data = await response.json();
      setPlayers(data.players || []);
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  const handleAddPlayer = async () => {
    if (!newPlayerName.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPlayerName })
      });
      
      if (response.ok) {
        const result = await response.json();
        await fetchPlayers();
        setNewPlayerName('');
        setShowAddPlayer(false);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add player');
      }
    } catch (error) {
      console.error('Error adding player:', error);
      alert('Failed to add player');
    }
    setLoading(false);
  };

  const togglePlayerSelection = (player) => {
    setSelectedPlayers(prev => {
      const isSelected = prev.some(p => p.id === player.id);
      if (isSelected) {
        return prev.filter(p => p.id !== player.id);
      } else {
        return [...prev, player];
      }
    });
  };

  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-900 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between text-white">
          <Button
            variant="ghost"
            className="text-white hover:bg-white/20"
            onClick={() => setCurrentScreen('mainGame')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="text-center">
            <h1 className="text-2xl font-bold">Modify Players</h1>
            <p className="text-green-200">{selectedPlayers.length} players in game</p>
          </div>
          <div className="w-20"></div>
        </div>

        <Card className="bg-white/95 shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Players
              </CardTitle>
              <Dialog open={showAddPlayer} onOpenChange={setShowAddPlayer}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Player
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Player</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Enter player name"
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
                    />
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setShowAddPlayer(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddPlayer} disabled={loading || !newPlayerName.trim()}>
                        Add Player
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search players..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="max-h-96 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              {filteredPlayers.map((player) => {
                const isSelected = selectedPlayers.some(p => p.id === player.id);
                return (
                  <div
                    key={player.id}
                    className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                      isSelected 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => togglePlayerSelection(player)}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={player.avatar} alt={player.name} />
                        <AvatarFallback>{player.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-center">{player.name}</span>
                      {isSelected && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          In Game
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button 
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={() => setCurrentScreen('mainGame')}
            disabled={selectedPlayers.length < 4}
          >
            Save Changes ({selectedPlayers.length >= 4 ? 'Ready' : `Need ${4 - selectedPlayers.length} more players`})
          </Button>
        </div>
      </div>
    </div>
  );
};

const ViewTotalsScreen = () => {
  const { setCurrentScreen, gameData, selectedPlayers } = useGame();
  const [rankings, setRankings] = useState([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMatchHistory, setShowMatchHistory] = useState(false);

  useEffect(() => {
    if (gameData?.id) {
      fetchTotals();
    }
  }, [gameData?.id, selectedPlayers]);

  const fetchTotals = async () => {
    setLoading(true);
    try {
      // Fetch both totals and full game data with matches
      const [totalsResponse, gameResponse] = await Promise.all([
        fetch(`/api/games/${gameData.id}/totals`),
        fetch(`/api/games/${gameData.id}`)
      ]);
      
      if (totalsResponse.ok) {
        const totalsData = await totalsResponse.json();
        setRankings(totalsData.rankings || []);
        setTotalMatches(totalsData.totalMatches || 0);
      } else {
        console.error('Failed to fetch totals');
      }
      
      if (gameResponse.ok) {
        const gameDataResponse = await gameResponse.json();
        // Store matches in local state instead of updating context
        setMatches(gameDataResponse.game?.matches || []);
      } else {
        console.error('Failed to fetch game data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-900 p-4 flex items-center justify-center">
        <Card className="bg-white/95 shadow-xl max-w-md w-full">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading totals...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-900 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between text-white">
          <Button
            variant="ghost"
            className="text-white hover:bg-white/20"
            onClick={() => setCurrentScreen('mainGame')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="text-center">
            <h1 className="text-2xl font-bold">Current Standings</h1>
            <p className="text-green-200">{totalMatches} matches played</p>
          </div>
          <div className="w-20"></div>
        </div>

        <Card className="bg-white/95 shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-600" />
                Player Rankings
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMatchHistory(!showMatchHistory)}
              >
                {showMatchHistory ? 'Hide History' : 'Show History'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {rankings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No matches played yet</p>
                <p className="text-sm">Start a new match to see rankings</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rankings.map((entry, index) => {
                  const isLast = index === rankings.length - 1;
                  return (
                    <div
                      key={entry.player.id}
                      className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                        index === 0
                          ? 'border-yellow-300 bg-yellow-50'
                          : index === 1
                          ? 'border-green-300 bg-green-50'
                          : index === 2
                          ? 'border-orange-300 bg-orange-50'
                          : isLast
                          ? 'border-red-200 bg-red-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-2xl font-bold ${
                            index === 0 ? 'text-yellow-600' :
                            index === 1 ? 'text-green-400' :
                            index === 2 ? 'text-orange-600' : 
                            isLast ? 'text-red-600' : 'text-gray-800'
                          }`}>
                            #{index + 1}
                          </span>
                          {index < 3 && (
                            <Trophy className={`w-5 h-5 ${
                              index === 0 ? 'text-yellow-500' :
                              index === 1 ? 'text-gray-400' : 'text-orange-500'
                            }`} />
                          )}
                          {/* {isLast && (
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                              Least Scorer
                            </span>
                          )} */}
                        </div>
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={entry.player.avatar} alt={entry.player.name} />
                          <AvatarFallback>{entry.player.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{entry.player.name}</p>
                          <p className="text-sm text-gray-600">
                            {entry.matchesWon}W / {entry.matchesLost}L
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${
                          isLast ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {entry.totalPoints}
                        </p>
                        <p className="text-sm text-gray-500">points</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {showMatchHistory && (
          <Card className="bg-white/95 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Match History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {matches && matches.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 font-medium text-gray-600">Match</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-600">Bidder</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-600">Partners</th>
                        <th className="text-center py-2 px-3 font-medium text-gray-600">Bid</th>
                        <th className="text-center py-2 px-3 font-medium text-gray-600">Result</th>
                        <th className="text-center py-2 px-3 font-medium text-gray-600">Scores</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matches.slice().reverse().map((match) => (
                        <tr key={match.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-3">
                            <Badge variant="secondary">#{match.matchNumber}</Badge>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <Crown className="w-4 h-4 text-yellow-600" />
                              <span className="font-medium">{match.bidder.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex flex-wrap gap-1">
                              {match.partners.length > 0 ? (
                                match.partners.map((partner, index) => (
                                  <span key={partner.id} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    {partner.name}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                  Solo
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Target className="w-4 h-4 text-gray-500" />
                              <span className="font-bold">{match.bidAmount}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <Badge className={match.won ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {match.won ? 'WON' : 'LOST'}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="text-xs space-y-1">
                              {match.scores && match.scores.slice(0, 3).map((score) => (
                                <div key={score.player.id} className="flex justify-between gap-2">
                                  <span className="truncate max-w-16">{score.player.name}</span>
                                  <span className="font-medium">{score.score}</span>
                                </div>
                              ))}
                              {match.scores && match.scores.length > 3 && (
                                <div className="text-gray-500">+{match.scores.length - 3} more</div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No matches played yet</p>
                  <p className="text-sm">Start a new match to see history</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

const EndGameScreen = () => {
  const { setCurrentScreen, gameData, selectedPlayers } = useGame();
  const [rankings, setRankings] = useState([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gameEnded, setGameEnded] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (gameData?.id) {
      fetchTotals();
    }
  }, [gameData?.id]);

  const fetchTotals = async () => {
    setLoading(true);
    try {
      // Fetch both totals and matches for PDF export
      const [totalsResponse, gameResponse] = await Promise.all([
        fetch(`/api/games/${gameData.id}/totals`),
        fetch(`/api/games/${gameData.id}`)
      ]);
      
      if (totalsResponse.ok) {
        const totalsData = await totalsResponse.json();
        setRankings(totalsData.rankings || []);
        setTotalMatches(totalsData.totalMatches || 0);
      } else {
        console.error('Failed to fetch totals');
      }
      
      if (gameResponse.ok) {
        const gameDataResponse = await gameResponse.json();
        setMatches(gameDataResponse.game?.matches || []);
      } else {
        console.error('Failed to fetch game data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  const handleEndGame = async () => {
    try {
      const response = await fetch(`/api/games/${gameData.id}/end`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        setGameEnded(true);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      } else {
        alert('Failed to end game');
      }
    } catch (error) {
      console.error('Error ending game:', error);
      alert('Failed to end game');
    }
  };

  const exportToPDF = () => {
    // Generate PDF content
    const gameStats = {
      location: gameData?.location || 'Unknown',
      date: new Date(gameData?.date).toLocaleDateString() || new Date().toLocaleDateString(),
      totalPlayers: selectedPlayers.length,
      totalMatches: totalMatches,
      duration: gameData?.matches?.length > 0 
        ? `${Math.round((new Date() - new Date(gameData.date)) / (1000 * 60))} minutes`
        : 'N/A'
    };

    // Create downloadable text file (PDF functionality would require a library like jsPDF)
    const content = generateGameReport(gameStats, rankings, matches);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `250-card-game-results-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateGameReport = (stats, rankings, matches) => {
    let report = `250 CARD GAME - FINAL RESULTS\n`;
    report += `=====================================\n\n`;
    report += `Game Details:\n`;
    report += `Location: ${stats.location}\n`;
    report += `Date: ${stats.date}\n`;
    report += `Players: ${stats.totalPlayers}\n`;
    report += `Matches Played: ${stats.totalMatches}\n`;
    report += `Duration: ${stats.duration}\n\n`;
    
    report += `FINAL STANDINGS:\n`;
    report += `================\n`;
    rankings.forEach((entry, index) => {
      report += `${index + 1}. ${entry.player.name} - ${entry.totalPoints} points (${entry.matchesWon}W/${entry.matchesLost}L)\n`;
    });
    
    report += `\nMATCH HISTORY:\n`;
    report += `==============\n`;
    if (matches.length === 0) {
      report += `No matches played yet.\n`;
    } else {
      // Create a table-like format for match history
      report += `Match | Bidder | Partners | Bid | Result | Scores\n`;
      report += `------|--------|----------|-----|--------|--------\n`;
      
      matches.slice().reverse().forEach((match) => {
        const partnerNames = match.partners.length > 0 ? match.partners.map(p => p.name).join(', ') : 'Solo';
        const result = match.won ? 'WON' : 'LOST';
        
        // Get scores for this match
        const scores = match.scores ? match.scores.map(score => 
          `${score.player.name}: ${score.score}`
        ).join(', ') : 'N/A';
        
        report += `#${match.matchNumber} | ${match.bidder.name} | ${partnerNames} | ${match.bidAmount} | ${result} | ${scores}\n`;
      });
    }
    
    report += `\n\nGenerated on ${new Date().toLocaleString()}\n`;
    return report;
  };

  const shareResults = () => {
    if (navigator.share && rankings.length > 0) {
      const winner = rankings[0];
      const shareText = `🏆 Winner: ${winner.player.name} with ${winner.totalPoints} points!\n\n📊 Final Standings:\n${rankings.map((entry, index) => `${index + 1}. ${entry.player.name} - ${entry.totalPoints} pts`).join('\n')}\n\n🎮 ${totalMatches} matches played at ${gameData?.location || 'Game Night'}`;
      
      navigator.share({
        title: '250 Card Game Results! 🎉',
        text: shareText
      }).catch(console.error);
    } else {
      // Fallback: copy to clipboard
      const winner = rankings[0];
      const shareText = `🎉 250 Card Game Results!\n\n🏆 Winner: ${winner.player.name} with ${winner.totalPoints} points!\n\n📊 Final Standings:\n${rankings.slice(0, 3).map((entry, index) => `${index + 1}. ${entry.player.name} - ${entry.totalPoints} pts`).join('\n')}\n\n🎮 ${totalMatches} matches played at ${gameData?.location || 'Game Night'}`;
      
      navigator.clipboard.writeText(shareText).then(() => {
        alert('Results copied to clipboard!');
      }).catch(() => {
        alert('Unable to copy results');
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-900 p-4 flex items-center justify-center">
        <Card className="bg-white/95 shadow-xl max-w-md w-full">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading final results...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-900 p-4">
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
          initialVelocityY={20}
          colors={['#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']}
        />
      )}
      
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between text-white">
          {!gameEnded && (
            <Button
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={() => setCurrentScreen('mainGame')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {/* Back */}
            </Button>
          )}
          <div className="text-center w-full">
            <h1 className="text-3xl font-bold text-center">
              {gameEnded ? '🎉 Game Completed!' : 'End Game'}
            </h1>
            <p className="text-green-200">Final Results</p>
          </div>
          <div className="w-20"></div>
        </div>

        {/* Top 3 Players with Podium */}
        {rankings.length >= 3 && (
          <Card className="bg-white/95 shadow-xl">
            <CardHeader>
              <CardTitle className="text-center">🏆 Top 3 Players</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-center gap-4">
                {/* 2nd Place */}
                <div className="text-center">
                  <Avatar className="w-16 h-16 mx-auto mb-2">
                    <AvatarImage src={rankings[1]?.player.avatar} alt={rankings[1]?.player.name} />
                    <AvatarFallback>{rankings[1]?.player.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="bg-gray-300 h-16 w-20 rounded-t-lg flex items-center justify-center mb-2">
                    <span className="text-2xl font-bold text-gray-700">2</span>
                  </div>
                  <p className="font-semibold text-sm">{rankings[1]?.player.name}</p>
                  <p className="text-xs text-gray-600">{rankings[1]?.totalPoints} pts</p>
                </div>

                {/* 1st Place */}
                <div className="text-center">
                  <Avatar className="w-20 h-20 mx-auto mb-2 ring-4 ring-yellow-400">
                    <AvatarImage src={rankings[0]?.player.avatar} alt={rankings[0]?.player.name} />
                    <AvatarFallback>{rankings[0]?.player.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="bg-yellow-400 h-24 w-24 rounded-t-lg flex items-center justify-center mb-2">
                    <span className="text-3xl font-bold text-yellow-800">👑</span>
                  </div>
                  <p className="font-bold">{rankings[0]?.player.name}</p>
                  <p className="text-sm text-yellow-600 font-semibold">{rankings[0]?.totalPoints} pts</p>
                </div>

                {/* 3rd Place */}
                <div className="text-center">
                  <Avatar className="w-16 h-16 mx-auto mb-2">
                    <AvatarImage src={rankings[2]?.player.avatar} alt={rankings[2]?.player.name} />
                    <AvatarFallback>{rankings[2]?.player.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="bg-orange-400 h-12 w-20 rounded-t-lg flex items-center justify-center mb-2">
                    <span className="text-xl font-bold text-orange-800">3</span>
                  </div>
                  <p className="font-semibold text-sm">{rankings[2]?.player.name}</p>
                  <p className="text-xs text-gray-600">{rankings[2]?.totalPoints} pts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Complete Rankings */}
        <Card className="bg-white/95 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-600" />
              Complete Rankings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {rankings.map((entry, index) => {
                const isLast = index === rankings.length - 1;
                return (
                  <div
                    key={entry.player.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      index === 0 ? 'bg-yellow-50 border border-yellow-200' :
                      index === 1 ? 'bg-gray-50 border border-gray-200' :
                      index === 2 ? 'bg-orange-50 border border-orange-200' : 
                      isLast ? 'bg-red-50 border border-red-200' : 'bg-white border border-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-lg font-bold w-8 ${
                        isLast ? 'text-red-600' : ''
                      }`}>#{index + 1}</span>
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={entry.player.avatar} alt={entry.player.name} />
                        <AvatarFallback>{entry.player.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{entry.player.name}</p>
                        <p className="text-xs text-gray-600">{entry.matchesWon}W / {entry.matchesLost}L</p>
                        {isLast && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                            Least Scorer
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${
                        isLast ? 'text-red-600' : 'text-green-600'
                      }`}>{entry.totalPoints}</p>
                      <p className="text-xs text-gray-500">points</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Game Statistics */}
        <Card className="bg-white/95 shadow-xl">
          <CardHeader>
            <CardTitle>Game Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">{totalMatches}</p>
                <p className="text-sm text-gray-600">Total Matches</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{selectedPlayers.length}</p>
                <p className="text-sm text-gray-600">Players</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{gameData?.location || 'Unknown'}</p>
                <p className="text-sm text-gray-600">Location</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {new Date(gameData?.date).toLocaleDateString() || 'Today'}
                </p>
                <p className="text-sm text-gray-600">Date</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          {!gameEnded && (
            <Button 
              className="w-full bg-red-600 hover:bg-red-700 h-12 text-lg"
              onClick={handleEndGame}
            >
              🏁 End Game & Finalize Results
            </Button>
          )}

          {gameEnded && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 h-12"
                  onClick={exportToPDF}
                >
                  📄 Export Results
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700 h-12"
                  onClick={shareResults}
                >
                  📤 Share Results
                </Button>
              </div>
              
              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700 h-12 text-lg"
                onClick={() => {
                  setCurrentScreen('setup');
                  window.location.reload(); // Reset the entire app state
                }}
              >
                🎮 Start New Game
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Game Router Component (uses the context)
const GameRouter = () => {
  const { currentScreen } = useGame();

  const renderScreen = () => {
    switch (currentScreen) {
      case 'setup':
        return <GameSetupScreen />;
      case 'playerSelection':
        return <PlayerSelectionScreen />;
      case 'partnershipConfirmation':
        return <PartnershipConfirmationScreen />;
      case 'mainGame':
        return <MainGameScreen />;
      case 'newMatch':
        return <NewMatchScreen />;
      case 'modifyPlayers':
        return <ModifyPlayersScreen />;
      case 'viewTotals':
        return <ViewTotalsScreen />;
      case 'endGame':
        return <EndGameScreen />;
      default:
        return <GameSetupScreen />;
    }
  };

  return renderScreen();
};

// Main App Component (provides the context)
const App = () => {
  const router = useRouter();
  const [showLanding, setShowLanding] = React.useState(true);

  React.useEffect(() => {
    // Check if user has visited before
    const hasVisited = localStorage.getItem('hasVisited250Game');
    if (hasVisited) {
      setShowLanding(false);
    }
  }, []);

  const handleStartGame = () => {
    localStorage.setItem('hasVisited250Game', 'true');
    setShowLanding(false);
  };

  if (showLanding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-white mb-12">
            <h1 className="text-5xl font-bold mb-4 flex items-center justify-center gap-3">
              <Gamepad2 className="w-12 h-12" />
              250 Card Game
            </h1>
            <p className="text-xl text-green-200 max-w-2xl mx-auto">
              The ultimate scoring app for the dynamic 250/Partner card game
            </p>
          </div>
          <div className="text-center">
            <Button 
              onClick={handleStartGame}
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white text-xl px-12 py-6 rounded-full shadow-2xl transform hover:scale-105 transition-all duration-200"
            >
              <Gamepad2 className="w-6 h-6 mr-3" />
              Let's Play!
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <GameProvider>
      <GameRouter />
    </GameProvider>
  );
};

export default App;