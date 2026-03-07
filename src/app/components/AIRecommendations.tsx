"use client"

import { useState } from 'react';
import { usePlanner } from './planner-store';
import { suggestComplementaryActivities, SuggestComplementaryActivitiesOutput } from '@/ai/flows/suggest-complementary-activities-flow';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Loader2, Plus, AlertCircle } from 'lucide-react';
import { ACTIVITIES } from '../lib/activities';

export function AIRecommendations() {
  const { plan, addActivity, availableActivities } = usePlanner();
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<SuggestComplementaryActivitiesOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await suggestComplementaryActivities({
        selectedActivities: plan.map(p => ({
          name: p.name,
          description: p.description,
          type: p.type,
          durationMinutes: p.durationMinutes,
          address: p.address,
        })),
        allPotentialActivities: availableActivities.map(a => ({
          name: a.name,
          description: a.description,
          type: a.type,
          durationMinutes: a.durationMinutes,
          address: a.address,
        })),
        remainingBudgetedMinutes: 480 - plan.reduce((s, p) => s + p.durationMinutes, 0)
      });
      setRecommendations(result);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch suggestions. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSuggested = (name: string) => {
    const activity = availableActivities.find(a => a.name === name);
    if (activity) {
      addActivity(activity);
      // Remove from recommendations local state if needed
      if (recommendations) {
        setRecommendations({
          ...recommendations,
          suggestedActivities: recommendations.suggestedActivities.filter(s => s.name !== name)
        });
      }
    }
  };

  return (
    <Card className="border-accent bg-accent/5 mb-6 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            <h3 className="font-headline font-bold text-accent-foreground">Wanderer Smart Suggestions</h3>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={getRecommendations}
            disabled={loading}
            className="text-accent hover:text-accent hover:bg-accent/10"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {recommendations ? 'Refresh' : 'Get Ideas'}
          </Button>
        </div>

        {error && (
          <div className="text-destructive text-sm flex items-center gap-1">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {recommendations && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recommendations.suggestedActivities.map((rec, idx) => (
              <div key={idx} className="bg-white/80 rounded-lg p-3 border border-accent/20 flex flex-col justify-between shadow-sm">
                <div>
                  <h4 className="font-bold text-sm text-foreground mb-1">{rec.name}</h4>
                  <p className="text-xs text-muted-foreground italic mb-3">"{rec.reason}"</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full text-xs h-7 border-accent text-accent hover:bg-accent hover:text-white"
                  onClick={() => handleAddSuggested(rec.name)}
                >
                  <Plus className="w-3 h-3 mr-1" /> Add
                </Button>
              </div>
            ))}
          </div>
        )}

        {!recommendations && !loading && (
          <p className="text-xs text-muted-foreground text-center py-2">
            Click 'Get Ideas' for AI-curated activities that complement your current choices.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
