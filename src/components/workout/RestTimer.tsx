'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';

interface RestTimerProps {
  defaultDuration?: number; // in seconds
  onTimerComplete?: () => void;
}

export default function RestTimer({ defaultDuration = 60, onTimerComplete }: RestTimerProps) {
  const [duration, setDuration] = useState(defaultDuration);
  const [timeLeft, setTimeLeft] = useState(defaultDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const progress = ((duration - timeLeft) / duration) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleComplete = useCallback(() => {
    setIsComplete(true);
    setIsRunning(false);
    if (onTimerComplete) {
      onTimerComplete();
    }
    // Play notification sound (if available)
    if (typeof window !== 'undefined' && 'Notification' in window) {
      new Audio('/notification.mp3').play().catch(() => {});
    }
  }, [onTimerComplete]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, handleComplete]);

  const startTimer = () => {
    setIsRunning(true);
    setIsComplete(false);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(duration);
    setIsComplete(false);
  };

  const setPresetDuration = (seconds: number) => {
    setDuration(seconds);
    setTimeLeft(seconds);
    setIsRunning(false);
    setIsComplete(false);
  };

  return (
    <Card className="w-full">
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center ${isRunning ? 'animate-pulse-glow' : ''}`}>
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white">Rest Timer</h2>
        {isRunning && (
          <span className="ml-auto bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-medium">
            Running
          </span>
        )}
        {isComplete && (
          <span className="ml-auto bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium">
            Complete!
          </span>
        )}
      </div>

      {/* Circular Progress */}
      <div className="relative w-48 h-48 mx-auto mb-6">
        {/* Background circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="96"
            cy="96"
            r="88"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="8"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="96"
            cy="96"
            r="88"
            stroke="url(#gradient)"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={553}
            strokeDashoffset={553 - (553 * progress) / 100}
            className="transition-all duration-1000"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
        </svg>
        {/* Time display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-5xl font-bold ${isComplete ? 'text-green-400' : 'text-white'}`}>
            {formatTime(timeLeft)}
          </span>
          <span className="text-gray-400 text-sm">
            {isComplete ? 'Time\'s up!' : isRunning ? 'remaining' : 'tap to start'}
          </span>
        </div>
      </div>

      {/* Preset Durations */}
      <div className="flex gap-2 mb-6">
        {[30, 60, 90, 120].map((seconds) => (
          <button
            key={seconds}
            onClick={() => setPresetDuration(seconds)}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
              duration === seconds
                ? 'bg-primary text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            {seconds < 60 ? `${seconds}s` : `${seconds / 60}m`}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        {!isRunning ? (
          <Button onClick={startTimer} className="flex-1" size="lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            </svg>
            {isComplete ? 'Restart' : 'Start'}
          </Button>
        ) : (
          <Button onClick={pauseTimer} variant="secondary" className="flex-1" size="lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Pause
          </Button>
        )}
        <Button onClick={resetTimer} variant="ghost" size="lg">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </Button>
      </div>
    </Card>
  );
}
