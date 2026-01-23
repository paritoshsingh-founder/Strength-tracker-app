export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
}

export interface WorkoutSet {
  id: string;
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  weight: number;
  reps: number;
  completed: boolean;
  timestamp: Date;
}

export interface Workout {
  id: string;
  name: string;
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
  sets: WorkoutSet[];
}
