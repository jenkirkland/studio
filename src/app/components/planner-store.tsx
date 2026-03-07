"use client"

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Activity, ACTIVITIES } from '@/app/lib/activities';

export interface PlannedActivity extends Activity {
  isOptional: boolean;
  scheduledTime?: string;
  endTime?: string;
  isMeal?: boolean;
  travelTimeToNext?: number;
  travelTimeFromPrev?: number;
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
  tripDuration: number;
  dailyActiveHours: number;
  startHour: number;
  setTripDuration: (n: number) => void;
  setDailyActiveHours: (n: number) => void;
  setStartHour: (n: number) => void;
  setActiveDayId: (id: string) => void;
  addToShortlist: (activity: Activity) => void;
  removeFromShortlist: (id: string) => void;
  addActivityToDay: (activity: Activity, dayId: string) => void;
  removeActivityFromDay: (activityId: string, dayId: string) => void;
  setDayActivities: (dayId: string, activities: PlannedActivity[]) => void;
  toggleOptional: (activityId: string, dayId: string) => void;
  addDay: () => void;
  removeDay: (id: string) => void;
  distributeShortlistIntoDays: () => void;
}

const PlannerContext = createContext<PlannerContextType | undefined>(undefined);

export function PlannerProvider({ children }: { children: React.ReactNode }) {
  const [shortlist, setShortlist] = useState<Activity[]>([]);
  const [tripDuration, setTripDuration] = useState(3);
  const [dailyActiveHours, setDailyActiveHours] = useState(8);
  const [startHour, setStartHour] = useState(9);
  const [days, setDays] = useState<DayPlan[]>([
    { id: 'day-1', name: 'Day 1', activities: [] }
  ]);
  const [activeDayId, setActiveDayId] = useState<string>('day-1');

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
    setShortlist(prev => prev.filter(a => a.id !== activity.id));
  }, []);

  const removeActivityFromDay = useCallback((activityId: string, dayId: string) => {
    setDays(prev => prev.map(day => {
      if (day.id === dayId) {
        const removed = day.activities.find(a => a.id === activityId);
        if (removed && !removed.isMeal) {
          setShortlist(s => [...s, removed]);
        }
        return { ...day, activities: day.activities.filter(a => a.id !== activityId) };
      }
      return day;
    }));
  }, []);

  const setDayActivities = useCallback((dayId: string, activities: PlannedActivity[]) => {
    setDays(prev => prev.map(day => day.id === dayId ? { ...day, activities } : day));
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
        setShortlist(s => [...s, ...dayToRemove.activities.filter(a => !a.isMeal)]);
      }
      const filtered = prev.filter(d => d.id !== id);
      if (activeDayId === id) setActiveDayId(filtered[0].id);
      return filtered;
    });
  }, [activeDayId]);

  const distributeShortlistIntoDays = useCallback(() => {
    const maxMinutesPerDay = dailyActiveHours * 60;
    const newDays: DayPlan[] = [];
    
    // Reset days based on duration
    for (let i = 0; i < tripDuration; i++) {
      newDays.push({ id: `day-${i + 1}`, name: `Day ${i + 1}`, activities: [] });
    }

    const items = [...shortlist];
    let currentDayIdx = 0;
    
    while (items.length > 0 && currentDayIdx < tripDuration) {
      const activity = items[0];
      const currentDayTime = newDays[currentDayIdx].activities.reduce((s, a) => s + a.durationMinutes, 0);
      
      // Allow for travel time estimate (20 mins per activity)
      if (currentDayTime + activity.durationMinutes + 20 <= maxMinutesPerDay) {
        newDays[currentDayIdx].activities.push({ ...activity, isOptional: false });
        items.shift();
      } else {
        currentDayIdx++;
      }
    }

    setDays(newDays);
    setShortlist(items); // Remaining items stay in shortlist
    setActiveDayId(newDays[0].id);
  }, [shortlist, tripDuration, dailyActiveHours]);

  return (
    <PlannerContext.Provider value={{ 
      shortlist, 
      days, 
      activeDayId,
      tripDuration,
      dailyActiveHours,
      startHour,
      setTripDuration,
      setDailyActiveHours,
      setStartHour,
      setActiveDayId,
      addToShortlist, 
      removeFromShortlist,
      addActivityToDay,
      removeActivityFromDay,
      setDayActivities,
      toggleOptional,
      addDay,
      removeDay,
      distributeShortlistIntoDays
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
