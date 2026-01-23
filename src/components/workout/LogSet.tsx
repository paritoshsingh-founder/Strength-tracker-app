'use client';

import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';

interface LogSetProps {
  exerciseName?: string;
  onLogSet?: (data: { weight: number; reps: number }) => void;
  lastSet?: { weight: number; reps: number };
}

export default function LogSet({ exerciseName = 'Bench Press', onLogSet, lastSet }: LogSetProps) {
  const [weight, setWeight] = useState(lastSet?.weight || 50);
  const [reps, setReps] = useState(lastSet?.reps || 10);

  const adjustWeight = (delta: number) => {
    setWeight((prev) => Math.max(0, prev + delta));
  };

  const adjustReps = (delta: number) => {
    setReps((prev) => Math.max(1, prev + delta));
  };

  const handleLogSet = () => {
    if (onLogSet) {
      onLogSet({ weight, reps });
    }
  };

  return (
    <Card className="w-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-secondary to-accent rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Log Set</h2>
          <p className="text-gray-400 text-sm">{exerciseName}</p>
        </div>
      </div>

      {/* Weight Input */}
      <div className="mb-6">
        <label className="block text-gray-400 text-sm mb-3">Weight (kg)</label>
        <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4">
          <button
            onClick={() => adjustWeight(-2.5)}
            className="w-12 h-12 bg-accent/20 hover:bg-accent/40 rounded-xl flex items-center justify-center transition-all"
          >
            <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <div className="text-center">
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="w-24 bg-transparent text-center text-4xl font-bold text-white focus:outline-none"
            />
            <p className="text-gray-500 text-sm">kg</p>
          </div>
          <button
            onClick={() => adjustWeight(2.5)}
            className="w-12 h-12 bg-accent/20 hover:bg-accent/40 rounded-xl flex items-center justify-center transition-all"
          >
            <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
        {/* Quick weight adjustments */}
        <div className="flex gap-2 mt-3">
          {[-10, -5, +5, +10].map((delta) => (
            <button
              key={delta}
              onClick={() => adjustWeight(delta)}
              className="flex-1 py-2 text-sm bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all"
            >
              {delta > 0 ? '+' : ''}{delta}
            </button>
          ))}
        </div>
      </div>

      {/* Reps Input */}
      <div className="mb-6">
        <label className="block text-gray-400 text-sm mb-3">Reps</label>
        <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4">
          <button
            onClick={() => adjustReps(-1)}
            className="w-12 h-12 bg-secondary/20 hover:bg-secondary/40 rounded-xl flex items-center justify-center transition-all"
          >
            <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <div className="text-center">
            <input
              type="number"
              value={reps}
              onChange={(e) => setReps(Number(e.target.value))}
              className="w-24 bg-transparent text-center text-4xl font-bold text-white focus:outline-none"
            />
            <p className="text-gray-500 text-sm">reps</p>
          </div>
          <button
            onClick={() => adjustReps(1)}
            className="w-12 h-12 bg-secondary/20 hover:bg-secondary/40 rounded-xl flex items-center justify-center transition-all"
          >
            <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
        {/* Quick rep adjustments */}
        <div className="flex gap-2 mt-3">
          {[6, 8, 10, 12].map((rep) => (
            <button
              key={rep}
              onClick={() => setReps(rep)}
              className={`flex-1 py-2 text-sm rounded-lg transition-all ${
                reps === rep
                  ? 'bg-secondary text-white'
                  : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
              }`}
            >
              {rep}
            </button>
          ))}
        </div>
      </div>

      {/* Volume Preview */}
      <div className="bg-white/5 rounded-xl p-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Set Volume</span>
          <span className="text-2xl font-bold gradient-text">{weight * reps} kg</span>
        </div>
      </div>

      {/* Log Set Button */}
      <Button onClick={handleLogSet} className="w-full" size="lg">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Log Set
      </Button>
    </Card>
  );
}
