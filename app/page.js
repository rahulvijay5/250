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
import { Search, Plus, Users, Trophy, FileText, Settings, ArrowLeft, Crown, Target } from 'lucide-react';

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
              <Label htmlFor="date" className="text-sm font-medium">Date</Label>
              <Input
                id="date"
                value={new Date().toLocaleDateString()}
                disabled
                className="mt-1 bg-gray-50"
              />
            </div>

            <div>
              <Label htmlFor="location" className="text-sm font-medium">Location</Label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                  <SelectItem value="__add_new__">+ Add New Location</SelectItem>
                </SelectContent>
              </Select>
              
              {selectedLocation === '__add_new__' && (
                <div className="mt-3 flex gap-2">
                  <Input
                    placeholder="Enter location name"
                    value={newLocationName}
                    onChange={(e) => setNewLocationName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddLocation()}
                  />
                  <Button onClick={handleAddLocation} disabled={loading || !newLocationName.trim()}>
                    Add
                  </Button>
                </div>
              )}
            </div>

            <Button 
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={handleContinue}
              disabled={!selectedLocation || selectedLocation === '__add_new__'}
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
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-900 p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center justify-between text-white">
          <Button
            variant="ghost"
            className="text-white hover:bg-white/20"
            onClick={() => setCurrentScreen('playerSelection')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Confirm Partnership</h1>
          <div className="w-20"></div>
        </div>

        <Card className="bg-white/95 shadow-xl">
          <CardHeader>
            <CardTitle>Partnership Structure</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-lg font-medium mb-2">
                Since there are {selectedPlayers.length} players, you will have:
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="font-bold text-blue-600">
                    {defaultPartnerCount} partners (1 bidder + {defaultPartnerCount - 1} partner{defaultPartnerCount > 2 ? 's' : ''})
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Users className="w-5 h-5 text-gray-600" />
                  <span className="font-bold text-gray-600">
                    {nonPartnerCount} non-partners
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => handleConfirm()}
              >
                Yes, Continue with Default
              </Button>
              
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => setShowCustom(!showCustom)}
              >
                No, Use Custom Partner Count
              </Button>

              {showCustom && (
                <div className="p-4 border rounded-lg space-y-3">
                  <Label>Number of partners (including bidder):</Label>
                  <Input
                    type="number"
                    min="2"
                    max={selectedPlayers.length - 1}
                    value={customPartnerCount}
                    onChange={(e) => setCustomPartnerCount(e.target.value)}
                    placeholder="Enter number"
                  />
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleConfirm(parseInt(customPartnerCount))}
                    disabled={!customPartnerCount || customPartnerCount < 2 || customPartnerCount >= selectedPlayers.length}
                  >
                    Confirm Custom Count
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
      title: 'New Match',
      description: 'Start a new round',
      icon: <Plus className="w-8 h-8" />,
      color: 'bg-blue-600 hover:bg-blue-700',
      action: () => setCurrentScreen('newMatch')
    },
    {
      title: 'Modify Players',
      description: 'Add/remove players',
      icon: <Users className="w-8 h-8" />,
      color: 'bg-purple-600 hover:bg-purple-700',
      action: () => setCurrentScreen('modifyPlayers')
    },
    {
      title: 'View Totals',
      description: 'Current standings',
      icon: <Trophy className="w-8 h-8" />,
      color: 'bg-yellow-600 hover:bg-yellow-700',
      action: () => setCurrentScreen('viewTotals')
    },
    {
      title: 'End Game',
      description: 'Finalize & export',
      icon: <FileText className="w-8 h-8" />,
      color: 'bg-red-600 hover:bg-red-700',
      action: () => setCurrentScreen('endGame')
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-900 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center text-white">
          <h1 className="text-3xl font-bold mb-2">250 Card Game</h1>
          <p className="text-green-200">{selectedPlayers.length} Players • {gameData?.matches?.length || 0} Matches Played</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {menuItems.map((item, index) => (
            <Card 
              key={index}
              className={`cursor-pointer transition-all transform hover:scale-105 ${item.color} text-white shadow-xl`}
              onClick={item.action}
            >
              <CardContent className="p-6 text-center space-y-3">
                <div className="flex justify-center">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{item.title}</h3>
                  <p className="text-white/80 text-sm">{item.description}</p>
                </div>
              </CardContent>
            </Card>
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
                  <div key={match.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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

  const partnerCount = gameData?.partnerCount || (selectedPlayers.length <= 5 ? 2 : 3);
  const requiredPartners = partnerCount - 1; // Excluding bidder

  const availablePartners = selectedPlayers.filter(p => p.id !== selectedBidder?.id);

  const handleBidderSelect = (player) => {
    setSelectedBidder(player);
    setStep('partners');
  };

  const togglePartnerSelection = (player) => {
    setSelectedPartners(prev => {
      const isSelected = prev.some(p => p.id === player.id);
      if (isSelected) {
        return prev.filter(p => p.id !== player.id);
      } else if (prev.length < requiredPartners) {
        return [...prev, player];
      }
      return prev;
    });
  };

  const handleResult = async (won) => {
    if (!selectedBidder || selectedPartners.length !== requiredPartners || !bidAmount) return;

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
              Back
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
              onClick={() => setStep('bidder')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
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
              <p className="text-sm text-gray-600">
                {selectedPartners.length}/{requiredPartners} selected
              </p>
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

              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => setStep('bid')}
                disabled={selectedPartners.length !== requiredPartners}
              >
                Continue to Bid Entry
              </Button>
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
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
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
                  {selectedPartners.map(partner => (
                    <Badge key={partner.id} className="bg-blue-100 text-blue-800">
                      {partner.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="bid">Bid Amount (minimum 130 points)</Label>
                <Input
                  id="bid"
                  type="number"
                  min="130"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder="Enter bid amount"
                  className="mt-1 text-lg text-center"
                />
              </div>

              <Button 
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => setStep('result')}
                disabled={!bidAmount || parseInt(bidAmount) < 130}
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
              Back
            </Button>
            <h1 className="text-2xl font-bold">Match Result</h1>
            <div className="w-20"></div>
          </div>

          <Card className="bg-white/95 shadow-xl">
            <CardHeader>
              <CardTitle>Did the team achieve their bid?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Target className="w-5 h-5" />
                  <span className="font-bold text-lg">{bidAmount} points</span>
                </div>
                <div className="text-sm text-gray-600">
                  Team: {selectedBidder?.name} + {selectedPartners.map(p => p.name).join(', ')}
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

// Simple placeholder screens for now
const ModifyPlayersScreen = () => {
  const { setCurrentScreen } = useGame();
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-900 p-4 flex items-center justify-center">
      <Card className="bg-white/95 shadow-xl max-w-md w-full">
        <CardContent className="p-6 text-center">
          <h2 className="text-xl font-bold mb-4">Modify Players</h2>
          <p className="text-gray-600 mb-4">This feature will be implemented next.</p>
          <Button onClick={() => setCurrentScreen('mainGame')}>Back to Main</Button>
        </CardContent>
      </Card>
    </div>
  );
};

const ViewTotalsScreen = () => {
  const { setCurrentScreen, gameData } = useGame();
  const [rankings, setRankings] = useState([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showMatchHistory, setShowMatchHistory] = useState(false);

  useEffect(() => {
    if (gameData?.id) {
      fetchTotals();
    }
  }, [gameData]);

  const fetchTotals = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/games/${gameData.id}/totals`);
      if (response.ok) {
        const data = await response.json();
        setRankings(data.rankings || []);
        setTotalMatches(data.totalMatches || 0);
      } else {
        console.error('Failed to fetch totals');
      }
    } catch (error) {
      console.error('Error fetching totals:', error);
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
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
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
                {rankings.map((entry, index) => (
                  <div
                    key={entry.player.id}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                      index === 0
                        ? 'border-yellow-300 bg-yellow-50'
                        : index === 1
                        ? 'border-gray-300 bg-gray-50'
                        : index === 2
                        ? 'border-orange-300 bg-orange-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-2xl font-bold ${
                          index === 0 ? 'text-yellow-600' :
                          index === 1 ? 'text-gray-600' :
                          index === 2 ? 'text-orange-600' : 'text-gray-800'
                        }`}>
                          #{index + 1}
                        </span>
                        {index < 3 && (
                          <Trophy className={`w-5 h-5 ${
                            index === 0 ? 'text-yellow-500' :
                            index === 1 ? 'text-gray-400' : 'text-orange-500'
                          }`} />
                        )}
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
                      <p className="text-2xl font-bold text-green-600">
                        {entry.totalPoints}
                      </p>
                      <p className="text-sm text-gray-500">points</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {showMatchHistory && gameData?.matches && gameData.matches.length > 0 && (
          <Card className="bg-white/95 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Match History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {gameData.matches.slice().reverse().map((match) => (
                  <div key={match.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">Match {match.matchNumber}</Badge>
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-yellow-600" />
                        <span className="font-medium">{match.bidder.name}</span>
                        <span className="text-sm text-gray-500">
                          + {match.partners.map(p => p.name).join(', ')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      <span className="font-medium">{match.bidAmount}</span>
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

const EndGameScreen = () => {
  const { setCurrentScreen, gameData, selectedPlayers } = useGame();
  const [rankings, setRankings] = useState([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [loading, setLoading] = useState(true);
  const [gameEnded, setGameEnded] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (gameData?.id) {
      fetchTotals();
    }
  }, [gameData]);

  const fetchTotals = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/games/${gameData.id}/totals`);
      if (response.ok) {
        const data = await response.json();
        setRankings(data.rankings || []);
        setTotalMatches(data.totalMatches || 0);
      } else {
        console.error('Failed to fetch totals');
      }
    } catch (error) {
      console.error('Error fetching totals:', error);
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
    const content = generateGameReport(gameStats, rankings, gameData?.matches || []);
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
    matches.forEach((match) => {
      const partnerNames = match.partners.map(p => p.name).join(', ');
      report += `Match ${match.matchNumber}: ${match.bidder.name} + ${partnerNames} bid ${match.bidAmount} - ${match.won ? 'WON' : 'LOST'}\n`;
    });
    
    report += `\n\nGenerated on ${new Date().toLocaleString()}\n`;
    return report;
  };

  const shareResults = () => {
    if (navigator.share && rankings.length > 0) {
      const winner = rankings[0];
      const shareText = `🎉 250 Card Game Results!\n\n🏆 Winner: ${winner.player.name} with ${winner.totalPoints} points!\n\n📊 Final Standings:\n${rankings.slice(0, 3).map((entry, index) => `${index + 1}. ${entry.player.name} - ${entry.totalPoints} pts`).join('\n')}\n\n🎮 ${totalMatches} matches played at ${gameData?.location || 'Game Night'}`;
      
      navigator.share({
        title: '250 Card Game Results',
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
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-red-400/20 animate-pulse" />
          {/* Simple confetti effect */}
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random()}s`
              }}
            >
              🎉
            </div>
          ))}
        </div>
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
              Back
            </Button>
          )}
          <div className="text-center">
            <h1 className="text-3xl font-bold">
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
              {rankings.map((entry, index) => (
                <div
                  key={entry.player.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    index === 0 ? 'bg-yellow-50 border border-yellow-200' :
                    index === 1 ? 'bg-gray-50 border border-gray-200' :
                    index === 2 ? 'bg-orange-50 border border-orange-200' : 'bg-white border border-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold w-8">#{index + 1}</span>
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={entry.player.avatar} alt={entry.player.name} />
                      <AvatarFallback>{entry.player.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{entry.player.name}</p>
                      <p className="text-xs text-gray-600">{entry.matchesWon}W / {entry.matchesLost}L</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">{entry.totalPoints}</p>
                    <p className="text-xs text-gray-500">points</p>
                  </div>
                </div>
              ))}
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
  return (
    <GameProvider>
      <GameRouter />
    </GameProvider>
  );
};

export default App;