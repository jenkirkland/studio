
"use client"

import { useState } from 'react';
import { usePlanner, PlannedActivity } from './planner-store';
import { optimizeItinerary } from '@/ai/flows/optimize-itinerary-flow';
import { Button } from '@/components/ui/button';
import { Loader2, Wand2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function OptimizeItinerary() {
  const { days, activeDayId, setDayActivities, startHour } = usePlanner();
  const [loading, setLoading] = useState(false);
  const activeDay = days.find(d => d.id === activeDayId);

  const handleOptimize = async () => {
    if (!activeDay || activeDay.activities.length === 0) {
      toast({
        title: "No activities to group",
        description: "Add some experiences to your day first!",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const result = await optimizeItinerary({
        activities: activeDay.activities.map(a => ({
          id: a.id,
          name: a.name,
          durationMinutes: a.durationMinutes,
          type: a.type,
          address: a.address,
          fixedStartTime: a.fixedStartTime
        })),
        startHour: activeDay.startHourOverride || startHour || 9,
        endHour: activeDay.endHourOverride,
        startLocation: activeDay.startLocation,
        endLocation: activeDay.endLocation
      });

      if (!result?.itinerary) {
        throw new Error("Invalid AI response");
      }

      const optimizedActivities: PlannedActivity[] = result.itinerary.map(item => {
        const existing = activeDay.activities.find(a => a.id === item.id);
        return {
          id: item.id || `meal-${Date.now()}-${Math.random()}`,
          name: item.name,
          description: item.reason || (existing?.description || "A recommended stop for your day."),
          type: item.type === 'meal' ? 'food' : (existing?.type || 'sightseeing'),
          durationMinutes: item.durationMinutes,
          address: existing?.address || item.name,
          scheduledTime: item.startTime,
          endTime: item.endTime,
          isOptional: false,
          isMeal: item.type === 'meal',
          travelTimeFromPrev: item.travelTimeMinutes,
          fixedStartTime: existing?.fixedStartTime || (item.isFixed ? item.startTime : undefined)
        };
      });

      setDayActivities(activeDayId, optimizedActivities);
      toast({
        title: "Itinerary Optimized!",
        description: "We've reordered stops around your fixed times and calculated travel.",
      });
    } catch (err: any) {
      console.error("Optimization Error:", err);
      const isQuotaError = err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED');
      toast({
        title: isQuotaError ? "AI is Busy" : "Optimization Failed",
        description: isQuotaError 
          ? "We've hit the AI request limit. Please wait about 30 seconds and try again." 
          : "Something went wrong while calculating your route.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleOptimize} 
      disabled={loading}
      variant="outline"
      size="sm"
      className="border-primary text-primary hover:bg-primary/5 h-8 text-[10px] font-black uppercase tracking-widest"
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Wand2 className="w-3 h-3 mr-2" />}
      Optimize
    </Button>
  );
}
