"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Activity } from '@/app/lib/activities';
import { addDays, differenceInDays, startOfDay, format } from 'date-fns';

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
  defaultStartHour: number;
  setArrivalDate: (d: Date) => void;
  setDepartureDate: (d: Date) => void;
  setArrivalMethod: (m: TransitMethod) => void;
  setArrivalLocation: (l: string) => void;
  setDepartureMethod: (m: TransitMethod) => void;
  setDepartureLocation: (l: string) => void;
  setDailyActiveHours: (n: number) => void;
  setDefaultStartHour: (n: number) => void;
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
  const [defaultStartHour, setDefaultStartHour] = useState(9);
  
  const [arrivalDate, setArrivalDate] = useState<Date>(new Date());
  const [departureDate, setDepartureDate] = useState<Date>(addDays(new Date(), 2));
  const [arrivalMethod, setArrivalMethod] = useState<TransitMethod>('car');
  const [arrivalLocation, setArrivalLocation] = useState('Tewksbury, MA');
  const [departureMethod, setDepartureMethod] = useState<TransitMethod>('car');
  const [departureLocation, setDepartureLocation] = useState('Tewksbury, MA');
  
  const [days, setDays] = useState<DayPlan[]>([]);
  const [activeDayId, setActiveDayId] = useState<string>('');

  useEffect(() => {
    const numDays = differenceInDays(startOfDay(departureDate), startOfDay(arrivalDate)) + 1;
    const newDays: DayPlan[] = [];
    
    for (let i = 0; i < numDays; i++) {
      const currentDate = addDays(arrivalDate, i);
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      
      const existing = days.find(d => d.date === dateStr);
      
      const isStartDay = i === 0;
      const isEndDay = i === numDays - 1;

      newDays.push({
        id: existing?.id || `day-${dateStr}`,
        name: `Day ${i + 1} (${format(currentDate, 'MMM d')})`,
        date: dateStr,
        activities: existing?.activities || [],
        startHourOverride: isStartDay ? arrivalDate.getHours() : undefined,
        endHourOverride: isEndDay ? departureDate.getHours() : undefined,
        startLocation: isStartDay ? arrivalLocation : 'Tewksbury, MA',
        endLocation: isEndDay ? departureLocation : 'Tewksbury, MA'
      });
    }
    
    setDays(newDays);
    if (newDays.length > 0 && (!activeDayId || !newDays.find(d => d.id === activeDayId))) {
      setActiveDayId(newDays[0].id);
    }
  }, [arrivalDate, departureDate, arrivalLocation, departureLocation]);

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
      defaultStartHour,
      setArrivalDate,
      setDepartureDate,
      setArrivalMethod,
      setArrivalLocation,
      setDepartureMethod,
      setDepartureLocation,
      setDailyActiveHours,
      setDefaultStartHour,
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
