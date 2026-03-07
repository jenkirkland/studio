"use client"

import { usePlanner } from "./planner-store";
import { ActivityCard } from "./ActivityCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Map, Sparkles, Navigation, Info } from "lucide-react";
import { AIRecommendations } from "./AIRecommendations";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState } from "react";

export function PlannerUI() {
  const { plan, availableActivities, addActivity, removeActivity, toggleOptional, totalDuration, totalDriveTime } = usePlanner();
  const [showAI, setShowAI] = useState(false);

  const generateGoogleMapsLink = () => {
    const origin = "Tewksbury,MA";
    const destinations = plan
      .filter(a => !a.isOptional)
      .map(a => encodeURIComponent(a.address))
      .join('/');
    
    if (destinations.length === 0) return `https://www.google.com/maps/dir/${origin}`;
    return `https://www.google.com/maps/dir/${origin}/${destinations}`;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Pool of Activities */}
      <div className="w-full lg:w-1/3 flex flex-col gap-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-headline font-bold text-primary">Discover Activities</h2>
          <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">
            {availableActivities.length} available
          </span>
        </div>
        <ScrollArea className="h-[calc(100vh-16rem)] rounded-xl border bg-white/50 p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-4">
            {availableActivities.map(activity => (
              <ActivityCard 
                key={activity.id} 
                activity={activity} 
                actionType="add"
                onAction={() => addActivity(activity)}
              />
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Daily Plan */}
      <div className="w-full lg:w-2/3 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 gap-4">
          <div>
            <h2 className="text-xl font-headline font-bold text-primary">Your Wanderer Day</h2>
            <p className="text-sm text-muted-foreground">Starting from Tewksbury, MA</p>
          </div>
          <div className="flex gap-2">
             <Button 
              variant="outline" 
              onClick={() => setShowAI(!showAI)}
              className="border-accent text-accent hover:bg-accent/5"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              AI Suggestions
            </Button>
            <Button 
              asChild
              className="bg-primary hover:bg-primary/90 text-white"
            >
              <a href={generateGoogleMapsLink()} target="_blank" rel="noopener noreferrer">
                <Map className="w-4 h-4 mr-2" />
                Open Map
              </a>
            </Button>
          </div>
        </div>

        {showAI && (
          <div className="animate-in slide-in-from-top-4 duration-300">
            <AIRecommendations />
          </div>
        )}

        <div className="flex flex-col h-full bg-white/30 backdrop-blur-sm rounded-2xl border p-6 shadow-inner min-h-[400px]">
          {plan.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center p-8">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Navigation className="w-8 h-8 opacity-20" />
              </div>
              <p className="font-medium text-lg">Your itinerary is empty</p>
              <p className="text-sm">Select activities from the left to build your perfect day.</p>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 pr-4">
                <div className="flex flex-col gap-4">
                  {plan.map((activity, index) => (
                    <div key={activity.id} className="relative">
                      {index > 0 && !activity.isOptional && (
                        <div className="absolute -top-4 left-10 w-0.5 h-4 bg-primary/20" />
                      )}
                      <ActivityCard 
                        activity={activity} 
                        actionType="remove"
                        onAction={() => removeActivity(activity.id)}
                        onToggleOptional={() => toggleOptional(activity.id)}
                      />
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="mt-6 pt-6 border-t border-primary/10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Alert className="bg-primary/5 border-primary/20">
                    <Clock className="h-4 w-4" />
                    <AlertTitle className="text-xs uppercase tracking-wider font-bold text-primary/80">Activity Time</AlertTitle>
                    <AlertDescription className="text-2xl font-headline font-bold text-primary">
                      {Math.floor(totalDuration / 60)}h {totalDuration % 60}m
                    </AlertDescription>
                  </Alert>

                  <Alert className="bg-accent/5 border-accent/20">
                    <Navigation className="h-4 w-4" />
                    <AlertTitle className="text-xs uppercase tracking-wider font-bold text-accent/80">Est. Drive Time</AlertTitle>
                    <AlertDescription className="text-2xl font-headline font-bold text-accent">
                      ~ {totalDriveTime} min
                    </AlertDescription>
                  </Alert>
                </div>
                <p className="mt-4 text-[10px] text-muted-foreground flex items-center justify-center">
                  <Info className="w-3 h-3 mr-1" /> Drive times are estimates starting from Tewksbury sequentially.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
