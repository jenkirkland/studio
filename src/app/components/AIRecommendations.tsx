"use client"

import { useState } from 'react';
import { usePlanner } from './planner-store';
import { suggestComplementaryActivities, SuggestComplementaryActivitiesOutput } from '@/ai/flows/suggest-complementary-activities-flow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Loader2, Plus, AlertCircle, Lightbulb } from 'lucide-react';
import { ACTIVITIES } from '../lib/activities';

export function AIRecommendations() {
  const { days, activeDayId, addActivityToDay } = usePlanner();
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<SuggestComplementaryActivitiesOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeDay = days.find(d => d.id === activeDayId) || days[0];

  const getRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
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
        remainingBudgetedMinutes: 480 - activeDay.activities.reduce((s, p) => s + p.durationMinutes, 0)
      });
      setRecommendations(result);
    } catch (err) {
      console.error("AI Recommendation Error:", err);
      setError("Failed to fetch suggestions. Our AI might be busy, please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSuggested = (name: string) => {
    const activity = ACTIVITIES.find(a => a.name === name);
    if (activity) {
      addActivityToDay(activity, activeDayId);
      if (recommendations) {
        setRecommendations({
          ...recommendations,
          suggestedActivities: recommendations.suggestedActivities.filter(s => s.name !== name)
        });
      }
    }
  };

  return (
    <Card className="border-2 border-primary/20 bg-primary/5 shadow-md mb-6 animate-in fade-in zoom-in duration-300">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <div className="bg-primary/20 p-2 rounded-lg">
            <Lightbulb className="w-5 h-5 text-primary" />
          </div>
          <CardTitle className="text-lg font-bold text-primary">Smart Planning Assistant</CardTitle>
        </div>
        <Button 
          variant="default" 
          size="sm" 
          onClick={getRecommendations}
          disabled={loading}
          className="bg-primary hover:bg-primary/90 text-white shadow-sm h-8"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
          {recommendations ? 'Refresh Ideas' : 'Get Ideas'}
        </Button>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {recommendations && recommendations.suggestedActivities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
            {recommendations.suggestedActivities.map((rec, idx) => (
              <div key={idx} className="bg-white rounded-xl p-4 border border-primary/10 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                <div>
                  <h4 className="font-bold text-sm text-foreground mb-1">{rec.name}</h4>
                  <p className="text-xs text-muted-foreground italic leading-relaxed mb-4">
                    "{rec.reason}"
                  </p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full text-xs h-8 border-primary/30 text-primary hover:bg-primary hover:text-white transition-colors"
                  onClick={() => handleAddSuggested(rec.name)}
                >
                  <Plus className="w-3 h-3 mr-1" /> Add to {activeDay.name}
                </Button>
              </div>
            ))}
          </div>
        ) : recommendations ? (
          <p className="text-sm text-muted-foreground text-center py-6 bg-white/50 rounded-lg italic">
            Your day looks quite full! No further suggestions needed.
          </p>
        ) : !loading && (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">
              Not sure what to do next? Click <strong>'Get Ideas'</strong> to see activities that perfectly match your current plan.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
