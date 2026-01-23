'use client';

import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';

const WORKOUT_TEMPLATES = [
  { id: '1', name: 'Push Day', icon: '💪', exercises: ['Bench Press', 'Shoulder Press', 'Tricep Dip'] },
  { id: '2', name: 'Pull Day', icon: '🏋️', exercises: ['Deadlift', 'Pull Ups', 'Bicep Curl'] },
  { id: '3', name: 'Leg Day', icon: '🦵', exercises: ['Squat', 'Leg Press', 'Lunges'] },
  { id: '4', name: 'Full Body', icon: '⚡', exercises: ['Squat', 'Bench Press', 'Deadlift'] },
];

interface StartWorkoutProps {
  onStartWorkout?: (workoutName: string) => void;
  isWorkoutActive?: boolean;
}

export default function StartWorkout({ onStartWorkout, isWorkoutActive = false }: StartWorkoutProps) {
  const [customWorkoutName, setCustomWorkoutName] = useState('');

  const handleStartCustom = () => {
    const name = customWorkoutName.trim() || `Workout ${new Date().toLocaleDateString()}`;
    if (onStartWorkout) {
      onStartWorkout(name);
    }
    setCustomWorkoutName('');
  };

  const handleStartTemplate = (templateName: string) => {
    if (onStartWorkout) {
      onStartWorkout(templateName);
    }
  };

  return (
    <Card className="w-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-accent to-primary rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white">Start Workout</h2>
        {isWorkoutActive && (
          <span className="ml-auto bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            Active
          </span>
        )}
      </div>

      {/* Quick Start with Custom Name */}
      <div className="mb-6">
        <label className="block text-gray-400 text-sm mb-2">Custom Workout</label>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Enter workout name..."
            value={customWorkoutName}
            onChange={(e) => setCustomWorkoutName(e.target.value)}
            className="flex-1 glass-input rounded-xl px-4 py-3 text-white placeholder-gray-400"
          />
          <Button onClick={handleStartCustom} disabled={isWorkoutActive}>
            Start
          </Button>
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 h-px bg-white/10"></div>
        <span className="text-gray-500 text-sm">or choose template</span>
        <div className="flex-1 h-px bg-white/10"></div>
      </div>

      {/* Workout Templates */}
      <div className="grid grid-cols-2 gap-3">
        {WORKOUT_TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => handleStartTemplate(template.name)}
            disabled={isWorkoutActive}
            className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <span className="text-2xl mb-2 block">{template.icon}</span>
            <p className="font-semibold text-white mb-1">{template.name}</p>
            <p className="text-xs text-gray-400">{template.exercises.length} exercises</p>
          </button>
        ))}
      </div>

      {/* End Workout Button (when active) */}
      {isWorkoutActive && (
        <Button
          variant="secondary"
          className="w-full mt-6 border-red-500/50 text-red-400 hover:bg-red-500/20"
          onClick={() => onStartWorkout?.('')}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
          </svg>
          End Workout
        </Button>
      )}
    </Card>
  );
}
