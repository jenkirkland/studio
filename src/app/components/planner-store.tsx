"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Activity, ACTIVITIES } from '@/app/lib/activities';

interface PlannedActivity extends Activity {
  isOptional: boolean;
}

interface PlannerContextType {
  plan: PlannedActivity[];
  availableActivities: Activity[];
  addActivity: (activity: Activity) => void;
  removeActivity: (id: string) => void;
  toggleOptional: (id: string) => void;
  reorderPlan: (startIndex: number, endIndex: number) => void;
  totalDuration: number;
  totalDriveTime: number;
}

const PlannerContext = createContext<PlannerContextType | undefined>(undefined);

export function PlannerProvider({ children }: { children: React.ReactNode }) {
  const [plan, setPlan] = useState<PlannedActivity[]>([]);
  const [availableActivities, setAvailableActivities] = useState<Activity[]>(ACTIVITIES);

  const addActivity = useCallback((activity: Activity) => {
    setPlan(prev => [...prev, { ...activity, isOptional: false }]);
    setAvailableActivities(prev => prev.filter(a => a.id !== activity.id));
  }, []);

  const removeActivity = useCallback((id: string) => {
    const activityToRemove = plan.find(a => a.id === id);
    if (activityToRemove) {
      setPlan(prev => prev.filter(a => a.id !== id));
      setAvailableActivities(prev => [...prev, activityToRemove]);
    }
  }, [plan]);

  const toggleOptional = useCallback((id: string) => {
    setPlan(prev => prev.map(a => a.id === id ? { ...a, isOptional: !a.isOptional } : a));
  }, []);

  const reorderPlan = useCallback((startIndex: number, endIndex: number) => {
    const result = Array.from(plan);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    setPlan(result);
  }, [plan]);

  // Derived state
  const totalDuration = plan.reduce((sum, a) => sum + (a.isOptional ? 0 : a.durationMinutes), 0);
  
  // Simulated Drive Time: Seqential stops starting from Tewksbury. 
  // In a real app, this would use Distance Matrix API.
  const [totalDriveTime, setTotalDriveTime] = useState(0);

  useEffect(() => {
    const nonOptional = plan.filter(a => !a.isOptional);
    if (nonOptional.length === 0) {
      setTotalDriveTime(0);
      return;
    }
    // Assume 20 mins per stop on average for simplicity in this MVP
    setTotalDriveTime(nonOptional.length * 20);
  }, [plan]);

  return (
    <PlannerContext.Provider value={{ 
      plan, 
      availableActivities, 
      addActivity, 
      removeActivity, 
      toggleOptional, 
      reorderPlan,
      totalDuration,
      totalDriveTime
    }}>
      {children}
    </PlannerContext.Provider>
  );
}

export function usePlanner() {
  const context = useContext(PlannerContext);
  if (!context) throw new Error('usePlanner must be used within PlannerProvider');
  return context;
}
