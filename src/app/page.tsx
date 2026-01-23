'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout';
import { Card } from '@/components/ui';

type TabType = 'dashboard' | 'todays-workout' | 'workout-plan' | 'live-workout';

interface WorkoutSet {
  id: string;
  exercise: string;
  reps: number;
  weight: number;
}

interface Exercise {
  name: string;
  sets: number;
  reps: string;
}

interface WorkoutDay {
  id: string;
  name: string;
  day: string;
  color: string;
  exercises: Exercise[];
}

const WORKOUT_PLAN: WorkoutDay[] = [
  {
    id: 'push',
    name: 'Push Day',
    day: 'Monday / Thursday',
    color: 'from-red-500 to-orange-500',
    exercises: [
      { name: 'Bench Press', sets: 4, reps: '8-10' },
      { name: 'Overhead Press', sets: 4, reps: '8-10' },
      { name: 'Incline Dumbbell Press', sets: 3, reps: '10-12' },
      { name: 'Lateral Raises', sets: 3, reps: '12-15' },
      { name: 'Tricep Pushdowns', sets: 3, reps: '12-15' },
      { name: 'Overhead Tricep Extension', sets: 3, reps: '12-15' },
    ],
  },
  {
    id: 'pull',
    name: 'Pull Day',
    day: 'Tuesday / Friday',
    color: 'from-blue-500 to-cyan-500',
    exercises: [
      { name: 'Deadlift', sets: 4, reps: '6-8' },
      { name: 'Pull Ups', sets: 4, reps: '8-10' },
      { name: 'Barbell Rows', sets: 4, reps: '8-10' },
      { name: 'Face Pulls', sets: 3, reps: '15-20' },
      { name: 'Barbell Curls', sets: 3, reps: '10-12' },
      { name: 'Hammer Curls', sets: 3, reps: '10-12' },
    ],
  },
  {
    id: 'legs',
    name: 'Legs Day',
    day: 'Wednesday / Saturday',
    color: 'from-green-500 to-emerald-500',
    exercises: [
      { name: 'Squats', sets: 4, reps: '8-10' },
      { name: 'Romanian Deadlift', sets: 4, reps: '10-12' },
      { name: 'Leg Press', sets: 3, reps: '12-15' },
      { name: 'Leg Curls', sets: 3, reps: '12-15' },
      { name: 'Calf Raises', sets: 4, reps: '15-20' },
      { name: 'Leg Extensions', sets: 3, reps: '12-15' },
    ],
  },
];

