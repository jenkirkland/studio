
"use client"

import { useState } from 'react';
import { usePlanner, PlannedActivity, PACE_MULTIPLIERS } from './planner-store';
import { optimizeItinerary } from '@/ai/flows/optimize-itinerary-flow';
import { Button } from '@/components/ui/button';
import { Loader2, Wand2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { recalculateTimelineWithTraffic } from '@/lib/calculate-routes';

export function OptimizeItinerary() {
  const { days, activeDayId, setDayActivities, startHour, activityPace } = usePlanner();
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
      const response = await optimizeItinerary({
        activities: activeDay.activities.map(a => ({
          id: a.id,
          name: a.name,
          durationMinutes: Math.round((a.durationMinutes || 60) * PACE_MULTIPLIERS[activityPace]),
          type: a.type,
          address: a.address,
          fixedStartTime: a.fixedStartTime
        })),
        startHour: activeDay.startHourOverride || startHour || 9,
        endHour: activeDay.endHourOverride,
        startLocation: activeDay.startLocation,
        endLocation: activeDay.endLocation
      });

      if (!response.success) {
        throw new Error(response.error);
      }

      const result = response.data;

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
          durationMinutes: item.durationMinutes ? Math.round(item.durationMinutes / PACE_MULTIPLIERS[activityPace]) : (existing?.durationMinutes || 60),
          address: existing?.address || item.name,
          scheduledTime: item.startTime,
          endTime: item.endTime,
          isOptional: false,
          isMeal: item.type === 'meal',
          travelTimeFromPrev: item.travelTimeMinutes,
          travelModeFromPrev: 'car',
          fixedStartTime: existing?.fixedStartTime || (item.isFixed ? item.startTime : undefined)
        };
      });

      // Post-process sequence through Google Maps Routes API
      const startLoc = activeDay.startLocation || "Tewksbury, MA";
      const startH = activeDay.startHourOverride || startHour || 9;

      let finalActivities = optimizedActivities;

      const scaledActivities = optimizedActivities.map(a => ({
        ...a,
        durationMinutes: Math.round((a.durationMinutes || 60) * PACE_MULTIPLIERS[activityPace])
      }));

      try {
        const routedActivities = await recalculateTimelineWithTraffic(scaledActivities, startLoc, activeDay.date, startH);

        finalActivities = routedActivities.map(a => ({
          ...a,
          durationMinutes: Math.round((a.durationMinutes || 60) / PACE_MULTIPLIERS[activityPace])
        }));
      } catch (e) {
        console.error(`Routing failed, falling back to AI times:`, e);
      }

      setDayActivities(activeDayId, finalActivities);
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
      type="button"
      variant="outline"
      size="sm"
      className="border-primary text-primary hover:bg-primary/5 h-8 text-[10px] font-black uppercase tracking-widest"
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Wand2 className="w-3 h-3 mr-2" />}
      Optimize
    </Button>
  );
}
