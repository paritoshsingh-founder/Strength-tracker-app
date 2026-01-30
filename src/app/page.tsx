'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout';
import { Card } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

type TabType = 'todays-workout' | 'workout-plan' | 'live-workout' | 'progress';

interface ProgressData {
  date: string;
  minWeight: number;
  maxWeight: number;
  volume: number;
}

type ChartMetric = 'weight' | 'volume';

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

const DEFAULT_WORKOUT_PLAN: WorkoutDay[] = [
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
  if (day === 1 || day === 4) return DEFAULT_WORKOUT_PLAN[0];

  // Pull Day: Tuesday (2) and Friday (5)
  if (day === 2 || day === 5) return DEFAULT_WORKOUT_PLAN[1];

  // Legs Day: Wednesday (3) and Saturday (6)
  if (day === 3 || day === 6) return DEFAULT_WORKOUT_PLAN[2];

  // Sunday (0) - Rest day
  return null;
};

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('todays-workout');
  const [workoutSets, setWorkoutSets] = useState<WorkoutSet[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetNumber, setCurrentSetNumber] = useState(1);
  const [workoutTimer, setWorkoutTimer] = useState(0);
  const [workoutStartTime, setWorkoutStartTime] = useState<number | null>(null);
  const [isWorkoutRunning, setIsWorkoutRunning] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [restTimer, setRestTimer] = useState(60);
  const [restEndTime, setRestEndTime] = useState<number | null>(null);
  const [isExerciseTransition, setIsExerciseTransition] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logWeight, setLogWeight] = useState(20);
  const [logReps, setLogReps] = useState(10);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [weeklyWorkouts, setWeeklyWorkouts] = useState(0);
  const [dayStreak, setDayStreak] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>('Bench Press');
  const [availableExercises, setAvailableExercises] = useState<string[]>([]);
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);
  const [chartMetric, setChartMetric] = useState<ChartMetric>('weight');
  const [quickLogExercise, setQuickLogExercise] = useState<string | null>(null);
  const [showQuickLogModal, setShowQuickLogModal] = useState(false);
  const [quickLogSessionId, setQuickLogSessionId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedEditDay, setSelectedEditDay] = useState<string | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutDay[] | null>(null);
  const [isWorkoutPlanLoading, setIsWorkoutPlanLoading] = useState(true);
  const [draftWorkoutPlan, setDraftWorkoutPlan] = useState<WorkoutDay[]>(DEFAULT_WORKOUT_PLAN);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseSets, setNewExerciseSets] = useState(3);
  const [newExerciseReps, setNewExerciseReps] = useState('10-10-10');
  const [showEditExerciseModal, setShowEditExerciseModal] = useState(false);
  const [editingExerciseIndex, setEditingExerciseIndex] = useState<number | null>(null);
  const [editingWorkoutIndex, setEditingWorkoutIndex] = useState<number | null>(null);
  const [editExerciseSets, setEditExerciseSets] = useState(3);
  const [editExerciseReps, setEditExerciseReps] = useState('10-10-10');

  const isValidEditReps = () => {
    const repNumbers = editExerciseReps.split('-').filter(r => r.trim() !== '');
    return repNumbers.length === editExerciseSets && repNumbers.every(r => !isNaN(Number(r.trim())));
  };

  const getEditRepPlaceholder = () => {
    return Array(editExerciseSets).fill('10').join('-');
  };

  const handleOpenEditExercise = (workoutIndex: number, exerciseIndex: number) => {
    if (!workoutPlan) return;
    const exercise = workoutPlan[workoutIndex].exercises[exerciseIndex];
    setEditingWorkoutIndex(workoutIndex);
    setEditingExerciseIndex(exerciseIndex);
    setEditExerciseSets(exercise.sets);
    setEditExerciseReps(exercise.reps);
    setShowEditExerciseModal(true);
  };

  const handleSaveEditExercise = () => {
    if (editingWorkoutIndex === null || editingExerciseIndex === null || !workoutPlan) return;

    setWorkoutPlan(prev => {
      if (!prev) return prev;
      const newPlan = [...prev];
      const exercises = [...newPlan[editingWorkoutIndex].exercises];
      exercises[editingExerciseIndex] = {
        ...exercises[editingExerciseIndex],
        sets: editExerciseSets,
        reps: editExerciseReps
      };
      newPlan[editingWorkoutIndex] = {
        ...newPlan[editingWorkoutIndex],
        exercises
      };
      saveWorkoutPlanToDb(newPlan);
      return newPlan;
    });

    setShowEditExerciseModal(false);
    setEditingExerciseIndex(null);
    setEditingWorkoutIndex(null);
  };

  const isValidReps = () => {
    const repNumbers = newExerciseReps.split('-').filter(r => r.trim() !== '');
    return repNumbers.length === newExerciseSets && repNumbers.every(r => !isNaN(Number(r.trim())));
  };

  const getRepPlaceholder = () => {
    return Array(newExerciseSets).fill('10').join('-');
  };

  const handleAddExercise = () => {
    if (!newExerciseName.trim() || !selectedEditDay || !workoutPlan) return;

    const workoutIndex = selectedEditDay === 'Mon' || selectedEditDay === 'Thu' ? 0 :
      selectedEditDay === 'Tue' || selectedEditDay === 'Fri' ? 1 : 2;

    setWorkoutPlan(prev => {
      if (!prev) return prev;
      const newPlan = [...prev];
      newPlan[workoutIndex] = {
        ...newPlan[workoutIndex],
        exercises: [...newPlan[workoutIndex].exercises, { name: newExerciseName.trim(), sets: newExerciseSets, reps: newExerciseReps }]
      };
      saveWorkoutPlanToDb(newPlan);
      return newPlan;
    });

    setNewExerciseName('');
    setNewExerciseSets(3);
    setNewExerciseReps('10-10-10');
    setShowAddExerciseModal(false);
  };

  const handleDeleteExercise = (workoutIndex: number, exerciseIndex: number) => {
    if (!workoutPlan) return;
    setWorkoutPlan(prev => {
      if (!prev) return prev;
      const newPlan = [...prev];
      newPlan[workoutIndex] = {
        ...newPlan[workoutIndex],
        exercises: newPlan[workoutIndex].exercises.filter((_, i) => i !== exerciseIndex)
      };
      saveWorkoutPlanToDb(newPlan);
      return newPlan;
    });
  };

  const handleSaveWorkoutPlan = () => {
    setWorkoutPlan(draftWorkoutPlan);
    setHasUnsavedChanges(false);
  };

  // Load workout plan from database on mount
  useEffect(() => {
    const loadWorkoutPlan = async () => {
      if (!user) return;

      console.log('Loading workout plan for user:', user.id);

      const { data, error } = await supabase
        .from('user_workout_plans')
        .select('workout_plan')
        .eq('user_id', user.id)
        .single();

      console.log('Load result:', { data, error });

      if (data && !error) {
        setWorkoutPlan(data.workout_plan);
        console.log('Workout plan loaded successfully');
      } else {
        // No saved plan or error - use default
        setWorkoutPlan(DEFAULT_WORKOUT_PLAN);
        if (error && error.code !== 'PGRST116') {
          console.error('Failed to load workout plan:', error);
        }
      }
      setIsWorkoutPlanLoading(false);
    };

    loadWorkoutPlan();
  }, [user]);

  // Save workout plan to database when it changes
  const saveWorkoutPlanToDb = async (plan: WorkoutDay[]) => {
    if (!user) return;

    console.log('Saving workout plan for user:', user.id);

    const { data, error } = await supabase
      .from('user_workout_plans')
      .upsert({
        user_id: user.id,
        workout_plan: plan,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select();

    if (error) {
      console.error('Failed to save workout plan:', error);
      alert('Failed to save: ' + error.message);
    } else {
      console.log('Workout plan saved successfully:', data);
    }
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Generate calendar days for the current month
  const getCalendarDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty slots for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const calendarDays = getCalendarDays(calendarMonth);

  // Get workout for a specific date
  const getWorkoutForDate = (date: Date): WorkoutDay | null => {
    if (!workoutPlan) return null;
    const day = date.getDay();
    if (day === 1 || day === 4) return workoutPlan[0]; // Push
    if (day === 2 || day === 5) return workoutPlan[1]; // Pull
    if (day === 3 || day === 6) return workoutPlan[2]; // Legs
    return null; // Sunday - Rest
  };

  const selectedWorkout = getWorkoutForDate(selectedDate);
  const todaysWorkout = getWorkoutForDate(new Date());

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isFutureDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate > today;
  };

  // Fetch stats when user is available
  useEffect(() => {
    if (user) {
      fetchStats();
      fetchAvailableExercises();
    }
  }, [user]);

  // Fetch progress data when exercise changes or tab changes to progress
  useEffect(() => {
    if (activeTab === 'progress' && selectedExercise) {
      fetchProgressData(selectedExercise);
    }
  }, [activeTab, selectedExercise]);

  const fetchAvailableExercises = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('workout_sets')
      .select('exercise_name')
      .eq('user_id', user.id)
      .order('exercise_name');

    if (data) {
      const uniqueExercises = [...new Set(data.map((d) => d.exercise_name))];
      setAvailableExercises(uniqueExercises);
      if (uniqueExercises.length > 0 && !uniqueExercises.includes(selectedExercise)) {
        setSelectedExercise(uniqueExercises[0]);
      }
    }
  };

  const fetchProgressData = async (exerciseName: string) => {
    if (!user) return;

    setIsLoadingProgress(true);

    const { data } = await supabase
      .from('workout_sets')
      .select(`
        weight,
        reps,
        logged_at,
        session_id,
        workout_sessions!inner(started_at)
      `)
      .eq('exercise_name', exerciseName)
      .eq('user_id', user.id)
      .order('logged_at', { ascending: true });

    if (data && data.length > 0) {
      // Group by session/date and calculate min/max weight and total volume
      const groupedByDate: Record<string, { weights: number[]; volume: number; timestamp: number }> = {};

      data.forEach((set: any) => {
        const sessionDate = new Date(set.workout_sessions.started_at);
        const dateKey = sessionDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
        if (!groupedByDate[dateKey]) {
          groupedByDate[dateKey] = { weights: [], volume: 0, timestamp: sessionDate.getTime() };
        }
        const weight = Number(set.weight);
        const reps = Number(set.reps);
        groupedByDate[dateKey].weights.push(weight);
        groupedByDate[dateKey].volume += weight * reps; // Volume = weight × reps
      });

      // Sort by timestamp (oldest first, newest last - left to right)
      const chartData: ProgressData[] = Object.entries(groupedByDate)
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .map(([date, { weights, volume }]) => ({
          date,
          minWeight: Math.min(...weights),
          maxWeight: Math.max(...weights),
          volume,
        }));

      setProgressData(chartData);
    } else {
      setProgressData([]);
    }

    setIsLoadingProgress(false);
  };

  const fetchStats = async () => {
    if (!user) return;

    // Get workouts this week
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from('workout_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('started_at', startOfWeek.toISOString());

    setWeeklyWorkouts(count || 0);

    // Calculate day streak
    const { data: sessions } = await supabase
      .from('workout_sessions')
      .select('started_at')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(30);

    if (sessions && sessions.length > 0) {
      let streak = 0;
      let currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      for (const session of sessions) {
        const sessionDate = new Date(session.started_at);
        sessionDate.setHours(0, 0, 0, 0);

        const diffDays = Math.floor((currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === streak || diffDays === streak + 1) {
          streak = diffDays + 1;
        } else {
          break;
        }
      }
      setDayStreak(streak);
    }
  };

  // Workout timer effect - uses timestamp to handle background/lock correctly
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isWorkoutRunning && workoutStartTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - workoutStartTime) / 1000);
        setWorkoutTimer(elapsed);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isWorkoutRunning, workoutStartTime]);

  // Rest timer effect - uses timestamp to handle background/lock correctly
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isResting && restEndTime) {
      interval = setInterval(() => {
        const remaining = Math.ceil((restEndTime - Date.now()) / 1000);

        if (remaining <= 0) {
          // Timer completed - vibrate phone
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([200, 100, 200]); // Vibrate pattern: 200ms on, 100ms off, 200ms on
          }
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
          setRestEndTime(null);
          setRestTimer(60);
        } else {
          setRestTimer(remaining);
        }
      }, 500); // Check more frequently to catch completion even after background
    }
    return () => clearInterval(interval);
  }, [isResting, restEndTime, isExerciseTransition]);

  const formatTimer = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartWorkout = async () => {
    setCurrentExerciseIndex(0);
    setCurrentSetNumber(1);
    setWorkoutTimer(0);
    setWorkoutStartTime(Date.now());
    setIsWorkoutRunning(true);
    setIsResting(false);
    setRestTimer(60);
    setRestEndTime(null);
    setWorkoutSets([]);
    setActiveTab('live-workout');

    // Create workout session in Supabase
    if (todaysWorkout && user) {
      console.log('Creating workout session...');
      const { data, error } = await supabase
        .from('workout_sessions')
        .insert({
          workout_type: todaysWorkout.name,
          started_at: new Date().toISOString(),
          user_id: user.id,
        })
        .select()
        .single();

      console.log('Session result:', { data, error });

      if (data && !error) {
        setCurrentSessionId(data.id);
      } else if (error) {
        console.error('Error creating session:', error);
      }
    }
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
      setRestEndTime(Date.now() + 60000); // 60 seconds from now
    } else {
      // All sets completed - start rest before moving to next exercise
      if (currentExerciseIndex < todaysWorkout.exercises.length - 1) {
        setIsExerciseTransition(true);
        setIsResting(true);
        setRestTimer(60);
        setRestEndTime(Date.now() + 60000); // 60 seconds from now
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
    setRestEndTime(null);
  };

  const handleNextExercise = () => {
    if (todaysWorkout && currentExerciseIndex < todaysWorkout.exercises.length - 1) {
      setCurrentExerciseIndex((prev) => prev + 1);
      setCurrentSetNumber(1);
      setIsResting(false);
      setRestTimer(60);
      setRestEndTime(null);
    }
  };

  const handleDeleteSet = (id: string) => {
    setWorkoutSets((prev) => prev.filter((set) => set.id !== id));
  };

  const handleLogSet = async () => {
    if (!todaysWorkout) return;

    setIsSaving(true);

    const exerciseName = isExerciseTransition
      ? todaysWorkout.exercises[currentExerciseIndex]?.name
      : todaysWorkout.exercises[currentExerciseIndex]?.name;

    const setNumber = isExerciseTransition
      ? todaysWorkout.exercises[currentExerciseIndex]?.sets
      : currentSetNumber - 1 || currentSetNumber;

    // Save to Supabase
    if (!user) return;

    console.log('Logging set with session_id:', currentSessionId);
    const { data, error } = await supabase
      .from('workout_sets')
      .insert({
        session_id: currentSessionId,
        exercise_name: exerciseName,
        set_number: setNumber,
        weight: logWeight,
        reps: logReps,
        user_id: user.id,
      })
      .select()
      .single();

    console.log('Log set result:', { data, error });

    if (data && !error) {
      const newSet: WorkoutSet = {
        id: data.id,
        exercise: exerciseName,
        reps: logReps,
        weight: logWeight,
      };
      setWorkoutSets((prev) => [...prev, newSet]);
    } else if (error) {
      console.error('Error logging set:', error);
    }

    setIsSaving(false);
    setShowLogModal(false);
  };

  const handleOpenQuickLog = async (exerciseName: string) => {
    if (!user) return;

    setQuickLogExercise(exerciseName);
    setShowQuickLogModal(true);

    // Check if we have a session for selected date, if not create one
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Check for existing session on selected date
    const { data: existingSession } = await supabase
      .from('workout_sessions')
      .select('id')
      .eq('user_id', user.id)
      .gte('started_at', startOfDay.toISOString())
      .lte('started_at', endOfDay.toISOString())
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (existingSession) {
      setQuickLogSessionId(existingSession.id);
    } else if (selectedWorkout) {
      // Create new session for selected date
      const sessionDate = new Date(selectedDate);
      sessionDate.setHours(12, 0, 0, 0); // Set to noon of selected day

      const { data: newSession } = await supabase
        .from('workout_sessions')
        .insert({
          workout_type: selectedWorkout.name,
          started_at: sessionDate.toISOString(),
          user_id: user.id,
        })
        .select()
        .single();

      if (newSession) {
        setQuickLogSessionId(newSession.id);
      }
    }
  };

  const handleQuickLogSet = async () => {
    if (!quickLogExercise || !quickLogSessionId || !user) return;

    setIsSaving(true);

    const { data, error } = await supabase
      .from('workout_sets')
      .insert({
        session_id: quickLogSessionId,
        exercise_name: quickLogExercise,
        set_number: 1,
        weight: logWeight,
        reps: logReps,
        user_id: user.id,
      })
      .select()
      .single();

    console.log('Quick log result:', { data, error });

    if (error) {
      console.error('Error quick logging set:', error);
    }

    setIsSaving(false);
    setShowQuickLogModal(false);
    setQuickLogExercise(null);
    fetchAvailableExercises(); // Refresh exercise list for progress tab
  };

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  // Show loading state while loading workout plan from database
  if (isWorkoutPlanLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Tab Navigation */}
        <section className="mb-8">
          <div className="flex gap-2 p-1 bg-white/5 rounded-2xl w-fit">
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
                Workout Plan
              </span>
            </button>
            <button
              onClick={() => setActiveTab('progress')}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === 'progress'
                  ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
                Progress
              </span>
            </button>
          </div>
        </section>

        {/* Today's Workout Tab Content */}
        {activeTab === 'todays-workout' && (
          <div className="animate-slide-up">
            {/* Date Selector */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                {/* Calendar Toggle Button */}
                <button
                  onClick={() => {
                    setShowCalendar(!showCalendar);
                    setCalendarMonth(selectedDate);
                  }}
                  className="w-10 h-10 bg-gradient-to-br from-primary to-secondary hover:opacity-80 rounded-lg flex items-center justify-center transition-all"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>

                {/* View Workout Plan Button */}
                <button
                  onClick={() => setActiveTab('workout-plan')}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-gray-300 hover:text-white transition-all"
                >
                  View Workout Plan
                </button>
              </div>

              {/* Calendar Popup */}
              {showCalendar && (
                <Card className="mb-4 max-w-xs">
                  {/* Calendar Header */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}
                      className="p-2 hover:bg-white/10 rounded-lg transition-all"
                    >
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <h3 className="text-lg font-bold text-white">
                      {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h3>
                    <button
                      onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}
                      className="p-2 hover:bg-white/10 rounded-lg transition-all"
                    >
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {/* Day Labels */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} className="text-center text-xs text-gray-500 py-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Days */}
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((date, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          if (date) {
                            setSelectedDate(date);
                            setQuickLogSessionId(null);
                            setShowCalendar(false);
                          }
                        }}
                        disabled={!date}
                        className={`aspect-square flex items-center justify-center rounded-lg text-sm transition-all ${
                          !date
                            ? 'invisible'
                            : date.toDateString() === selectedDate.toDateString()
                            ? 'bg-gradient-to-r from-primary to-secondary text-white font-bold'
                            : isToday(date)
                            ? 'bg-white/10 text-white font-bold'
                            : 'text-gray-400 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {date?.getDate()}
                      </button>
                    ))}
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
                    <button
                      onClick={() => {
                        setSelectedDate(new Date());
                        setQuickLogSessionId(null);
                        setShowCalendar(false);
                      }}
                      className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-gray-300 transition-all"
                    >
                      Today
                    </button>
                    <button
                      onClick={() => setShowCalendar(false)}
                      className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-gray-300 transition-all"
                    >
                      Close
                    </button>
                  </div>
                </Card>
              )}
            </div>

            {/* Workout Based on Selected Date */}
            {selectedWorkout ? (
              <Card className="overflow-hidden">
                {/* Day Header */}
                <div className="bg-white/5 border-b border-white/10 p-4 -m-6 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">
                        {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="bg-white/20 px-3 py-1 rounded-full">
                        <span className="text-white text-sm font-medium">{selectedWorkout.exercises.length} exercises</span>
                      </div>
                      {isToday(selectedDate) && (
                        <button
                          onClick={handleStartWorkout}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded-full font-medium text-sm text-white transition-all"
                        >
                          Start
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Exercises List */}
                <div className="space-y-2">
                  {selectedWorkout.exercises.map((exercise, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center text-sm font-bold text-gray-300">
                          {index + 1}
                        </span>
                        <span className="font-semibold text-white text-sm">{exercise.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-primary font-bold text-sm">{exercise.sets} sets</p>
                          <p className="text-gray-400 text-xs">{exercise.reps} reps</p>
                        </div>
                        {!isFutureDate(selectedDate) && (
                          <button
                            onClick={() => handleOpenQuickLog(exercise.name)}
                            className="px-3 py-1.5 bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80 rounded-lg font-medium text-xs transition-all"
                          >
                            Log
                          </button>
                        )}
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
                <p className="text-gray-500">Take it easy! Recovery is part of the process.</p>
              </Card>
            )}
          </div>
        )}

        {/* Your Workout Plan Tab Content */}
        {activeTab === 'workout-plan' && (
          <div className="animate-slide-up">
            {/* Back Button */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setActiveTab('todays-workout')}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              <button
                onClick={() => setIsEditMode(!isEditMode)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isEditMode
                    ? 'bg-gray-600 hover:bg-gray-700 text-white'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                {isEditMode ? 'Done' : 'Edit'}
              </button>
            </div>

            {/* Days of the Week */}
            <div className="flex gap-2 mb-6">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedEditDay(selectedEditDay === day ? null : day)}
                  className={`flex-1 py-3 rounded-lg text-sm font-medium transition-colors ${
                    selectedEditDay === day
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/5 hover:bg-white/10 text-white'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>

            {/* Exercises for Selected Day */}
            {selectedEditDay && (
              <Card>
                {selectedEditDay === 'Sun' ? (
                  <p className="text-gray-400">Take it easy! Recovery is part of the process.</p>
                ) : (
                  <div className="space-y-2">
                    {isEditMode && (
                      <button
                        onClick={() => setShowAddExerciseModal(true)}
                        className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium text-white transition-all mb-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Exercise
                      </button>
                    )}
                    {(() => {
                      if (!workoutPlan) return null;
                      const workoutIndex = selectedEditDay === 'Mon' || selectedEditDay === 'Thu' ? 0 :
                        selectedEditDay === 'Tue' || selectedEditDay === 'Fri' ? 1 : 2;
                      return workoutPlan[workoutIndex].exercises.map((exercise, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-white/5 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 bg-white/10 rounded flex items-center justify-center text-xs font-medium text-gray-400">
                              {index + 1}
                            </span>
                            <span className="font-medium text-white text-sm">{exercise.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-primary font-semibold text-sm">{exercise.sets} x {exercise.reps}</span>
                            {isEditMode && (
                              <>
                                <button
                                  onClick={() => handleOpenEditExercise(workoutIndex, index)}
                                  className="p-1 text-gray-400 hover:text-purple-400 transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDeleteExercise(workoutIndex, index)}
                                  className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </Card>
            )}

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
              onClick={async () => {
                // Update session with end time
                if (currentSessionId) {
                  await supabase
                    .from('workout_sessions')
                    .update({
                      ended_at: new Date().toISOString(),
                      total_duration: workoutTimer,
                    })
                    .eq('id', currentSessionId);
                }

                setIsWorkoutRunning(false);
                setWorkoutStartTime(null);
                setIsResting(false);
                setRestEndTime(null);
                setCurrentSessionId(null);
                setActiveTab('todays-workout');
                fetchStats(); // Refresh stats
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
                    disabled={isSaving}
                    className="w-full py-4 bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80 disabled:opacity-50 rounded-xl font-semibold text-lg transition-all"
                  >
                    {isSaving ? 'Saving...' : 'Save Set'}
                  </button>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Progress Tab Content */}
        {activeTab === 'progress' && (
          <div className="animate-slide-up">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Progress Tracker</h2>
              <p className="text-gray-400">Track your strength gains over time</p>
            </div>

            {/* Exercise Selector */}
            <Card className="mb-6">
              <label className="block text-gray-400 text-sm mb-3">Select Exercise</label>
              <select
                value={selectedExercise}
                onChange={(e) => setSelectedExercise(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-primary/50"
              >
                {availableExercises.length > 0 ? (
                  availableExercises.map((exercise) => (
                    <option key={exercise} value={exercise} className="bg-gray-900">
                      {exercise}
                    </option>
                  ))
                ) : (
                  <option value="" className="bg-gray-900">No exercises logged yet</option>
                )}
              </select>
            </Card>

            {/* Chart */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">
                  {chartMetric === 'weight' ? 'Weight Range Over Time' : 'Total Volume Over Time'}
                </h3>
                <select
                  value={chartMetric}
                  onChange={(e) => setChartMetric(e.target.value as ChartMetric)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-primary/50"
                >
                  <option value="weight" className="bg-gray-900">Weight Range</option>
                  <option value="volume" className="bg-gray-900">Volume</option>
                </select>
              </div>
              {isLoadingProgress ? (
                <div className="h-80 flex items-center justify-center">
                  <div className="text-gray-400">Loading...</div>
                </div>
              ) : progressData.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={progressData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1} />
                        </linearGradient>
                        <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis
                        dataKey="date"
                        stroke="#9ca3af"
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                      />
                      <YAxis
                        stroke="#9ca3af"
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                        tickFormatter={(value) => chartMetric === 'weight' ? `${value}kg` : `${value}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(17, 24, 39, 0.9)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '12px',
                          color: '#fff',
                        }}
                        formatter={(value, name) => {
                          if (chartMetric === 'volume') {
                            return [`${value} kg`, 'Total Volume'];
                          }
                          return [
                            `${value} kg`,
                            name === 'maxWeight' ? 'Max Weight' : 'Min Weight',
                          ];
                        }}
                      />
                      {chartMetric === 'weight' ? (
                        <>
                          <Legend
                            formatter={(value) => (value === 'maxWeight' ? 'Max Weight' : 'Min Weight')}
                          />
                          <Area
                            type="monotone"
                            dataKey="minWeight"
                            stackId="1"
                            stroke="#06b6d4"
                            fill="transparent"
                            strokeWidth={2}
                          />
                          <Area
                            type="monotone"
                            dataKey="maxWeight"
                            stackId="2"
                            stroke="#6366f1"
                            fill="url(#weightGradient)"
                            strokeWidth={2}
                          />
                        </>
                      ) : (
                        <>
                          <Legend
                            formatter={() => 'Total Volume (weight × reps)'}
                          />
                          <Area
                            type="monotone"
                            dataKey="volume"
                            stroke="#10b981"
                            fill="url(#volumeGradient)"
                            strokeWidth={2}
                          />
                        </>
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">No data yet</h3>
                  <p className="text-gray-500">
                    Start logging your sets to see your progress here!
                  </p>
                </div>
              )}
            </Card>

            {/* Stats Summary */}
            {progressData.length > 0 && (
              <div className="grid grid-cols-2 gap-4 mt-6">
                {chartMetric === 'weight' ? (
                  <>
                    <Card className="text-center">
                      <p className="text-gray-400 text-sm mb-1">Starting Max</p>
                      <p className="text-2xl font-bold text-white">
                        {progressData[0]?.maxWeight} kg
                      </p>
                    </Card>
                    <Card className="text-center">
                      <p className="text-gray-400 text-sm mb-1">Current Max</p>
                      <p className="text-2xl font-bold gradient-text">
                        {progressData[progressData.length - 1]?.maxWeight} kg
                      </p>
                    </Card>
                  </>
                ) : (
                  <>
                    <Card className="text-center">
                      <p className="text-gray-400 text-sm mb-1">Starting Volume</p>
                      <p className="text-2xl font-bold text-white">
                        {progressData[0]?.volume} kg
                      </p>
                    </Card>
                    <Card className="text-center">
                      <p className="text-gray-400 text-sm mb-1">Current Volume</p>
                      <p className="text-2xl font-bold text-green-400">
                        {progressData[progressData.length - 1]?.volume} kg
                      </p>
                    </Card>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Quick Log Modal */}
        {showQuickLogModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Log Set</h3>
                <button
                  onClick={() => {
                    setShowQuickLogModal(false);
                    setQuickLogExercise(null);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-gray-400 mb-6">{quickLogExercise}</p>

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
                onClick={handleQuickLogSet}
                disabled={isSaving}
                className="w-full py-4 bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80 disabled:opacity-50 rounded-xl font-semibold text-lg transition-all"
              >
                {isSaving ? 'Saving...' : 'Save Set'}
              </button>
            </Card>
          </div>
        )}

        {/* Add Exercise Modal */}
        {showAddExerciseModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Add Exercise</h3>
                <button
                  onClick={() => {
                    setShowAddExerciseModal(false);
                    setNewExerciseName('');
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-gray-400 text-sm mb-2">Exercise Name</label>
                <input
                  type="text"
                  value={newExerciseName}
                  onChange={(e) => setNewExerciseName(e.target.value)}
                  placeholder="e.g. Bench Press"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <label className="block text-gray-400 text-sm mb-2">Sets</label>
                  <input
                    type="number"
                    value={newExerciseSets || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        setNewExerciseSets(0);
                      } else {
                        const sets = Math.max(1, Number(value));
                        setNewExerciseSets(sets);
                        setNewExerciseReps(Array(sets).fill('10').join('-'));
                      }
                    }}
                    onBlur={() => {
                      if (newExerciseSets < 1) {
                        setNewExerciseSets(1);
                        setNewExerciseReps('10');
                      }
                    }}
                    min="1"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-gray-400 text-sm mb-2">Reps (per set)</label>
                  <input
                    type="text"
                    value={newExerciseReps}
                    onChange={(e) => setNewExerciseReps(e.target.value)}
                    placeholder={getRepPlaceholder()}
                    className={`w-full bg-white/5 border rounded-xl p-3 text-white placeholder-gray-500 focus:outline-none ${
                      isValidReps() ? 'border-white/10 focus:border-purple-500' : 'border-red-500/50'
                    }`}
                  />
                  <p className="text-gray-500 text-xs mt-1">
                    {newExerciseSets} numbers separated by dashes
                  </p>
                </div>
              </div>

              <button
                onClick={handleAddExercise}
                disabled={!newExerciseName.trim() || !isValidReps()}
                className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold text-lg text-white transition-all"
              >
                Add
              </button>
            </Card>
          </div>
        )}

        {/* Edit Exercise Modal */}
        {showEditExerciseModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Edit Exercise</h3>
                <button
                  onClick={() => {
                    setShowEditExerciseModal(false);
                    setEditingExerciseIndex(null);
                    setEditingWorkoutIndex(null);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <label className="block text-gray-400 text-sm mb-2">Sets</label>
                  <input
                    type="number"
                    value={editExerciseSets || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        setEditExerciseSets(0);
                      } else {
                        const sets = Math.max(1, Number(value));
                        setEditExerciseSets(sets);
                        setEditExerciseReps(Array(sets).fill('10').join('-'));
                      }
                    }}
                    onBlur={() => {
                      if (editExerciseSets < 1) {
                        setEditExerciseSets(1);
                        setEditExerciseReps('10');
                      }
                    }}
                    min="1"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-gray-400 text-sm mb-2">Reps (per set)</label>
                  <input
                    type="text"
                    value={editExerciseReps}
                    onChange={(e) => setEditExerciseReps(e.target.value)}
                    placeholder={getEditRepPlaceholder()}
                    className={`w-full bg-white/5 border rounded-xl p-3 text-white placeholder-gray-500 focus:outline-none ${
                      isValidEditReps() ? 'border-white/10 focus:border-purple-500' : 'border-red-500/50'
                    }`}
                  />
                  <p className="text-gray-500 text-xs mt-1">
                    {editExerciseSets} numbers separated by dashes
                  </p>
                </div>
              </div>

              <button
                onClick={handleSaveEditExercise}
                disabled={!isValidEditReps()}
                className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold text-lg text-white transition-all"
              >
                Save
              </button>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
