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
        title: "Nothing to optimize",
        description: "Add some activities to your plan first!",
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
          address: a.address
        })),
        startHour: startHour
      });

      const optimizedActivities: PlannedActivity[] = result.itinerary.map(item => {
        const existing = activeDay.activities.find(a => a.id === item.id);
        return {
          id: item.id || `meal-${Date.now()}-${Math.random()}`,
          name: item.name,
          description: item.reason || (existing?.description || ""),
          type: item.type === 'meal' ? 'food' : (existing?.type || 'sightseeing'),
          durationMinutes: item.durationMinutes,
          address: existing?.address || item.name,
          scheduledTime: item.startTime,
          endTime: item.endTime,
          isOptional: false,
          isMeal: item.type === 'meal',
          travelTimeFromPrev: item.travelTimeMinutes
        };
      });

      setDayActivities(activeDayId, optimizedActivities);
      toast({
        title: "Itinerary Optimized!",
        description: "We've reordered your day, calculated travel times, and added breaks.",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Optimization Failed",
        description: "Sorry, we couldn't finalize the order right now.",
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
      className="border-primary text-primary hover:bg-primary/5 h-8 text-xs font-bold"
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Wand2 className="w-3 h-3 mr-2" />}
      Optimize Order
    </Button>
  );
}
