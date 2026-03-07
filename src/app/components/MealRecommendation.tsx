
"use client"

import { useState } from "react";
import { PlannedActivity, usePlanner } from "./planner-store";
import { Button } from "@/components/ui/button";
import { Loader2, Utensils, Check, ExternalLink } from "lucide-react";
import { suggestNearbyFood } from "@/ai/flows/suggest-nearby-food-flow";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

interface MealRecommendationProps {
  activity: PlannedActivity;
  prevActivity?: PlannedActivity;
  nextActivity?: PlannedActivity;
  dayId: string;
}

export function MealRecommendation({ activity, prevActivity, nextActivity, dayId }: MealRecommendationProps) {
  const { setDayActivities, days } = usePlanner();
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  const findFood = async () => {
    setLoading(true);
    try {
      const result = await suggestNearbyFood({
        prevActivity: prevActivity ? { name: prevActivity.name, address: prevActivity.address } : undefined,
        nextActivity: nextActivity ? { name: nextActivity.name, address: nextActivity.address } : undefined,
        mealType: activity.name.toLowerCase().includes('dinner') ? 'Dinner' : 'Lunch'
      });
      setSuggestions(result.suggestions);
    } catch (err: any) {
      console.error(err);
      const isQuotaError = err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED');
      toast({ 
        title: isQuotaError ? "Too Many Requests" : "Could not find food", 
        description: isQuotaError ? "AI is busy. Please try again in 30 seconds." : "Search failed.",
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const selectRestaurant = (res: any) => {
    const activeDay = days.find(d => d.id === dayId);
    if (!activeDay) return;

    const updated = activeDay.activities.map(a => {
      if (a.id === activity.id) {
        return {
          ...a,
          name: res.name,
          description: res.description,
          address: res.address,
          type: 'food',
          isMeal: true,
          notes: `${res.reason} | Reservation: ${res.reservationRecommended ? 'Recommended' : 'Not needed'}`,
          website: res.website
        } as PlannedActivity;
      }
      return a;
    });

    setDayActivities(dayId, updated);
    setOpen(false);
    toast({ title: "Restaurant selected!", description: `Added ${res.name} to your itinerary.` });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="bg-accent/5 border-2 border-dashed border-accent/30 rounded-[32px] p-6 text-center hover:bg-accent/10 transition-all cursor-pointer group">
          <div className="bg-accent/10 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
            <Utensils className="w-6 h-6 text-accent" />
          </div>
          <h4 className="text-sm font-black text-accent uppercase tracking-widest">{activity.name} Placeholder</h4>
          <p className="text-[10px] text-muted-foreground font-medium mt-1 mb-4">Finding a spot between {prevActivity?.name || 'Start'} and {nextActivity?.name || 'Next Stop'}</p>
          <Button onClick={findFood} className="bg-accent hover:bg-accent/90 text-white font-black uppercase text-[10px] tracking-widest h-9 rounded-xl px-6">
            Find Restaurant
          </Button>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] rounded-[32px] border-4 border-accent">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-accent uppercase tracking-tight">Expert Recommendations</DialogTitle>
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Along your route between {prevActivity?.name} and {nextActivity?.name}</p>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-accent" />
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Scouting the area...</p>
            </div>
          ) : suggestions.length > 0 ? (
            <div className="grid gap-4">
              {suggestions.map((res, i) => (
                <div key={i} className="bg-muted/30 p-4 rounded-3xl border-2 border-accent/10 flex flex-col gap-3">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="font-black text-lg text-foreground">{res.name}</h4>
                      <Badge variant="outline" className="text-[9px] uppercase font-black bg-accent/5 text-accent border-accent/20">
                        {res.cuisine}
                      </Badge>
                    </div>
                    {res.reservationRecommended && (
                      <Badge className="bg-orange-500 text-white text-[9px] font-black uppercase">Reservation Recommended</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground italic leading-relaxed">"{res.reason}"</p>
                  <div className="flex items-center justify-between mt-2 pt-3 border-t border-accent/5">
                    <a 
                      href={res.website} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[10px] font-black uppercase text-accent flex items-center gap-1.5 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" /> Visit Website
                    </a>
                    <Button onClick={() => selectRestaurant(res)} className="bg-accent h-8 rounded-xl font-black uppercase text-[10px] px-6">
                      <Check className="w-3.5 h-3.5 mr-1.5" /> Choose Place
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <div className="text-center py-12">
               <p className="text-sm font-bold text-muted-foreground">Click "Scout the Area" to get personalized suggestions.</p>
               <Button onClick={findFood} className="mt-4 bg-accent h-10 rounded-xl font-black uppercase text-xs">
                 Scout the Area
               </Button>
             </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
