"use client"

import { useState } from 'react';
import { usePlanner } from './planner-store';
import { suggestComplementaryActivities } from '@/ai/flows/suggest-complementary-activities-flow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles, Plus, AlertCircle, Lightbulb } from 'lucide-react';
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
    <Card className="border-2 border-primary/20 bg-primary/5 shadow-md mb-6 overflow-hidden">
      <CardHeader className="p-4 pb-2 bg-white flex flex-row items-center justify-between space-y-0 border-b">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Lightbulb className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-sm font-black text-primary">Smart Planning Assistant</CardTitle>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">AI Suggestions</p>
          </div>
        </div>
        <Button 
          variant="default" 
          size="sm" 
          onClick={getRecommendations}
          disabled={loading}
          className="bg-primary hover:bg-primary/90 text-white shadow-sm h-8 px-4"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Sparkles className="w-3.5 h-3.5 mr-2" />}
          {recommendations ? 'Refresh' : 'Get Ideas'}
        </Button>
      </CardHeader>
      <CardContent className="p-4">
        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-xs flex items-center gap-2 mb-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
          </div>
        )}

        {recommendations && recommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="bg-white rounded-xl p-3 border border-primary/20 flex flex-col justify-between shadow-sm hover:border-primary/40 transition-colors">
                <div>
                  <h4 className="font-black text-xs text-foreground mb-1">{rec.name}</h4>
                  <p className="text-[10px] text-muted-foreground italic leading-tight mb-3">
                    "{rec.reason}"
                  </p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full text-[10px] h-7 border-primary/30 text-primary hover:bg-primary hover:text-white"
                  onClick={() => handleAddSuggested(rec.name)}
                >
                  <Plus className="w-3 h-3 mr-1.5" /> Add to {activeDay.name}
                </Button>
              </div>
            ))}
          </div>
        ) : recommendations ? (
          <p className="text-xs text-muted-foreground text-center py-4 italic bg-white/50 rounded-lg">
            Your day looks perfect! No further suggestions needed.
          </p>
        ) : !loading && (
          <div className="text-center py-4">
            <p className="text-[11px] text-muted-foreground">
              Need inspiration? Click <strong>'Get Ideas'</strong> to see activities that fit your remaining time today.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}