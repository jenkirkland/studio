"use client"

import { usePlanner } from "./planner-store";
import { ActivityCard } from "./ActivityCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Map, Sparkles, Navigation, Info, Plus, Calendar as CalendarIcon, Search, ListTodo, Trash2, Clock, ChevronRight, LayoutDashboard } from "lucide-react";
import { DiscoveryTable } from "./DiscoveryTable";
import { AIRecommendations } from "./AIRecommendations";
import { OptimizeItinerary } from "./OptimizeItinerary";
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
        <TabsList className="grid w-full max-w-md grid-cols-2 bg-muted p-1 border shadow-sm rounded-xl">
          <TabsTrigger value="discover" className="flex items-center gap-2 rounded-lg py-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
            <Search className="h-4 w-4" /> Discover
          </TabsTrigger>
          <TabsTrigger value="plan" className="flex items-center gap-2 rounded-lg py-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
            <ListTodo className="h-4 w-4" /> Plan My Trip
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="discover" className="animate-in fade-in duration-300">
        <div className="bg-white rounded-2xl p-6 border shadow-lg">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-foreground mb-1">Activity Library</h2>
            <p className="text-muted-foreground text-sm">Explore curated experiences. Star items to add them to your planning shortlist.</p>
          </div>
          <DiscoveryTable />
        </div>
      </TabsContent>

      <TabsContent value="plan" className="animate-in fade-in duration-300">
        <div className="flex flex-col xl:flex-row gap-6">
          {/* Sidebar: Shortlist */}
          <div className="w-full xl:w-80 flex flex-col gap-4">
            <div className="flex items-center justify-between px-1">
              <div>
                <h3 className="text-lg font-black text-foreground">Interested</h3>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Your Shortlist</p>
              </div>
              <Badge variant="secondary" className="px-2 py-0.5 text-[10px] font-bold">
                {shortlist.length} Items
              </Badge>
            </div>
            
            <ScrollArea className="h-[600px] rounded-2xl border bg-secondary/20 p-4">
              {shortlist.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center p-6 opacity-60">
                  <div className="bg-white p-3 rounded-full mb-3 shadow-sm border">
                    <Search className="w-6 h-6 text-primary/40" />
                  </div>
                  <p className="font-bold text-sm mb-1">Nothing here yet</p>
                  <p className="text-[11px]">Go to 'Discover' and star activities to add them to this list.</p>
                </div>
              ) : (
                <div className="space-y-4">
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

          {/* Main Planning Area */}
          <div className="flex-1 flex flex-col gap-6">
            {/* Toolbar */}
            <div className="bg-white p-4 rounded-2xl border shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide max-w-full">
                {days.map((day) => (
                  <div key={day.id} className="flex items-center group relative">
                    <Button
                      variant={activeDayId === day.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveDayId(day.id)}
                      className={cn(
                        "rounded-full px-5 h-9 text-xs font-bold transition-all shadow-sm",
                        activeDayId === day.id ? "bg-primary text-white" : "bg-white text-muted-foreground hover:border-primary/50"
                      )}
                    >
                      {day.name}
                    </Button>
                    {days.length > 1 && (
                      <button
                        className="h-4 w-4 absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 bg-white border border-destructive/20 shadow-sm text-destructive hover:bg-destructive hover:text-white rounded-full flex items-center justify-center transition-all"
                        onClick={() => removeDay(day.id)}
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addDay} className="h-9 w-9 rounded-full p-0 border-dashed border-primary/30 text-primary">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2 bg-muted/30 p-1.5 rounded-xl border">
                <OptimizeItinerary />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAI(!showAI)}
                  className={cn(
                    "h-8 text-xs font-bold transition-all", 
                    showAI ? "bg-primary text-white border-primary" : "border-primary/30 text-primary hover:bg-primary/5"
                  )}
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Smart Suggestions
                </Button>
                <Button 
                  size="sm"
                  asChild
                  className="bg-accent hover:bg-accent/90 text-white h-8 text-xs font-bold shadow-sm"
                >
                  <a href={generateGoogleMapsLink()} target="_blank" rel="noopener noreferrer">
                    <Map className="w-3.5 h-3.5 mr-1.5" />
                    View Map
                  </a>
                </Button>
              </div>
            </div>

            {showAI && (
              <div className="animate-in slide-in-from-top-2 duration-300">
                <AIRecommendations />
              </div>
            )}

            {/* Itinerary Column */}
            <div className="bg-white rounded-3xl border shadow-xl p-6 min-h-[600px] flex flex-col relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/10" />
              
              <div className="flex items-center gap-3 mb-8 pl-4">
                <LayoutDashboard className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-black text-foreground">{activeDay.name} Itinerary</h2>
              </div>

              {activeDay.activities.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                  <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mb-6 border border-primary/10">
                    <Navigation className="w-10 h-10 text-primary opacity-20" />
                  </div>
                  <h3 className="font-bold text-xl text-foreground mb-3">Your Itinerary is Empty</h3>
                  <p className="max-w-xs text-xs text-muted-foreground leading-relaxed">
                    Start adding activities from your starred list on the left. You can then toggle them as optional or use the AI to optimize your day.
                  </p>
                </div>
              ) : (
                <>
                  <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-8 pb-8">
                      {activeDay.activities.map((activity, index) => (
                        <div key={activity.id} className="relative group pl-10">
                          {/* Progress Line */}
                          {index < activeDay.activities.length - 1 && (
                            <div className="absolute top-8 left-[1.125rem] w-0.5 h-[calc(100%+2rem)] bg-gradient-to-b from-primary/30 to-transparent" />
                          )}
                          
                          {/* Timeline Marker */}
                          <div className="absolute left-0 top-0 flex flex-col items-center">
                            <div className={cn(
                              "w-9 h-9 rounded-full border-2 flex items-center justify-center font-black text-xs bg-white shadow-sm z-10 transition-transform group-hover:scale-110",
                              activity.isMeal ? "border-accent text-accent" : "border-primary text-primary"
                            )}>
                              {activity.scheduledTime ? <Clock className="w-4 h-4" /> : index + 1}
                            </div>
                            {activity.scheduledTime && (
                              <span className="text-[9px] font-bold text-primary mt-2 bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10 whitespace-nowrap uppercase">
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
                      ))}
                    </div>
                  </ScrollArea>

                  {/* Summary Footer */}
                  <div className="mt-6 pt-6 border-t flex flex-wrap gap-6 items-center justify-between">
                    <div className="flex gap-8">
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Active Time</p>
                        <p className="text-2xl font-black text-primary">
                          {Math.floor(totalDuration / 60)}h <span className="text-sm font-bold">{totalDuration % 60}m</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Travel Estimate</p>
                        <p className="text-2xl font-black text-accent">
                          ~{totalDriveTime} <span className="text-sm font-bold">min</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/30 px-4 py-2 rounded-xl border">
                      <Info className="w-3.5 h-3.5 text-primary" />
                      <span>Optimizing adds meal breaks and reorders stops.</span>
                    </div>
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