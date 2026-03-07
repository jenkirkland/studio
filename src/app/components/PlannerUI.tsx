"use client"

import { usePlanner } from "./planner-store";
import { ActivityCard } from "./ActivityCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Map, Sparkles, Navigation, Info, Plus, Calendar as CalendarIcon, Search, ListTodo, Trash2 } from "lucide-react";
import { DiscoveryTable } from "./DiscoveryTable";
import { AIRecommendations } from "./AIRecommendations";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function PlannerUI() {
  const { 
    shortlist, 
    days, 
    activeDayId, 
    setActiveDayId, 
    addDay, 
    removeDay,
    addActivityToDay, 
    removeActivityFromDay, 
    toggleOptional 
  } = usePlanner();
  
  const [showAI, setShowAI] = useState(false);

  const activeDay = days.find(d => d.id === activeDayId) || days[0];

  const totalDuration = activeDay.activities.reduce((sum, a) => sum + (a.isOptional ? 0 : a.durationMinutes), 0);
  const totalDriveTime = activeDay.activities.filter(a => !a.isOptional).length * 20;

  const generateGoogleMapsLink = () => {
    const origin = "Tewksbury,MA";
    const destinations = activeDay.activities
      .filter(a => !a.isOptional)
      .map(a => encodeURIComponent(a.address))
      .join('/');
    
    if (destinations.length === 0) return `https://www.google.com/maps/dir/${origin}`;
    return `https://www.google.com/maps/dir/${origin}/${destinations}`;
  };

  return (
    <Tabs defaultValue="discover" className="w-full">
      <div className="flex items-center justify-center mb-8">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="discover" className="flex items-center gap-2">
            <Search className="h-4 w-4" /> Discover
          </TabsTrigger>
          <TabsTrigger value="plan" className="flex items-center gap-2">
            <ListTodo className="h-4 w-4" /> Plan Itinerary
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="discover" className="animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-white/50 backdrop-blur-md rounded-2xl p-6 border shadow-sm">
          <div className="mb-6">
            <h2 className="text-2xl font-headline font-bold text-primary">Explore All Activities</h2>
            <p className="text-sm text-muted-foreground">Star the activities you're interested in to add them to your planning shortlist.</p>
          </div>
          <DiscoveryTable />
        </div>
      </TabsContent>

      <TabsContent value="plan" className="animate-in fade-in zoom-in-95 duration-300">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Shortlist Sidebar */}
          <div className="w-full lg:w-1/3 flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xl font-headline font-bold text-primary">Your Shortlist</h2>
              <span className="text-xs bg-accent/20 px-2 py-1 rounded-full text-accent font-bold">
                {shortlist.length} items
              </span>
            </div>
            
            <ScrollArea className="h-[calc(100vh-20rem)] rounded-xl border bg-white/50 p-4 shadow-sm">
              {shortlist.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center p-8 opacity-50">
                  <Search className="w-8 h-8 mb-2" />
                  <p className="text-sm">No items starred yet.</p>
                  <p className="text-[10px]">Go to Discover to find activities.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {shortlist.map(activity => (
                    <ActivityCard 
                      key={activity.id} 
                      activity={activity} 
                      actionType="add"
                      onAction={() => addActivityToDay(activity, activeDayId)}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Day Planning Area */}
          <div className="w-full lg:w-2/3 flex flex-col gap-4">
            <div className="flex flex-col gap-4 px-2">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {days.map((day) => (
                    <div key={day.id} className="flex items-center">
                      <Button
                        variant={activeDayId === day.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActiveDayId(day.id)}
                        className={cn(
                          "rounded-full px-4 h-8 text-xs font-bold",
                          activeDayId === day.id ? "bg-primary" : "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="w-3 h-3 mr-2" />
                        {day.name}
                      </Button>
                      {days.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 -ml-2 text-muted-foreground hover:text-destructive"
                          onClick={() => removeDay(day.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" onClick={addDay} className="h-8 w-8 rounded-full p-0 border border-dashed">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowAI(!showAI)}
                    className="border-accent text-accent hover:bg-accent/5 h-8 text-xs"
                  >
                    <Sparkles className="w-3 h-3 mr-2" />
                    AI Ideas
                  </Button>
                  <Button 
                    size="sm"
                    asChild
                    className="bg-primary hover:bg-primary/90 text-white h-8 text-xs"
                  >
                    <a href={generateGoogleMapsLink()} target="_blank" rel="noopener noreferrer">
                      <Map className="w-3 h-3 mr-2" />
                      Map {activeDay.name}
                    </a>
                  </Button>
                </div>
              </div>
            </div>

            {showAI && (
              <div className="animate-in slide-in-from-top-4 duration-300">
                <AIRecommendations />
              </div>
            )}

            <div className="flex flex-col h-full bg-white/30 backdrop-blur-sm rounded-2xl border p-6 shadow-inner min-h-[400px]">
              {activeDay.activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center p-8">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Navigation className="w-8 h-8 opacity-20" />
                  </div>
                  <p className="font-medium text-lg">Empty Itinerary for {activeDay.name}</p>
                  <p className="text-sm">Add activities from your shortlist or use AI suggestions.</p>
                </div>
              ) : (
                <>
                  <ScrollArea className="flex-1 pr-4">
                    <div className="flex flex-col gap-4">
                      {activeDay.activities.map((activity, index) => (
                        <div key={activity.id} className="relative">
                          {index > 0 && !activity.isOptional && (
                            <div className="absolute -top-4 left-10 w-0.5 h-4 bg-primary/20" />
                          )}
                          <ActivityCard 
                            activity={activity} 
                            actionType="remove"
                            onAction={() => removeActivityFromDay(activity.id, activeDayId)}
                            onToggleOptional={() => toggleOptional(activity.id, activeDayId)}
                          />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  <div className="mt-6 pt-6 border-t border-primary/10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Alert className="bg-primary/5 border-primary/20 p-3">
                        <Navigation className="h-4 w-4" />
                        <AlertTitle className="text-[10px] uppercase tracking-wider font-bold text-primary/80 mb-0">Total Time</AlertTitle>
                        <AlertDescription className="text-xl font-headline font-bold text-primary">
                          {Math.floor(totalDuration / 60)}h {totalDuration % 60}m
                        </AlertDescription>
                      </Alert>

                      <Alert className="bg-accent/5 border-accent/20 p-3">
                        <Navigation className="h-4 w-4" />
                        <AlertTitle className="text-[10px] uppercase tracking-wider font-bold text-accent/80 mb-0">Est. Drive</AlertTitle>
                        <AlertDescription className="text-xl font-headline font-bold text-accent">
                          ~ {totalDriveTime} min
                        </AlertDescription>
                      </Alert>
                    </div>
                    <p className="mt-4 text-[10px] text-muted-foreground flex items-center justify-center">
                      <Info className="w-3 h-3 mr-1" /> Drive times are estimates starting from Tewksbury.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}