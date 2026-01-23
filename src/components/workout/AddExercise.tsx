'use client';

import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';

const EXERCISES = [
  { id: '1', name: 'Bench Press', muscleGroup: 'Chest' },
  { id: '2', name: 'Incline Dumbbell Press', muscleGroup: 'Chest' },
  { id: '3', name: 'Squat', muscleGroup: 'Legs' },
  { id: '4', name: 'Deadlift', muscleGroup: 'Back' },
  { id: '5', name: 'Pull Ups', muscleGroup: 'Back' },
  { id: '6', name: 'Shoulder Press', muscleGroup: 'Shoulders' },
  { id: '7', name: 'Bicep Curl', muscleGroup: 'Arms' },
  { id: '8', name: 'Tricep Dip', muscleGroup: 'Arms' },
  { id: '9', name: 'Leg Press', muscleGroup: 'Legs' },
  { id: '10', name: 'Lat Pulldown', muscleGroup: 'Back' },
];

const MUSCLE_GROUPS = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms'];

interface AddExerciseProps {
  onAddExercise?: (exercise: { id: string; name: string; muscleGroup: string }) => void;
}

export default function AddExercise({ onAddExercise }: AddExerciseProps) {
  const [selectedMuscle, setSelectedMuscle] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredExercises = EXERCISES.filter((exercise) => {
    const matchesMuscle = selectedMuscle === 'All' || exercise.muscleGroup === selectedMuscle;
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesMuscle && matchesSearch;
  });

  const handleAddExercise = (exercise: { id: string; name: string; muscleGroup: string }) => {
    if (onAddExercise) {
      onAddExercise(exercise);
    }
  };

  return (
    <Card className="w-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white">Add Exercise</h2>
      </div>

      {/* Search Input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search exercises..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full glass-input rounded-xl px-4 py-3 text-white placeholder-gray-400"
        />
      </div>

      {/* Muscle Group Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {MUSCLE_GROUPS.map((muscle) => (
          <button
            key={muscle}
            onClick={() => setSelectedMuscle(muscle)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedMuscle === muscle
                ? 'bg-primary text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            {muscle}
          </button>
        ))}
      </div>

      {/* Exercise List */}
      <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
        {filteredExercises.map((exercise) => (
          <div
            key={exercise.id}
            className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all group"
          >
            <div>
              <p className="font-medium text-white">{exercise.name}</p>
              <p className="text-sm text-gray-400">{exercise.muscleGroup}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAddExercise(exercise)}
              className="opacity-0 group-hover:opacity-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}
