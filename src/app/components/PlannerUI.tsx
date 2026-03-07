"use client"

import { usePlanner } from "./planner-store";
import { ActivityCard } from "./ActivityCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Map, Sparkles, Navigation, Info, Plus, Calendar as CalendarIcon, Search, ListTodo, Trash2, Clock } from "lucide-react";
import { DiscoveryTable } from "./DiscoveryTable";
import { AIRecommendations } from "./AIRecommendations";
import { OptimizeItinerary } from "./OptimizeItinerary";
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
        <TabsList className="grid w-full max-w-md grid-cols-2 bg-white border shadow-sm">
          <TabsTrigger value="discover" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Search className="h-4 w-4" /> Discover
          </TabsTrigger>
          <TabsTrigger value="plan" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <ListTodo className="h-4 w-4" /> Plan Itinerary
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="discover" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="bg-white rounded-2xl p-6 border shadow-lg">
          <div className="mb-6">
            <h2 className="text-3xl font-headline font-black text-primary mb-1">Explore Activities</h2>
            <p className="text-muted-foreground">Select the activities you're interested in to build your custom shortlist.</p>
          </div>
          <DiscoveryTable />
        </div>
      </TabsContent>

      <TabsContent value="plan" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Shortlist Sidebar */}
          <div className="w-full lg:w-1/3 flex flex-col gap-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-2xl font-headline font-bold text-foreground">Shortlist</h2>
              <span className="text-sm bg-primary/10 px-3 py-1 rounded-full text-primary font-bold">
                {shortlist.length} items
              </span>
            </div>
            
            <ScrollArea className="h-[calc(100vh-18rem)] rounded-2xl border bg-white/60 backdrop-blur-sm p-4 shadow-sm">
              {shortlist.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center p-8 opacity-60">
                  <Search className="w-10 h-10 mb-3" />
                  <p className="font-bold text-lg">No items starred</p>
                  <p className="text-sm">Explore activities and star them to see them here.</p>
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
          <div className="w-full lg:w-2/3 flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide max-w-full">
                  {days.map((day) => (
                    <div key={day.id} className="flex items-center group">
                      <Button
                        variant={activeDayId === day.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActiveDayId(day.id)}
                        className={cn(
                          "rounded-full px-5 h-9 text-xs font-bold transition-all shadow-sm",
                          activeDayId === day.id ? "bg-primary text-white scale-105" : "bg-white text-muted-foreground hover:border-primary"
                        )}
                      >
                        <CalendarIcon className="w-3.5 h-3.5 mr-2" />
                        {day.name}
                      </Button>
                      {days.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 -ml-3 z-10 opacity-0 group-hover:opacity-100 bg-white border shadow-sm text-destructive hover:bg-destructive/10"
                          onClick={() => removeDay(day.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addDay} className="h-9 w-9 rounded-full p-0 border-dashed border-primary/40 hover:border-primary text-primary">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex gap-2">
                  <OptimizeItinerary />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowAI(!showAI)}
                    className={cn("h-8 text-xs font-medium", showAI ? "bg-accent text-white border-accent" : "border-accent text-accent hover:bg-accent/5")}
                  >
                    <Sparkles className="w-3 h-3 mr-2" />
                    AI Ideas
                  </Button>
                  <Button 
                    size="sm"
                    asChild
                    className="bg-primary hover:bg-primary/90 text-white h-8 text-xs font-bold shadow-sm"
                  >
                    <a href={generateGoogleMapsLink()} target="_blank" rel="noopener noreferrer">
                      <Map className="w-3 h-3 mr-2" />
                      Map It
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

            <div className="flex flex-col h-full bg-white rounded-3xl border shadow-xl p-8 min-h-[500px]">
              {activeDay.activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center p-12">
                  <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mb-6 border border-primary/10">
                    <Navigation className="w-12 h-12 text-primary opacity-30" />
                  </div>
                  <h3 className="font-headline font-black text-2xl text-foreground mb-2">Build Itinerary for {activeDay.name}</h3>
                  <p className="max-w-md text-sm">Select activities from your shortlist on the left or use AI suggestions to start planning your perfect day.</p>
                </div>
              ) : (
                <>
                  <ScrollArea className="flex-1 pr-4">
                    <div className="flex flex-col gap-6">
                      {activeDay.activities.map((activity, index) => (
                        <div key={activity.id} className="relative group">
                          {index < activeDay.activities.length - 1 && !activity.isOptional && (
                            <div className="absolute top-full left-[2.25rem] w-1 h-6 bg-primary/10 z-0" />
                          )}
                          <div className="flex gap-4 items-start">
                             <div className="flex flex-col items-center pt-2">
                               <div className={cn(
                                 "w-9 h-9 rounded-full border-2 flex items-center justify-center font-bold text-sm bg-white z-10 shadow-sm",
                                 activity.isMeal ? "border-accent text-accent" : "border-primary text-primary"
                               )}>
                                 {activity.scheduledTime ? <Clock className="w-4 h-4" /> : index + 1}
                               </div>
                               {activity.scheduledTime && (
                                 <span className="text-[10px] font-bold text-primary mt-1 whitespace-nowrap">
                                   {activity.scheduledTime}
                                 </span>
                               )}
                             </div>
                             <div className="flex-1">
                               <ActivityCard 
                                activity={activity} 
                                actionType="remove"
                                onAction={() => removeActivityFromDay(activity.id, activeDayId)}
                                onToggleOptional={() => toggleOptional(activity.id, activeDayId)}
                              />
                             </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  <div className="mt-8 pt-6 border-t border-primary/10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-1">Total Active Time</p>
                        <p className="text-3xl font-headline font-black text-primary">
                          {Math.floor(totalDuration / 60)}h {totalDuration % 60}m
                        </p>
                      </div>

                      <div className="bg-accent/5 rounded-2xl p-4 border border-accent/10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-accent/60 mb-1">Estimated Travel</p>
                        <p className="text-3xl font-headline font-black text-accent">
                          ~ {totalDriveTime} min
                        </p>
                      </div>
                    </div>
                    <p className="mt-6 text-xs text-muted-foreground flex items-center justify-center bg-muted/30 py-2 rounded-lg">
                      <Info className="w-3.5 h-3.5 mr-2 text-primary" /> 
                      Pro-tip: Use "Optimize Order" to get a timed schedule including travel logic.
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