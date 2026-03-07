"use client"

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { Activity } from '@/app/lib/activities';
import { addDays, differenceInDays, startOfDay, format, isBefore, parse } from 'date-fns';

export interface PlannedActivity extends Activity {
  isOptional: boolean;
  scheduledTime?: string;
  endTime?: string;
  isMeal?: boolean;
  travelTimeToNext?: number;
  travelTimeFromPrev?: number;
  fixedStartTime?: string;
  date?: string;
  notes?: string;
  website?: string;
}

export interface DayPlan {
  id: string;
  name: string;
  date: string;
  activities: PlannedActivity[];
  startHourOverride?: number;
  endHourOverride?: number;
  startLocation?: string;
  endLocation?: string;
}

export type TransitMethod = 'airport' | 'train' | 'car';

interface PlannerContextType {
  shortlist: Activity[];
  days: DayPlan[];
  activeDayId: string;
  arrivalDate: Date;
  departureDate: Date;
  arrivalMethod: TransitMethod;
  arrivalLocation: string;
  departureMethod: TransitMethod;
  departureLocation: string;
  dailyActiveHours: number;
  setArrivalDate: (d: Date) => void;
  setDepartureDate: (d: Date) => void;
  setArrivalMethod: (m: TransitMethod) => void;
  setArrivalLocation: (l: string) => void;
  setDepartureMethod: (m: TransitMethod) => void;
  setDepartureLocation: (l: string) => void;
  setDailyActiveHours: (n: number) => void;
  setActiveDayId: (id: string) => void;
  addToShortlist: (activity: Activity) => void;
  removeFromShortlist: (id: string) => void;
  addActivityToDay: (activity: Activity, dayId: string) => void;
  removeActivityFromDay: (activityId: string, dayId: string) => void;
  setDayActivities: (dayId: string, activities: PlannedActivity[]) => void;
  setDays: (days: DayPlan[]) => void;
  setShortlist: (activities: Activity[]) => void;
  toggleOptional: (activityId: string, dayId: string) => void;
  addCustomActivity: (activity: PlannedActivity, date?: string) => void;
}

const PlannerContext = createContext<PlannerContextType | undefined>(undefined);

export function PlannerProvider({ children }: { children: React.ReactNode }) {
  const [shortlist, setShortlist] = useState<Activity[]>([]);
  const [dailyActiveHours, setDailyActiveHours] = useState(8);
  
  const [arrivalDate, setArrivalDate] = useState<Date>(() => startOfDay(new Date()));
  const [departureDate, setDepartureDate] = useState<Date>(() => addDays(startOfDay(new Date()), 2));
  const [arrivalMethod, setArrivalMethod] = useState<TransitMethod>('car');
  const [arrivalLocation, setArrivalLocation] = useState('Tewksbury, MA');
  const [departureMethod, setDepartureMethod] = useState<TransitMethod>('car');
  const [departureLocation, setDepartureLocation] = useState('Tewksbury, MA');
  
  const currentDaysBase = useMemo(() => {
    const start = startOfDay(arrivalDate);
    let end = startOfDay(departureDate);
    if (isBefore(end, start)) end = addDays(start, 1);
    
    const numDays = Math.max(1, differenceInDays(end, start) + 1);
    const res: DayPlan[] = [];
    for (let i = 0; i < numDays; i++) {
      const currentDate = addDays(start, i);
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      res.push({
        id: `day-${dateStr}`,
        name: `Day ${i + 1} (${format(currentDate, 'MMM d')})`,
        date: dateStr,
        activities: [],
        startLocation: i === 0 ? arrivalLocation : 'Tewksbury, MA',
        endLocation: i === numDays - 1 ? departureLocation : 'Tewksbury, MA',
        startHourOverride: i === 0 ? arrivalDate.getHours() : undefined,
        endHourOverride: i === numDays - 1 ? departureDate.getHours() : undefined,
      });
    }
    return res;
  }, [arrivalDate, departureDate, arrivalLocation, departureLocation]);

  const [days, setDays] = useState<DayPlan[]>(currentDaysBase);
  const [activeDayId, setActiveDayId] = useState<string>(currentDaysBase[0]?.id || '');

  useEffect(() => {
    setDays(prev => {
      const updated = currentDaysBase.map(newDay => {
        const existing = prev.find(d => d.date === newDay.date);
        return existing ? { ...newDay, activities: existing.activities } : newDay;
      });
      return updated;
    });
  }, [currentDaysBase]);

  useEffect(() => {
    if (days.length > 0) {
      const exists = days.some(d => d.id === activeDayId);
      if (!activeDayId || !exists) {
        setActiveDayId(days[0].id);
      }
    }
  }, [days, activeDayId]);

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

  const addCustomActivity = useCallback((activity: PlannedActivity, targetDate?: string) => {
    setDays(prev => prev.map(day => {
      if (day.date === targetDate || (!targetDate && day.id === activeDayId)) {
        return { ...day, activities: [...day.activities, { ...activity, isOptional: false }] };
      }
      return day;
    }));
  }, [activeDayId]);

  const removeActivityFromDay = useCallback((activityId: string, dayId: string) => {
    setDays(prev => prev.map(day => {
      if (day.id === dayId) {
        const removed = day.activities.find(a => a.id === activityId);
        if (removed && !removed.isMeal && !activityId.startsWith('custom-')) {
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

  return (
    <PlannerContext.Provider value={{ 
      shortlist, 
      days, 
      activeDayId,
      arrivalDate,
      departureDate,
      arrivalMethod,
      arrivalLocation,
      departureMethod,
      departureLocation,
      dailyActiveHours,
      setArrivalDate,
      setDepartureDate,
      setArrivalMethod,
      setArrivalLocation,
      setDepartureMethod,
      setDepartureLocation,
      setDailyActiveHours,
      setActiveDayId,
      addToShortlist, 
      removeFromShortlist,
      addActivityToDay,
      removeActivityFromDay,
      setDayActivities,
      setDays,
      setShortlist,
      toggleOptional,
      addCustomActivity
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
