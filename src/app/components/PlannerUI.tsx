"use client"

import { usePlanner, PlannedActivity, DayPlan } from "./planner-store";
import { ActivityCard } from "./ActivityCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Map, Sparkles, Navigation, Info, Plus, Search, ListTodo, Trash2, Clock, LayoutDashboard, Settings2, Utensils, Loader2, Wand2, CalendarClock } from "lucide-react";
import { DiscoveryTable } from "./DiscoveryTable";
import { AIRecommendations } from "./AIRecommendations";
import { OptimizeItinerary } from "./OptimizeItinerary";
import { CustomActivityDialog } from "./CustomActivityDialog";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { suggestNearbyFood } from "@/ai/flows/suggest-nearby-food-flow";
import { optimizeItinerary } from "@/ai/flows/optimize-itinerary-flow";
import { toast } from "@/hooks/use-toast";

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
    toggleOptional,
    tripDuration,
    setTripDuration,
    dailyActiveHours,
    setDailyActiveHours,
    startHour,
    setStartHour,
    setDays,
    setShortlist
  } = usePlanner();
  
  const [showAI, setShowAI] = useState(false);
  const [loadingFood, setLoadingFood] = useState(false);
  const [isGrouping, setIsGrouping] = useState(false);

  const activeDay = days.find(d => d.id === activeDayId) || days[0];

  const totalDuration = activeDay.activities.reduce((sum, a) => sum + (a.isOptional ? 0 : a.durationMinutes), 0);
  const totalTravelTime = activeDay.activities.reduce((sum, a) => sum + (a.travelTimeFromPrev || 0), 0);

  const handleAutoGroupAndOptimize = async () => {
    if (shortlist.length === 0) return;
    
    setIsGrouping(true);
    toast({
      title: "Generating Trip Plan",
      description: "Organizing activities and calculating optimal routes...",
    });

    try {
      const maxMinutesPerDay = dailyActiveHours * 60;
      const initialDays: DayPlan[] = [];
      
      for (let i = 0; i < tripDuration; i++) {
        initialDays.push({ id: `day-${Date.now()}-${i}`, name: `Day ${i + 1}`, activities: [] });
      }

      const items = [...shortlist];
      let currentDayIdx = 0;
      while (items.length > 0 && currentDayIdx < tripDuration) {
        const activity = items[0];
        const currentDayTime = initialDays[currentDayIdx].activities.reduce((s, a) => s + a.durationMinutes, 0);
        
        if (currentDayTime + activity.durationMinutes + 30 <= maxMinutesPerDay) {
          initialDays[currentDayIdx].activities.push({ ...activity, isOptional: false });
          items.shift();
        } else {
          currentDayIdx++;
        }
      }

      const optimizedDays: DayPlan[] = [];
      for (const day of initialDays) {
        if (day.activities.length === 0) {
          optimizedDays.push(day);
          continue;
        }

        try {
          const result = await optimizeItinerary({
            activities: day.activities.map(a => ({
              id: a.id,
              name: a.name,
              durationMinutes: a.durationMinutes,
              type: a.type,
              address: a.address,
              fixedStartTime: a.fixedStartTime
            })),
            startHour: startHour
          });

          if (result?.itinerary) {
            const planned: PlannedActivity[] = result.itinerary.map(item => {
              const existing = day.activities.find(a => a.id === item.id);
              return {
                id: item.id || `optimized-${Date.now()}-${Math.random()}`,
                name: item.name,
                description: item.reason || (existing?.description || "A recommended stop for your day."),
                type: item.type === 'meal' ? 'food' : (existing?.type || 'sightseeing'),
                durationMinutes: item.durationMinutes,
                address: existing?.address || item.name,
                scheduledTime: item.startTime,
                endTime: item.endTime,
                isOptional: false,
                isMeal: item.type === 'meal',
                travelTimeFromPrev: item.travelTimeMinutes,
                fixedStartTime: existing?.fixedStartTime || (item.isFixed ? item.startTime : undefined)
              };
            });
            optimizedDays.push({ ...day, activities: planned });
          } else {
            optimizedDays.push(day);
          }
        } catch (err) {
          console.error(`Optimization failed for ${day.name}:`, err);
          optimizedDays.push(day);
        }
      }

      setDays(optimizedDays);
      setShortlist(items);
      setActiveDayId(optimizedDays[0].id);

      toast({
        title: "Trip Ready!",
        description: `Your ${tripDuration}-day itinerary has been created and optimized including return travel to Tewksbury.`,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Plan Generation Failed",
        description: "Something went wrong while grouping your activities.",
        variant: "destructive"
      });
    } finally {
      setIsGrouping(false);
    }
  };

  const handleSuggestFood = async () => {
    if (activeDay.activities.length < 1) {
      toast({ title: "Add activities first!", description: "We need a route to suggest food along.", variant: "destructive" });
      return;
    }
    setLoadingFood(true);
    try {
      const result = await suggestNearbyFood({
        activities: activeDay.activities.map(a => ({ name: a.name, address: a.address }))
      });
      toast({
        title: "Food Suggestions Ready!",
        description: `Try ${result.suggestions[0].name}: ${result.suggestions[0].reason}`,
      });
    } catch (err) {
      console.error(err);
      toast({ title: "AI Search Unavailable", description: "Ensure your API key is configured.", variant: "destructive" });
    } finally {
      setLoadingFood(false);
    }
  };

  const generateGoogleMapsLink = () => {
    const origin = "Tewksbury,MA";
    const destinations = activeDay.activities
      .filter(a => !a.isOptional)
      .map(a => encodeURIComponent(a.address))
      .join('/');
    
    if (destinations.length === 0) return `https://www.google.com/maps/dir/${origin}`;
    return `https://www.google.com/maps/dir/${origin}/${destinations}/${origin}`;
  };

  return (
    <Tabs defaultValue="discover" className="w-full">
      <div className="flex items-center justify-center mb-10">
        <TabsList className="grid w-full max-w-lg grid-cols-2 bg-muted p-1 border shadow-sm rounded-2xl h-12">
          <TabsTrigger value="discover" className="flex items-center gap-2 rounded-xl py-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md transition-all font-black text-sm uppercase tracking-wider">
            <Search className="h-4 w-4" /> 1. Discover
          </TabsTrigger>
          <TabsTrigger value="plan" className="flex items-center gap-2 rounded-xl py-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md transition-all font-black text-sm uppercase tracking-wider">
            <ListTodo className="h-4 w-4" /> 2. Plan My Day
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="discover" className="animate-in fade-in duration-500">
        <div className="bg-white rounded-3xl p-8 border shadow-xl border-primary/5">
          <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-3xl font-black text-foreground mb-2">Curated Experiences</h2>
              <p className="text-muted-foreground text-base max-w-2xl leading-relaxed">
                Browse the complete collection. <strong>Star</strong> items to add them to your planning shortlist.
              </p>
            </div>
            <div className="bg-primary/5 px-4 py-2 rounded-2xl border border-primary/10">
              <span className="text-xs font-black uppercase tracking-widest text-primary">{shortlist.length} Starred Items</span>
            </div>
          </div>
          <DiscoveryTable />
        </div>
      </TabsContent>

      <TabsContent value="plan" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Left Column: Config & Shortlist */}
          <div className="w-full md:w-80 lg:w-96 flex flex-col gap-6 md:sticky md:top-8">
            <div className="bg-white p-6 rounded-3xl border border-primary/10 shadow-lg space-y-6">
              <div className="flex items-center gap-3 text-primary">
                <Settings2 className="w-5 h-5" />
                <h3 className="text-sm font-black uppercase tracking-wider">Trip Settings</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-black text-muted-foreground">Days</Label>
                  <Input 
                    type="number" 
                    value={tripDuration} 
                    onChange={(e) => setTripDuration(parseInt(e.target.value) || 1)}
                    className="h-10 text-sm font-bold rounded-xl"
                    min={1}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-black text-muted-foreground">Start Time</Label>
                  <Input 
                    type="number" 
                    value={startHour} 
                    onChange={(e) => setStartHour(parseInt(e.target.value) || 9)}
                    className="h-10 text-sm font-bold rounded-xl"
                    min={0}
                    max={23}
                  />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label className="text-[10px] uppercase font-black text-muted-foreground">Daily Activity (Hours)</Label>
                  <Input 
                    type="number" 
                    value={dailyActiveHours} 
                    onChange={(e) => setDailyActiveHours(parseInt(e.target.value) || 8)}
                    className="h-10 text-sm font-bold rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <Button 
                  onClick={handleAutoGroupAndOptimize}
                  disabled={shortlist.length === 0 || isGrouping}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-black text-xs h-12 rounded-xl shadow-lg shadow-primary/20"
                >
                  {isGrouping ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  Auto-Group & Optimize
                </Button>
                
                <CustomActivityDialog />
              </div>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-primary/5 shadow-md flex-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Wishlist</h3>
                <Badge variant="outline" className="text-[10px] font-bold border-primary/30 text-primary">
                  {shortlist.length} Items
                </Badge>
              </div>
              
              <ScrollArea className="h-[500px] pr-2">
                {shortlist.length === 0 ? (
                  <div className="text-center py-12 px-4 border-2 border-dashed border-primary/10 rounded-2xl">
                    <p className="text-xs text-muted-foreground italic">Add items from the Discover tab to build your plan.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
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
          </div>

          {/* Right Column: Timeline */}
          <div className="flex-1 w-full space-y-6">
            <div className="bg-white p-4 rounded-3xl border shadow-md flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {days.map((day) => (
                  <div key={day.id} className="relative group">
                    <Button
                      variant={activeDayId === day.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveDayId(day.id)}
                      className={cn(
                        "rounded-xl px-5 h-10 text-xs font-black transition-all pr-8",
                        activeDayId === day.id ? "bg-primary text-white" : "text-muted-foreground"
                      )}
                    >
                      {day.name}
                    </Button>
                    {days.length > 1 && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeDay(day.id); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                <Button variant="ghost" size="icon" onClick={addDay} className="h-10 w-10 rounded-xl border border-dashed border-primary/30">
                  <Plus className="w-4 h-4 text-primary" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <OptimizeItinerary />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSuggestFood}
                  disabled={loadingFood}
                  className="h-8 text-[10px] font-black uppercase rounded-lg border-primary/20 text-primary"
                >
                  {loadingFood ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Utensils className="w-3 h-3 mr-1" />}
                  Food Nearby
                </Button>
                <Button 
                  size="sm"
                  asChild
                  className="bg-accent hover:bg-accent/90 text-white h-8 text-[10px] font-black uppercase rounded-lg px-4"
                >
                  <a href={generateGoogleMapsLink()} target="_blank" rel="noopener noreferrer">
                    <Map className="w-3 h-3 mr-1.5" />
                    Route
                  </a>
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-[40px] border border-primary/5 shadow-xl p-6 md:p-10 min-h-[600px] relative">
              <div className="flex items-center gap-4 mb-10">
                <div className="bg-primary/10 p-3 rounded-2xl">
                  <LayoutDashboard className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-foreground">{activeDay.name} Timeline</h2>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Interactive Itinerary</p>
                </div>
              </div>

              {activeDay.activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <Navigation className="w-12 h-12 text-primary/10 mb-4" />
                  <p className="text-sm text-muted-foreground">No activities planned for this day.</p>
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <div className="space-y-12 pb-8 ml-4">
                    {activeDay.activities.map((activity, index) => (
                      <div key={activity.id} className="relative pl-12">
                        {activity.travelTimeFromPrev !== undefined && (
                          <div className="absolute -top-8 left-14 flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-accent" />
                            <span className="text-[9px] font-black text-accent bg-accent/5 px-2 py-0.5 rounded border border-accent/10">
                              TRAVEL: {activity.travelTimeFromPrev} MIN
                            </span>
                          </div>
                        )}
                        
                        {index < activeDay.activities.length - 1 && (
                          <div className="absolute top-10 left-[1.125rem] w-0.5 h-[calc(100%+2rem)] bg-primary/10" />
                        )}
                        
                        <div className={cn(
                          "absolute left-0 top-0 w-9 h-9 rounded-xl border-2 flex items-center justify-center font-black text-xs shadow-sm z-10",
                          activity.fixedStartTime ? "bg-accent border-accent text-white" : "bg-white border-primary text-primary"
                        )}>
                          {activity.fixedStartTime ? <CalendarClock className="w-4 h-4" /> : (activity.scheduledTime ? <Clock className="w-4 h-4" /> : index + 1)}
                        </div>

                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            {activity.scheduledTime && (
                              <span className="text-[10px] font-black text-primary/70 uppercase">
                                {activity.scheduledTime} {activity.endTime && `— ${activity.endTime}`}
                              </span>
                            )}
                            {activity.fixedStartTime && (
                              <Badge variant="default" className="bg-accent text-[8px] font-black uppercase py-0 px-1.5 h-4">Fixed Point</Badge>
                            )}
                          </div>
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
              )}

              <div className="mt-8 pt-8 border-t flex items-center justify-between">
                <div className="flex gap-8">
                  <div>
                    <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Active Time</p>
                    <p className="text-2xl font-black text-primary">{Math.floor(totalDuration / 60)}h {totalDuration % 60}m</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Total Travel</p>
                    <p className="text-2xl font-black text-accent">~{totalTravelTime}m</p>
                  </div>
                </div>
                <div className="hidden lg:flex items-center gap-3 text-[10px] text-muted-foreground max-w-[200px]">
                  <Info className="w-4 h-4 text-primary shrink-0" />
                  <span>Times include travel from Tewksbury at the start and return travel at the end.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
