'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Target, Trophy, Crown, Gamepad2, Star } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();

  const handlePlay = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-900">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-white mb-12">
          <h1 className="text-5xl font-bold my-4 flex flex-col font-sans items-center justify-center gap-3">
            <Gamepad2 className="w-24 h-24" />
            250 Card Game
          </h1>
          <p className="text-lg text-green-200 max-w-2xl mx-auto">
            The ultimate scoring app for the dynamic 250/Partner card game with flexible partnerships and strategic scoring
          </p>
        </div>

        {/* Game Description */}
        <div className="max-w-4xl mx-auto mb-12">
          <Card className="bg-white/95 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-3xl text-center text-green-800 mb-4">
                How to Play 250 Card Game
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Game Rules */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-green-700 flex items-center gap-2">
                    <Users className="w-6 h-6" />
                    Game Setup
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <Star className="w-4 h-4 text-yellow-500 mt-1 flex-shrink-0" />
                      <span><strong>4-5 players:</strong> 2 partners (1 bidder + 1 partner)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Star className="w-4 h-4 text-yellow-500 mt-1 flex-shrink-0" />
                      <span><strong>6+ players:</strong> 3 partners (1 bidder + 2 partners)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Star className="w-4 h-4 text-yellow-500 mt-1 flex-shrink-0" />
                      <span>Partnerships change every round</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Star className="w-4 h-4 text-yellow-500 mt-1 flex-shrink-0" />
                      <span>Minimum bid: 130 points</span>
                    </li>
                  </ul>
                </div>

                {/* Scoring System */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-green-700 flex items-center gap-2">
                    <Target className="w-6 h-6" />
                    Scoring System
                  </h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <h4 className="font-semibold text-green-800">If Team Wins:</h4>
                      <ul className="text-sm text-gray-700 mt-1 space-y-1">
                        <li>• Bidder gets: <strong>Bid + 100 points</strong></li>
                        <li>• Partners get: <strong>Bid amount each</strong></li>
                        <li>• Non-partners get: <strong>0 points</strong></li>
                      </ul>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg">
                      <h4 className="font-semibold text-red-800">If Team Loses:</h4>
                      <ul className="text-sm text-gray-700 mt-1 space-y-1">
                        <li>• Bidder gets: <strong>0 points</strong></li>
                        <li>• Partners get: <strong>0 points</strong></li>
                        <li>• Non-partners get: <strong>Bid amount each</strong></li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="mt-8">
                <h3 className="text-xl font-semibold text-green-700 mb-4 flex items-center gap-2">
                  <Trophy className="w-6 h-6" />
                  App Features
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Users className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <p className="text-sm font-medium">Dynamic Partnerships</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Target className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <p className="text-sm font-medium">Real-time Scoring</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
                    <p className="text-sm font-medium">Live Rankings</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Crown className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                    <p className="text-sm font-medium">Match History</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Button 
            onClick={handlePlay}
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white text-xl px-12 py-6 rounded-full shadow-2xl transform hover:scale-105 transition-all duration-200"
          >
            <Gamepad2 className="w-6 h-6 mr-3" />
            Let's Play!
          </Button>
          <p className="text-green-200 mt-4 text-lg">
            Start your first game and experience the thrill of 250!
          </p>
        </div>
      </div>
    </div>
  );
}