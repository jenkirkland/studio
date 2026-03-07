
"use client"

import { useState } from 'react';
import { usePlanner } from './planner-store';
import { suggestComplementaryActivities } from '@/ai/flows/suggest-complementary-activities-flow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles, Plus, AlertCircle, Lightbulb, Zap } from 'lucide-react';
import { ACTIVITIES } from '../lib/activities';

interface Suggestion {
  name: string;
  reason: string;
}

export function AIRecommendations() {
  const { days, activeDayId, addActivityToDay, dailyActiveHours } = usePlanner();
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Suggestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    } catch (err) {
      console.error("AI Recommendation Error:", err);
      setError("AI suggestions currently unavailable. Please try again later.");
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
    <Card className="border-4 border-accent bg-accent/5 shadow-xl mb-6 overflow-hidden transform hover:scale-[1.01] transition-transform">
      <CardHeader className="p-5 pb-3 bg-accent/10 flex flex-row items-center justify-between space-y-0 border-b-2 border-accent/20">
        <div className="flex items-center gap-3">
          <div className="bg-accent p-2.5 rounded-xl shadow-lg">
            <Zap className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <CardTitle className="text-sm font-black text-accent uppercase tracking-tighter">Smart Planning Assistant</CardTitle>
            <p className="text-[10px] text-accent/70 uppercase tracking-widest font-black">AI Recommendations</p>
          </div>
        </div>
        <Button 
          variant="default" 
          size="sm" 
          onClick={getRecommendations}
          disabled={loading}
          className="bg-accent hover:bg-accent/90 text-white shadow-lg h-9 px-6 font-black uppercase text-[10px] tracking-widest"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Sparkles className="w-3.5 h-3.5 mr-2" />}
          {recommendations ? 'Refresh Ideas' : 'Get Recommendations'}
        </Button>
      </CardHeader>
      <CardContent className="p-5">
        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-xs flex items-center gap-2 mb-2 border border-destructive/20 font-bold">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
          </div>
        )}

        {recommendations && recommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-4 border-2 border-accent/10 flex flex-col justify-between shadow-md hover:border-accent/40 transition-colors group">
                <div>
                  <h4 className="font-black text-sm text-foreground mb-1 group-hover:text-accent transition-colors">{rec.name}</h4>
                  <p className="text-[11px] text-muted-foreground italic leading-tight mb-4">
                    "{rec.reason}"
                  </p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full text-[10px] h-8 border-accent/30 text-accent font-black uppercase tracking-wider hover:bg-accent hover:text-white rounded-xl"
                  onClick={() => handleAddSuggested(rec.name)}
                >
                  <Plus className="w-3 h-3 mr-1.5" /> Add to {activeDay.name}
                </Button>
              </div>
            ))}
          </div>
        ) : recommendations ? (
          <div className="text-center py-8 bg-white/50 rounded-2xl border-2 border-dashed border-accent/20">
            <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">
              Your day looks perfect! No further suggestions needed.
            </p>
          </div>
        ) : !loading && (
          <div className="text-center py-6">
            <div className="bg-accent/5 inline-flex p-4 rounded-full mb-3">
              <Lightbulb className="w-6 h-6 text-accent opacity-50" />
            </div>
            <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest">
              Need inspiration? Click <strong>'Get Recommendations'</strong> to see activities that fit your remaining time today.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