const getTodaysWorkout = (): WorkoutDay | null => {
  const day = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Push Day: Monday (1) and Thursday (4)
  if (day === 1 || day === 4) return WORKOUT_PLAN[0];

  // Pull Day: Tuesday (2) and Friday (5)
  if (day === 2 || day === 5) return WORKOUT_PLAN[1];

  // Legs Day: Wednesday (3) and Saturday (6)
  if (day === 3 || day === 6) return WORKOUT_PLAN[2];

  // Sunday (0) - Rest day
  return null;
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [workoutSets, setWorkoutSets] = useState<WorkoutSet[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetNumber, setCurrentSetNumber] = useState(1);
  const [workoutTimer, setWorkoutTimer] = useState(0);
  const [isWorkoutRunning, setIsWorkoutRunning] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [restTimer, setRestTimer] = useState(60);
  const [isExerciseTransition, setIsExerciseTransition] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logWeight, setLogWeight] = useState(20);
  const [logReps, setLogReps] = useState(10);

  const todaysWorkout = getTodaysWorkout();

  // Workout timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isWorkoutRunning) {
      interval = setInterval(() => {
        setWorkoutTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isWorkoutRunning]);

  // Rest timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isResting && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer((prev) => {
          if (prev <= 1) {
            // Timer completed
            if (isExerciseTransition) {
              // Move to next exercise with set 1
              setCurrentExerciseIndex((i) => i + 1);
              setCurrentSetNumber(1);
              setIsExerciseTransition(false);
            } else {
              // Move to next set of same exercise
              setCurrentSetNumber((s) => s + 1);
            }
            setIsResting(false);
            return 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isResting, restTimer, isExerciseTransition]);

  const formatTimer = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartWorkout = () => {
    setCurrentExerciseIndex(0);
    setCurrentSetNumber(1);
    setWorkoutTimer(0);
    setIsWorkoutRunning(true);
    setIsResting(false);
    setRestTimer(60);
    setActiveTab('live-workout');
  };

  const handleNextSet = () => {
    if (!todaysWorkout) return;

    const currentExercise = todaysWorkout.exercises[currentExerciseIndex];
    const totalSets = currentExercise.sets;

    if (currentSetNumber < totalSets) {
      // More sets remaining for this exercise - start rest timer
      setIsExerciseTransition(false);
      setIsResting(true);
      setRestTimer(60);
    } else {
      // All sets completed - start rest before moving to next exercise
      if (currentExerciseIndex < todaysWorkout.exercises.length - 1) {
        setIsExerciseTransition(true);
        setIsResting(true);
        setRestTimer(60);
      }
    }
  };

  const handleSkipRest = () => {
    if (isExerciseTransition) {
      // Move to next exercise with set 1
      setCurrentExerciseIndex((i) => i + 1);
      setCurrentSetNumber(1);
      setIsExerciseTransition(false);
    } else {
      // Move to next set of same exercise
      setCurrentSetNumber((prev) => prev + 1);
    }

    setIsResting(false);
    setRestTimer(60);
  };

  const handleNextExercise = () => {
    if (todaysWorkout && currentExerciseIndex < todaysWorkout.exercises.length - 1) {
      setCurrentExerciseIndex((prev) => prev + 1);
      setCurrentSetNumber(1);
      setIsResting(false);
      setRestTimer(60);
    }
  };

  const handleDeleteSet = (id: string) => {
    setWorkoutSets((prev) => prev.filter((set) => set.id !== id));
  };

  const handleLogSet = () => {
    if (!todaysWorkout) return;

    const exerciseName = isExerciseTransition
      ? todaysWorkout.exercises[currentExerciseIndex]?.name
      : todaysWorkout.exercises[currentExerciseIndex]?.name;

    const setNumber = isExerciseTransition
      ? todaysWorkout.exercises[currentExerciseIndex]?.sets
      : currentSetNumber - 1 || currentSetNumber;

    const newSet: WorkoutSet = {
      id: Date.now().toString(),
      exercise: exerciseName,
      reps: logReps,
      weight: logWeight,
    };

    setWorkoutSets((prev) => [...prev, newSet]);
    setShowLogModal(false);
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <section className="mb-6">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3">
            Welcome back, <span className="gradient-text">Paritosh</span>
          </h1>
          <p className="text-gray-400 text-lg">Track your workout progress and crush your goals.</p>
        </section>

        {/* Tab Navigation */}
        <section className="mb-8">
          <div className="flex gap-2 p-1 bg-white/5 rounded-2xl w-fit">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Dashboard
              </span>
            </button>
            <button
              onClick={() => setActiveTab('todays-workout')}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === 'todays-workout'
                  ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
                Today&apos;s Workout
              </span>
            </button>
          </div>
        </section>

        {/* Dashboard Tab Content */}
        {activeTab === 'dashboard' && (
          <div className="animate-slide-up">
            {/* Stats Cards */}
            <section className="grid grid-cols-2 gap-4 mb-8">
              <Card className="text-center">
                <p className="text-3xl font-bold text-accent">12</p>
                <p className="text-gray-400 text-sm">This Week</p>
              </Card>
              <Card className="text-center">
                <p className="text-3xl font-bold text-green-400">5</p>
                <p className="text-gray-400 text-sm">Day Streak</p>
              </Card>
            </section>

            {/* Main Grid */}
            <section className="grid lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Today's Workout */}
                <Card>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Today&apos;s Workout</p>
                      <h2 className="text-xl font-bold text-white">{todaysWorkout ? todaysWorkout.name : 'Rest Day'}</h2>
                    </div>
                  </div>

                  {todaysWorkout ? (
                    <button
                      onClick={() => setActiveTab('todays-workout')}
                      className="w-full py-3 bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80 rounded-xl font-semibold transition-all"
                    >
                      View Workout
                    </button>
                  ) : (
                    <p className="text-gray-400 text-center py-4">Take it easy! Recovery is important.</p>
                  )}
                </Card>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Quick Tips */}
                <Card>
                  <h3 className="text-lg font-bold mb-4">Quick Tips</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-400">Rest 60-90 seconds between sets for hypertrophy</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-400">Progressive overload: add weight or reps each session</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-400">Log every set to track your progress over time</p>
                    </div>
                  </div>
                </Card>
              </div>
            </section>
          </div>
        )}

        {/* Today's Workout Tab Content */}
        {activeTab === 'todays-workout' && (
          <div className="animate-slide-up">
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <button
                onClick={() => setActiveTab('workout-plan')}
                className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/50 rounded-2xl transition-all group"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-white">View Workout Plan</p>
                  <p className="text-sm text-gray-400">See your training schedule</p>
                </div>
              </button>

              <button
                onClick={handleStartWorkout}
                className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80 rounded-2xl transition-all"
              >
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-white">Start</p>
                  <p className="text-sm text-white/70">Begin your workout</p>
                </div>
              </button>
            </div>

            {/* Today's Workout Based on Day */}
            {todaysWorkout ? (
              <Card className="overflow-hidden">
                {/* Day Header */}
                <div className={`bg-gradient-to-r ${todaysWorkout.color} p-4 -m-6 mb-6`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-white">{todaysWorkout.name}</h3>
                      <p className="text-white/80">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="bg-white/20 px-3 py-1 rounded-full">
                      <span className="text-white text-sm font-medium">{todaysWorkout.exercises.length} exercises</span>
                    </div>
                  </div>
                </div>

                {/* Exercises List */}
                <div className="space-y-3">
                  {todaysWorkout.exercises.map((exercise, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <span className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-lg font-bold text-gray-300">
                          {index + 1}
                        </span>
                        <span className="font-semibold text-white text-lg">{exercise.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-primary font-bold text-lg">{exercise.sets} sets</p>
                        <p className="text-gray-400 text-sm">{exercise.reps} reps</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ) : (
              <Card className="text-center py-16">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-gray-300 mb-2">Rest Day</h3>
                <p className="text-gray-500">Take it easy today! Recovery is part of the process.</p>
              </Card>
            )}
          </div>
        )}

        {/* Your Workout Plan Tab Content */}
        {activeTab === 'workout-plan' && (
          <div className="animate-slide-up">
            {/* Back Button */}
            <button
              onClick={() => setActiveTab('todays-workout')}
              className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Today&apos;s Workout
            </button>

            {/* Plan Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Push Pull Legs</h2>
              <p className="text-gray-400">6-day split with rest on Sunday</p>
            </div>

            {/* Workout Days */}
            <div className="space-y-6">
              {WORKOUT_PLAN.map((workout) => (
                <Card key={workout.id} className="overflow-hidden">
                  {/* Day Header */}
                  <div className={`bg-gradient-to-r ${workout.color} p-4 -m-6 mb-6`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-white">{workout.name}</h3>
                        <p className="text-white/80 text-sm">{workout.day}</p>
                      </div>
                      <div className="bg-white/20 px-3 py-1 rounded-full">
                        <span className="text-white text-sm font-medium">{workout.exercises.length} exercises</span>
                      </div>
                    </div>
                  </div>

                  {/* Exercises List */}
                  <div className="space-y-3">
                    {workout.exercises.map((exercise, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-sm font-medium text-gray-400">
                            {index + 1}
                          </span>
                          <span className="font-medium text-white">{exercise.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-primary font-semibold">{exercise.sets} x {exercise.reps}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Live Workout Tab Content */}
        {activeTab === 'live-workout' && todaysWorkout && (
          <div className="animate-slide-up">
            {/* Timer */}
            <Card className="mb-6">
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-2">Workout Time</p>
                <p className="text-5xl font-bold gradient-text">{formatTimer(workoutTimer)}</p>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  <span className="text-green-400 text-sm font-medium">Live</span>
                </div>
              </div>
            </Card>

            {/* Rest Timer Overlay */}
            {isResting ? (
              <Card className="mb-6 overflow-hidden">
                <div className="bg-gradient-to-r from-accent to-primary p-4 -m-6 mb-6">
                  <p className="text-white/80 text-sm">Rest Time</p>
                  <h3 className="text-xl font-bold text-white">Take a breather</h3>
                </div>

                {/* Circular Timer */}
                <div className="relative w-48 h-48 mx-auto mb-6">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      stroke="rgba(255, 255, 255, 0.1)"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      stroke="url(#restGradient)"
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={553}
                      strokeDashoffset={553 - (553 * (60 - restTimer)) / 60}
                      className="transition-all duration-1000"
                    />
                    <defs>
                      <linearGradient id="restGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#6366f1" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-bold text-white">{restTimer}</span>
                    <span className="text-gray-400">seconds</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowLogModal(true)}
                    className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition-all"
                  >
                    Log Last Set
                  </button>
                  <button
                    onClick={handleSkipRest}
                    className="flex-1 py-3 bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80 rounded-xl font-semibold transition-all"
                  >
                    Skip Rest
                  </button>
                </div>
              </Card>
            ) : (
              /* Current Exercise */
              <Card className="overflow-hidden mb-6">
                <div className={`bg-gradient-to-r ${todaysWorkout.color} p-4 -m-6 mb-6`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-sm">Current Exercise</p>
                      <h3 className="text-2xl font-bold text-white">
                        {todaysWorkout.exercises[currentExerciseIndex]?.name}
                      </h3>
                    </div>
                    <div className="bg-white/20 px-3 py-1 rounded-full">
                      <span className="text-white text-sm font-medium">
                        {currentExerciseIndex + 1} / {todaysWorkout.exercises.length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Set Progress */}
                <div className="text-center mb-4">
                  <p className="text-gray-400 text-sm">Current Set</p>
                  <p className="text-4xl font-bold gradient-text">
                    {currentSetNumber} / {todaysWorkout.exercises[currentExerciseIndex]?.sets}
                  </p>
                </div>

                {/* Exercise Details */}
                <div className="flex justify-around py-4 mb-6 bg-white/5 rounded-xl">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">
                      {todaysWorkout.exercises[currentExerciseIndex]?.reps}
                    </p>
                    <p className="text-gray-400 text-sm">Reps</p>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      if (currentSetNumber > 1) {
                        setCurrentSetNumber((prev) => prev - 1);
                      } else if (currentExerciseIndex > 0) {
                        setCurrentExerciseIndex((prev) => prev - 1);
                        const prevExercise = todaysWorkout.exercises[currentExerciseIndex - 1];
                        setCurrentSetNumber(prevExercise.sets);
                      }
                    }}
                    disabled={currentExerciseIndex === 0 && currentSetNumber === 1}
                    className="flex-1 py-3 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold transition-all"
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleNextSet}
                    disabled={
                      currentExerciseIndex === todaysWorkout.exercises.length - 1 &&
                      currentSetNumber === todaysWorkout.exercises[currentExerciseIndex]?.sets
                    }
                    className="flex-1 py-3 bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold transition-all"
                  >
                    Next
                  </button>
                </div>
              </Card>
            )}

            {/* End Workout Button */}
            <button
              onClick={() => {
                setIsWorkoutRunning(false);
                setIsResting(false);
                setActiveTab('todays-workout');
              }}
              className="w-full py-4 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 rounded-xl font-semibold transition-all"
            >
              End Workout
            </button>

            {/* Log Set Modal */}
            {showLogModal && (
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <Card className="w-full max-w-md">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">Log Set</h3>
                    <button
                      onClick={() => setShowLogModal(false)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <p className="text-gray-400 mb-6">
                    {todaysWorkout?.exercises[currentExerciseIndex]?.name}
                  </p>

                  {/* Weight Input */}
                  <div className="mb-6">
                    <label className="block text-gray-400 text-sm mb-3">Weight (kg)</label>
                    <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4">
                      <button
                        onClick={() => setLogWeight((prev) => Math.max(0, prev - 2.5))}
                        className="w-12 h-12 bg-primary/20 hover:bg-primary/40 rounded-xl flex items-center justify-center transition-all"
                      >
                        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <div className="text-center">
                        <input
                          type="number"
                          value={logWeight}
                          onChange={(e) => setLogWeight(Number(e.target.value))}
                          className="w-24 bg-transparent text-center text-4xl font-bold text-white focus:outline-none"
                        />
                        <p className="text-gray-500 text-sm">kg</p>
                      </div>
                      <button
                        onClick={() => setLogWeight((prev) => prev + 2.5)}
                        className="w-12 h-12 bg-primary/20 hover:bg-primary/40 rounded-xl flex items-center justify-center transition-all"
                      >
                        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Reps Input */}
                  <div className="mb-6">
                    <label className="block text-gray-400 text-sm mb-3">Reps</label>
                    <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4">
                      <button
                        onClick={() => setLogReps((prev) => Math.max(1, prev - 1))}
                        className="w-12 h-12 bg-secondary/20 hover:bg-secondary/40 rounded-xl flex items-center justify-center transition-all"
                      >
                        <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <div className="text-center">
                        <input
                          type="number"
                          value={logReps}
                          onChange={(e) => setLogReps(Number(e.target.value))}
                          className="w-24 bg-transparent text-center text-4xl font-bold text-white focus:outline-none"
                        />
                        <p className="text-gray-500 text-sm">reps</p>
                      </div>
                      <button
                        onClick={() => setLogReps((prev) => prev + 1)}
                        className="w-12 h-12 bg-secondary/20 hover:bg-secondary/40 rounded-xl flex items-center justify-center transition-all"
                      >
                        <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={handleLogSet}
                    className="w-full py-4 bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80 rounded-xl font-semibold text-lg transition-all"
                  >
                    Save Set
                  </button>
                </Card>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
