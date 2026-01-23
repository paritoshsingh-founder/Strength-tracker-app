'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout';
import { AddExercise, LogSet, RestTimer } from '@/components/workout';
import { Card, Button } from '@/components/ui';

interface WorkoutSet {
  id: string;
  exercise: string;
  reps: number;
  weight: number;
  timestamp: Date;
}

export default function TodaysWorkout() {
  const [currentExercise, setCurrentExercise] = useState('Bench Press');
  const [workoutSets, setWorkoutSets] = useState<WorkoutSet[]>([]);
  const [showAddExercise, setShowAddExercise] = useState(false);

  const handleAddExercise = (exercise: { id: string; name: string; muscleGroup: string }) => {
    setCurrentExercise(exercise.name);
    setShowAddExercise(false);
  };

  const handleLogSet = (data: { weight: number; reps: number }) => {
    const newSet: WorkoutSet = {
      id: Date.now().toString(),
      exercise: currentExercise,
      reps: data.reps,
      weight: data.weight,
      timestamp: new Date(),
    };
    setWorkoutSets((prev) => [...prev, newSet]);
  };

  const handleDeleteSet = (id: string) => {
    setWorkoutSets((prev) => prev.filter((set) => set.id !== id));
  };

  // Calculate stats
  const totalSets = workoutSets.length;
  const totalVolume = workoutSets.reduce((acc, set) => acc + set.weight * set.reps, 0);
  const exerciseGroups = workoutSets.reduce((acc, set) => {
    if (!acc[set.exercise]) {
      acc[set.exercise] = [];
    }
    acc[set.exercise].push(set);
    return acc;
  }, {} as Record<string, WorkoutSet[]>);

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <section className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                Today&apos;s <span className="gradient-text">Workout</span>
              </h1>
              <p className="text-gray-400">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-2xl font-bold gradient-text">{totalSets}</p>
                <p className="text-gray-400 text-sm">Sets</p>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-2xl font-bold text-accent">{totalVolume.toLocaleString()}</p>
                <p className="text-gray-400 text-sm">Volume (kg)</p>
              </div>
            </div>
          </div>
        </section>

        {/* Current Exercise Banner */}
        <section className="mb-6">
          <Card className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Current Exercise</p>
                <h2 className="text-2xl font-bold text-white">{currentExercise}</h2>
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={() => setShowAddExercise(!showAddExercise)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Change Exercise
            </Button>
          </Card>
        </section>

        {/* Main Content */}
        <section className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Log Set & Workout Log */}
          <div className="lg:col-span-2 space-y-6">
            {/* Log Set */}
            <LogSet
              exerciseName={currentExercise}
              onLogSet={handleLogSet}
            />

            {/* Workout Log by Exercise */}
            {Object.keys(exerciseGroups).length > 0 && (
              <Card>
                <h3 className="text-xl font-bold mb-4">Workout Log</h3>
                <div className="space-y-6">
                  {Object.entries(exerciseGroups).map(([exercise, sets]) => (
                    <div key={exercise}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                          </svg>
                        </div>
                        <h4 className="font-semibold text-white">{exercise}</h4>
                        <span className="text-gray-400 text-sm">({sets.length} sets)</span>
                      </div>
                      <div className="space-y-2 ml-11">
                        {sets.map((set, index) => (
                          <div
                            key={set.id}
                            className="flex items-center justify-between p-3 bg-white/5 rounded-xl group"
                          >
                            <div className="flex items-center gap-4">
                              <span className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-sm font-medium">
                                {index + 1}
                              </span>
                              <span className="text-gray-300">
                                {set.weight} kg x {set.reps} reps
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-primary font-semibold">
                                {set.weight * set.reps} kg
                              </span>
                              <button
                                onClick={() => handleDeleteSet(set.id)}
                                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Empty State */}
            {workoutSets.length === 0 && (
              <Card className="text-center py-12">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-300 mb-2">No sets logged yet</h3>
                <p className="text-gray-500">Start logging your sets to track your progress!</p>
              </Card>
            )}
          </div>

          {/* Right Column - Timer & Add Exercise */}
          <div className="space-y-6">
            {/* Rest Timer */}
            <RestTimer defaultDuration={60} />

            {/* Add Exercise (toggled) */}
            {showAddExercise && (
              <div className="animate-slide-up">
                <AddExercise onAddExercise={handleAddExercise} />
              </div>
            )}

            {/* Mobile Stats */}
            <Card className="sm:hidden">
              <h3 className="text-lg font-bold mb-4">Session Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-white/5 rounded-xl">
                  <p className="text-2xl font-bold gradient-text">{totalSets}</p>
                  <p className="text-gray-400 text-sm">Total Sets</p>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-xl">
                  <p className="text-2xl font-bold text-accent">{totalVolume.toLocaleString()}</p>
                  <p className="text-gray-400 text-sm">Volume (kg)</p>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
