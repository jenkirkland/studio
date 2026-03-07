"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Activity, ACTIVITIES } from '@/app/lib/activities';

export interface PlannedActivity extends Activity {
  isOptional: boolean;
}

export interface DayPlan {
  id: string;
  name: string;
  activities: PlannedActivity[];
}

interface PlannerContextType {
  shortlist: Activity[];
  days: DayPlan[];
  activeDayId: string;
  setActiveDayId: (id: string) => void;
  addToShortlist: (activity: Activity) => void;
  removeFromShortlist: (id: string) => void;
  addActivityToDay: (activity: Activity, dayId: string) => void;
  removeActivityFromDay: (activityId: string, dayId: string) => void;
  toggleOptional: (activityId: string, dayId: string) => void;
  addDay: () => void;
  removeDay: (id: string) => void;
  availableActivities: Activity[];
}

const PlannerContext = createContext<PlannerContextType | undefined>(undefined);

export function PlannerProvider({ children }: { children: React.ReactNode }) {
  const [shortlist, setShortlist] = useState<Activity[]>([]);
  const [days, setDays] = useState<DayPlan[]>([
    { id: 'day-1', name: 'Day 1', activities: [] }
  ]);
  const [activeDayId, setActiveDayId] = useState<string>('day-1');

  const availableActivities = ACTIVITIES.filter(
    a => !shortlist.some(s => s.id === a.id) && 
         !days.some(d => d.activities.some(da => da.id === a.id))
  );

  const addToShortlist = useCallback((activity: Activity) => {
    setShortlist(prev => {
      if (prev.find(a => a.id === activity.id)) return prev;
      return [...prev, activity];
    });
  }, []);

  const removeFromShortlist = useCallback((id: string) => {
    setShortlist(prev => prev.filter(a => a.id !== id));
  }, []);

  const addActivityToDay = useCallback((activity: Activity, dayId: string) => {
    setDays(prev => prev.map(day => {
      if (day.id === dayId) {
        return { ...day, activities: [...day.activities, { ...activity, isOptional: false }] };
      }
      return day;
    }));
    // Remove from shortlist if it was there
    setShortlist(prev => prev.filter(a => a.id !== activity.id));
  }, []);

  const removeActivityFromDay = useCallback((activityId: string, dayId: string) => {
    setDays(prev => prev.map(day => {
      if (day.id === dayId) {
        const removed = day.activities.find(a => a.id === activityId);
        if (removed) {
          // Return to shortlist
          setShortlist(s => [...s, removed]);
        }
        return { ...day, activities: day.activities.filter(a => a.id !== activityId) };
      }
      return day;
    }));
  }, []);

  const toggleOptional = useCallback((activityId: string, dayId: string) => {
    setDays(prev => prev.map(day => {
      if (day.id === dayId) {
        return {
          ...day,
          activities: day.activities.map(a => 
            a.id === activityId ? { ...a, isOptional: !a.isOptional } : a
          )
        };
      }
      return day;
    }));
  }, []);

  const addDay = useCallback(() => {
    setDays(prev => {
      const nextNum = prev.length + 1;
      return [...prev, { id: `day-${Date.now()}`, name: `Day ${nextNum}`, activities: [] }];
    });
  }, []);

  const removeDay = useCallback((id: string) => {
    setDays(prev => {
      if (prev.length <= 1) return prev;
      const dayToRemove = prev.find(d => d.id === id);
      if (dayToRemove) {
        // Return activities to shortlist
        setShortlist(s => [...s, ...dayToRemove.activities]);
      }
      const filtered = prev.filter(d => d.id !== id);
      if (activeDayId === id) setActiveDayId(filtered[0].id);
      return filtered;
    });
  }, [activeDayId]);

  return (
    <PlannerContext.Provider value={{ 
      shortlist, 
      days, 
      activeDayId,
      setActiveDayId,
      addToShortlist, 
      removeFromShortlist,
      addActivityToDay,
      removeActivityFromDay,
      toggleOptional,
      addDay,
      removeDay,
      availableActivities
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