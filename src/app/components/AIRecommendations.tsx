
"use client"

import { useState } from 'react';
import { usePlanner } from './planner-store';
import { suggestComplementaryActivities } from '@/ai/flows/suggest-complementary-activities-flow';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Sparkles, Plus, AlertCircle, Zap } from 'lucide-react';
import { ACTIVITIES } from '../lib/activities';

export function AIRecommendations() {
  const { days, activeDayId, addActivityToDay, dailyActiveHours } = usePlanner();
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<{name: string, reason: string}[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const activeDay = days.find(d => d.id === activeDayId) || days[0];

  const getRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const currentDuration = activeDay.activities.reduce((s, p) => s + p.durationMinutes, 0);
      const remainingMinutes = (dailyActiveHours * 60) - currentDuration;

      const result = await suggestComplementaryActivities({
        selectedActivities: activeDay.activities.map(p => ({
          name: p.name,
          description: p.description,
          type: p.type,
          durationMinutes: p.durationMinutes,
          address: p.address,
        })),
        allPotentialActivities: ACTIVITIES.map(a => ({
          name: a.name,
          description: a.description,
          type: a.type,
          durationMinutes: a.durationMinutes,
          address: a.address,
        })),
        remainingBudgetedMinutes: remainingMinutes
      });
      setRecommendations(result.suggestedActivities);
    } catch (err: any) {
      console.error("AI Recommendation Error:", err);
      const isQuotaError = err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED');
      setError(isQuotaError ? "Too many requests. Please wait a moment." : "AI suggestions currently unavailable.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSuggested = (name: string) => {
    const activity = ACTIVITIES.find(a => a.name === name);
    if (activity) {
      addActivityToDay(activity, activeDayId);
      if (recommendations) {
        setRecommendations(recommendations.filter(s => s.name !== name));
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="border-accent text-accent hover:bg-accent/5 h-8 text-[10px] font-black uppercase tracking-widest"
          onClick={() => {
            if (!recommendations) getRecommendations();
          }}
        >
          <Sparkles className="w-3 h-3 mr-1.5" />
          Need Ideas?
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] rounded-[32px] border-4 border-accent">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-accent p-2 rounded-xl">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-accent uppercase tracking-tighter">Smart Planning Assistant</DialogTitle>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Tailored for {activeDay.name}</p>
            </div>
          </div>
        </DialogHeader>
        
        <div className="py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Consulting the local guide...</p>
            </div>
          ) : error ? (
            <div className="bg-destructive/10 text-destructive p-4 rounded-2xl text-xs flex items-center gap-2 border border-destructive/20 font-bold">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          ) : recommendations && recommendations.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {recommendations.map((rec, idx) => (
                <div key={idx} className="bg-muted/30 rounded-2xl p-4 border-2 border-accent/10 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-black text-sm text-foreground mb-1">{rec.name}</h4>
                    <p className="text-[11px] text-muted-foreground italic leading-tight">
                      "{rec.reason}"
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-accent hover:bg-accent/90 text-white font-black uppercase text-[10px] tracking-widest rounded-xl h-9 px-6 shrink-0"
                    onClick={() => handleAddSuggested(rec.name)}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" /> Add to Plan
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/20 rounded-3xl border-2 border-dashed border-accent/20">
              <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">
                Your day is already perfect!
              </p>
            </div>
          )}
        </div>
        
        <div className="flex justify-between items-center mt-2">
           <p className="text-[9px] text-muted-foreground uppercase font-bold">Recommendations based on your remaining time.</p>
           <Button variant="ghost" size="sm" onClick={getRecommendations} className="text-[9px] font-black uppercase text-accent">
              Refresh Suggestions
           </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
