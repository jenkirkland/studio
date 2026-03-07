"use client"

import { usePlanner } from "./planner-store";
import { ActivityCard } from "./ActivityCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Map, Sparkles, Navigation, Info, Plus, Calendar as CalendarIcon, Search, ListTodo, Trash2, Clock, ChevronRight } from "lucide-react";
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
      <div className="flex items-center justify-center mb-10">
        <TabsList className="grid w-full max-w-lg grid-cols-2 bg-muted/40 p-1 border shadow-sm rounded-full">
          <TabsTrigger value="discover" className="flex items-center gap-2 rounded-full py-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md">
            <Search className="h-4 w-4" /> 1. Discover Activities
          </TabsTrigger>
          <TabsTrigger value="plan" className="flex items-center gap-2 rounded-full py-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md">
            <ListTodo className="h-4 w-4" /> 2. Build Your Plan
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="discover" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="bg-white rounded-3xl p-8 border shadow-xl">
          <div className="mb-8">
            <h2 className="text-3xl font-headline font-black text-foreground tracking-tight mb-2">The Big List</h2>
            <p className="text-muted-foreground text-lg">Browse all 50+ curated activities. Star your favorites to add them to your planning shortlist.</p>
          </div>
          <DiscoveryTable />
        </div>
      </TabsContent>

      <TabsContent value="plan" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex flex-col xl:flex-row gap-8">
          {/* Shortlist Sidebar */}
          <div className="w-full xl:w-[380px] flex flex-col gap-6">
            <div className="flex items-center justify-between px-2">
              <div className="flex flex-col">
                <h2 className="text-2xl font-headline font-black text-foreground">Interested</h2>
                <p className="text-xs text-muted-foreground">Your starred activities</p>
              </div>
              <Badge variant="secondary" className="px-3 py-1 font-bold">
                {shortlist.length} Items
              </Badge>
            </div>
            
            <ScrollArea className="h-[calc(100vh-22rem)] rounded-2xl border bg-white/40 backdrop-blur-md p-4 shadow-inner">
              {shortlist.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center p-8 opacity-60">
                  <div className="bg-primary/5 p-4 rounded-full mb-4">
                    <Search className="w-8 h-8 text-primary/40" />
                  </div>
                  <p className="font-bold text-lg mb-1">Your shortlist is empty</p>
                  <p className="text-sm">Go to 'Discover' and star activities you'd like to include in your trip.</p>
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
          <div className="flex-1 flex flex-col gap-6">
            <div className="flex flex-col gap-6 bg-white p-6 rounded-3xl border shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide max-w-full">
                  {days.map((day) => (
                    <div key={day.id} className="flex items-center group relative">
                      <Button
                        variant={activeDayId === day.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActiveDayId(day.id)}
                        className={cn(
                          "rounded-full px-6 h-10 text-xs font-black transition-all shadow-sm",
                          activeDayId === day.id ? "bg-primary text-white scale-105" : "bg-white text-muted-foreground hover:border-primary/50"
                        )}
                      >
                        <CalendarIcon className="w-3.5 h-3.5 mr-2" />
                        {day.name}
                      </Button>
                      {days.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 bg-white border border-destructive/20 shadow-md text-destructive hover:bg-destructive hover:text-white rounded-full"
                          onClick={() => removeDay(day.id)}
                        >
                          <Trash2 className="h-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addDay} className="h-10 w-10 rounded-full p-0 border-dashed border-primary/30 hover:border-primary text-primary transition-all hover:scale-110">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2 bg-muted/30 p-1.5 rounded-xl border">
                  <OptimizeItinerary />
                  <div className="w-px h-6 bg-border mx-1" />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowAI(!showAI)}
                    className={cn(
                      "h-8 text-xs font-bold transition-all", 
                      showAI ? "bg-primary text-white border-primary shadow-sm" : "border-primary/30 text-primary hover:bg-primary/5"
                    )}
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-2" />
                    AI Assistant
                  </Button>
                  <Button 
                    size="sm"
                    asChild
                    className="bg-accent hover:bg-accent/90 text-white h-8 text-xs font-black shadow-sm"
                  >
                    <a href={generateGoogleMapsLink()} target="_blank" rel="noopener noreferrer">
                      <Map className="w-3.5 h-3.5 mr-2" />
                      Map Day
                    </a>
                  </Button>
                </div>
              </div>
            </div>

            {showAI && (
              <div className="animate-in slide-in-from-top-4 duration-500">
                <AIRecommendations />
              </div>
            )}

            <div className="flex-1 bg-white rounded-[32px] border border-primary/10 shadow-2xl p-8 min-h-[600px] flex flex-col relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary/10" />
              
              {activeDay.activities.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                  <div className="w-32 h-32 bg-primary/5 rounded-full flex items-center justify-center mb-8 border border-primary/10 shadow-inner">
                    <Navigation className="w-14 h-14 text-primary opacity-20" />
                  </div>
                  <h3 className="font-headline font-black text-3xl text-foreground mb-4">Your {activeDay.name} Itinerary</h3>
                  <p className="max-w-md text-muted-foreground leading-relaxed">
                    Start adding activities from your starred list on the left. Once added, you can toggle them as "Optional" or use the <strong>AI Assistant</strong> to find perfect matches.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-8 border-primary/20 text-primary group"
                    onClick={() => document.querySelector('[value="discover"]')?.dispatchEvent(new MouseEvent('click', {bubbles: true}))}
                  >
                    Go discover activities <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              ) : (
                <>
                  <ScrollArea className="flex-1 pr-6">
                    <div className="flex flex-col gap-8 pb-8">
                      {activeDay.activities.map((activity, index) => (
                        <div key={activity.id} className="relative group pl-12">
                          {/* Progress Line */}
                          {index < activeDay.activities.length - 1 && !activity.isOptional && (
                            <div className="absolute top-10 left-[1.125rem] w-0.5 h-[calc(100%+2rem)] bg-gradient-to-b from-primary/30 to-primary/5 z-0" />
                          )}
                          
                          {/* Timeline Marker */}
                          <div className="absolute left-0 top-1 flex flex-col items-center">
                            <div className={cn(
                              "w-9 h-9 rounded-full border-4 flex items-center justify-center font-black text-sm bg-white z-10 shadow-md transition-all group-hover:scale-110",
                              activity.isMeal ? "border-accent text-accent" : "border-primary text-primary"
                            )}>
                              {activity.scheduledTime ? <Clock className="w-4 h-4" /> : index + 1}
                            </div>
                            {activity.scheduledTime && (
                              <span className="text-[10px] font-black text-primary mt-2 bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10 whitespace-nowrap uppercase tracking-tighter">
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

                  {/* Day Footer Stats */}
                  <div className="mt-8 pt-8 border-t border-primary/5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="bg-primary/[0.03] rounded-2xl p-5 border border-primary/10 hover:bg-primary/[0.05] transition-colors">
                        <div className="flex items-center gap-2 mb-2 text-primary/60">
                          <Clock className="w-4 h-4" />
                          <p className="text-[10px] font-black uppercase tracking-widest">Active Time</p>
                        </div>
                        <p className="text-4xl font-headline font-black text-primary">
                          {Math.floor(totalDuration / 60)}h <span className="text-xl font-bold">{totalDuration % 60}m</span>
                        </p>
                      </div>

                      <div className="bg-accent/[0.03] rounded-2xl p-5 border border-accent/10 hover:bg-accent/[0.05] transition-colors">
                        <div className="flex items-center gap-2 mb-2 text-accent/60">
                          <Navigation className="w-4 h-4" />
                          <p className="text-[10px] font-black uppercase tracking-widest">Est. Travel</p>
                        </div>
                        <p className="text-4xl font-headline font-black text-accent">
                          ~ {totalDriveTime} <span className="text-xl font-bold">min</span>
                        </p>
                      </div>

                      <div className="sm:col-span-2 lg:col-span-1 bg-muted/20 rounded-2xl p-5 border border-border flex flex-col justify-center">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Info className="w-4 h-4 text-primary" />
                          <p className="text-xs font-medium leading-relaxed">
                            Click <strong>"Optimize Order"</strong> to automatically arrange your stops and add meal breaks.
                          </p>
                        </div>
                      </div>
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
