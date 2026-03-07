"use client"

import { usePlanner, PlannedActivity, DayPlan } from "./planner-store";
import { ActivityCard } from "./ActivityCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Map, Sparkles, Navigation, Info, Plus, Search, ListTodo, Trash2, Clock, LayoutDashboard, Settings2, Utensils, Loader2, Wand2 } from "lucide-react";
import { DiscoveryTable } from "./DiscoveryTable";
import { AIRecommendations } from "./AIRecommendations";
import { OptimizeItinerary } from "./OptimizeItinerary";
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
      
      // Step 1: Initial Distribution (Logical grouping)
      for (let i = 0; i < tripDuration; i++) {
        initialDays.push({ id: `day-${Date.now()}-${i}`, name: `Day ${i + 1}`, activities: [] });
      }

      const items = [...shortlist];
      let currentDayIdx = 0;
      while (items.length > 0 && currentDayIdx < tripDuration) {
        const activity = items[0];
        const currentDayTime = initialDays[currentDayIdx].activities.reduce((s, a) => s + a.durationMinutes, 0);
        
        if (currentDayTime + activity.durationMinutes + 20 <= maxMinutesPerDay) {
          initialDays[currentDayIdx].activities.push({ ...activity, isOptional: false });
          items.shift();
        } else {
          currentDayIdx++;
        }
      }

      // Step 2: Sequential Optimization (AI calls)
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
              address: a.address
            })),
            startHour: startHour
          });

          if (result?.itinerary) {
            const planned: PlannedActivity[] = result.itinerary.map(item => {
              const existing = day.activities.find(a => a.id === item.id);
              return {
                id: item.id || `meal-${Date.now()}-${Math.random()}`,
                name: item.name,
                description: item.reason || (existing?.description || "A recommended stop for your day."),
                type: item.type === 'meal' ? 'food' : (existing?.type || 'sightseeing'),
                durationMinutes: item.durationMinutes,
                address: existing?.address || item.name,
                scheduledTime: item.startTime,
                endTime: item.endTime,
                isOptional: false,
                isMeal: item.type === 'meal',
                travelTimeFromPrev: item.travelTimeMinutes
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

      // Step 3: Update State
      setDays(optimizedDays);
      setShortlist(items);
      setActiveDayId(optimizedDays[0].id);

      toast({
        title: "Trip Ready!",
        description: `Your ${tripDuration}-day itinerary has been created and optimized.`,
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
    return `https://www.google.com/maps/dir/${origin}/${destinations}`;
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
                Browse our hand-picked selection of gems. <strong>Star</strong> the ones you like to build your personal wishlist for planning.
              </p>
            </div>
            <div className="bg-primary/5 px-4 py-2 rounded-2xl border border-primary/10">
              <span className="text-xs font-black uppercase tracking-widest text-primary">{shortlist.length} Items Starred</span>
            </div>
          </div>
          <DiscoveryTable />
        </div>
      </TabsContent>

      <TabsContent value="plan" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex flex-col lg:flex-row gap-10 items-start">
          {/* Left Column: Shortlist & Config */}
          <div className="w-full lg:w-96 flex flex-col gap-8 lg:sticky lg:top-8">
            <div className="bg-white p-6 rounded-3xl border border-primary/10 shadow-lg space-y-6">
              <div className="flex items-center gap-3 text-primary">
                <div className="bg-primary/10 p-2 rounded-xl">
                  <Settings2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black uppercase tracking-wider">Trip Configuration</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Duration (Days)</Label>
                  <Input 
                    type="number" 
                    value={tripDuration} 
                    onChange={(e) => setTripDuration(parseInt(e.target.value) || 1)}
                    className="h-11 text-sm font-black border-primary/10 rounded-xl focus-visible:ring-primary/20"
                    min={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Start Time (0-23)</Label>
                  <Input 
                    type="number" 
                    value={startHour} 
                    onChange={(e) => setStartHour(parseInt(e.target.value) || 9)}
                    className="h-11 text-sm font-black border-primary/10 rounded-xl focus-visible:ring-primary/20"
                    min={0}
                    max={23}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Daily Activity Limit (Hours)</Label>
                  <Input 
                    type="number" 
                    value={dailyActiveHours} 
                    onChange={(e) => setDailyActiveHours(parseInt(e.target.value) || 8)}
                    className="h-11 text-sm font-black border-primary/10 rounded-xl focus-visible:ring-primary/20"
                  />
                </div>
              </div>

              <Button 
                onClick={handleAutoGroupAndOptimize}
                disabled={shortlist.length === 0 || isGrouping}
                className="w-full bg-primary hover:bg-primary/90 text-white font-black text-sm h-12 rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]"
              >
                {isGrouping ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Sparkles className="w-5 h-5 mr-2" />
                )}
                Auto-Group & Optimize
              </Button>
            </div>

            <div>
              <div className="flex items-center justify-between px-2 mb-4">
                <div>
                  <h3 className="text-xl font-black text-foreground">Interested Items</h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Your Shortlist</p>
                </div>
                <Badge variant="secondary" className="px-3 py-1 text-[11px] font-black bg-primary/10 text-primary border-primary/20 rounded-full">
                  {shortlist.length} Starred
                </Badge>
              </div>
              
              <ScrollArea className="h-[600px] rounded-3xl border border-primary/5 bg-primary/5 p-5 shadow-inner">
                {shortlist.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center p-8">
                    <div className="bg-white p-4 rounded-full mb-4 shadow-md border border-primary/10">
                      <Search className="w-8 h-8 text-primary/30" />
                    </div>
                    <p className="font-black text-sm mb-2 text-primary/60">Wishlist is empty</p>
                    <p className="text-xs leading-relaxed">Go to 'Discover' and star activities to begin your plan.</p>
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
          </div>

          {/* Right Column: Main Planning Area */}
          <div className="flex-1 w-full flex flex-col gap-8">
            <div className="bg-white p-5 rounded-3xl border shadow-lg flex flex-wrap items-center justify-between gap-6 border-primary/5">
              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {days.map((day) => (
                  <div key={day.id} className="flex items-center group relative">
                    <Button
                      variant={activeDayId === day.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveDayId(day.id)}
                      className={cn(
                        "rounded-2xl px-6 h-11 text-sm font-black transition-all shadow-sm",
                        activeDayId === day.id ? "bg-primary text-white scale-105" : "bg-white text-muted-foreground hover:border-primary/40"
                      )}
                    >
                      {day.name}
                    </Button>
                    {days.length > 1 && (
                      <button
                        className="h-6 w-6 absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 bg-white border border-destructive/20 shadow-md text-destructive hover:bg-destructive hover:text-white rounded-full flex items-center justify-center transition-all z-20"
                        onClick={() => removeDay(day.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addDay} className="h-11 w-11 rounded-2xl p-0 border-dashed border-primary/30 text-primary hover:bg-primary/5 transition-colors">
                  <Plus className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex items-center gap-3 bg-muted/40 p-2 rounded-2xl border border-primary/5">
                <OptimizeItinerary />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSuggestFood}
                  disabled={loadingFood}
                  className="border-primary/20 text-primary hover:bg-primary/5 h-9 text-xs font-black rounded-xl"
                >
                  {loadingFood ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Utensils className="w-3.5 h-3.5 mr-2" />}
                  Food Nearby
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAI(!showAI)}
                  className={cn(
                    "h-9 text-xs font-black transition-all rounded-xl", 
                    showAI ? "bg-primary text-white border-primary shadow-md" : "border-primary/20 text-primary hover:bg-primary/5"
                  )}
                >
                  <Sparkles className="w-3.5 h-3.5 mr-2" />
                  AI Tips
                </Button>
                <Button 
                  size="sm"
                  asChild
                  className="bg-accent hover:bg-accent/90 text-white h-9 text-xs font-black shadow-md rounded-xl px-5"
                >
                  <a href={generateGoogleMapsLink()} target="_blank" rel="noopener noreferrer">
                    <Map className="w-3.5 h-3.5 mr-2" />
                    Map Route
                  </a>
                </Button>
              </div>
            </div>

            {showAI && (
              <div className="animate-in slide-in-from-top-4 duration-500">
                <AIRecommendations />
              </div>
            )}

            <div className="bg-white rounded-[40px] border border-primary/5 shadow-2xl p-8 md:p-12 min-h-[700px] flex flex-col relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2.5 h-full bg-primary/5" />
              
              <div className="flex items-center gap-4 mb-12 pl-6">
                <div className="bg-primary/10 p-3.5 rounded-2xl">
                  <LayoutDashboard className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-foreground">{activeDay.name} Itinerary</h2>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Plan Timeline</p>
                </div>
              </div>

              {activeDay.activities.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-16">
                  <div className="w-28 h-28 bg-primary/5 rounded-full flex items-center justify-center mb-8 border border-primary/10">
                    <Navigation className="w-12 h-12 text-primary opacity-20" />
                  </div>
                  <h3 className="font-black text-2xl text-foreground mb-4">Day is Empty</h3>
                  <p className="max-w-md text-sm text-muted-foreground leading-relaxed">
                    Choose activities from your wishlist on the left or use <strong>Auto-Group</strong> to instantly generate a balanced multi-day plan.
                  </p>
                </div>
              ) : (
                <>
                  <ScrollArea className="flex-1 pr-6">
                    <div className="space-y-16 pb-12">
                      {activeDay.activities.map((activity, index) => (
                        <div key={activity.id} className="relative group pl-16">
                          {activity.travelTimeFromPrev && (
                             <div className="absolute -top-10 left-0 pl-20 flex items-center gap-3">
                               <div className="h-1 w-6 bg-accent/20 rounded-full" />
                               <span className="text-[10px] font-black uppercase text-accent bg-accent/5 px-3 py-1 rounded-full border border-accent/20 whitespace-nowrap shadow-sm">
                                 Travel: ~{activity.travelTimeFromPrev} min
                               </span>
                             </div>
                          )}

                          {index < activeDay.activities.length - 1 && (
                            <div className="absolute top-12 left-[1.875rem] w-1 h-[calc(100%+4rem)] bg-gradient-to-b from-primary/30 via-primary/10 to-transparent rounded-full" />
                          )}
                          
                          <div className="absolute left-0 top-0 flex flex-col items-center">
                            <div className={cn(
                              "w-14 h-14 rounded-2xl border-4 flex items-center justify-center font-black text-lg bg-white shadow-xl z-10 transition-all group-hover:scale-110 group-hover:rotate-3",
                              activity.isMeal ? "border-accent text-accent" : "border-primary text-primary"
                            )}>
                              {activity.scheduledTime ? <Clock className="w-6 h-6" /> : index + 1}
                            </div>
                            {activity.scheduledTime && (
                              <div className="mt-3 flex flex-col items-center gap-1">
                                <span className="text-[10px] font-black text-primary bg-primary/5 px-3 py-1 rounded-xl border border-primary/10 whitespace-nowrap uppercase tracking-widest shadow-sm">
                                  {activity.scheduledTime}
                                </span>
                                {activity.endTime && (
                                  <span className="text-[9px] font-bold text-muted-foreground">
                                    to {activity.endTime}
                                  </span>
                                )}
                              </div>
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

                  <div className="mt-10 pt-10 border-t flex flex-wrap gap-12 items-center justify-between">
                    <div className="flex gap-12">
                      <div className="bg-primary/5 p-4 rounded-3xl border border-primary/10">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Total Activity Time</p>
                        <p className="text-4xl font-black text-primary">
                          {Math.floor(totalDuration / 60)}h <span className="text-xl font-bold">{totalDuration % 60}m</span>
                        </p>
                      </div>
                      <div className="bg-accent/5 p-4 rounded-3xl border border-accent/10">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Estimated Travel</p>
                        <p className="text-4xl font-black text-accent">
                          ~{totalTravelTime} <span className="text-xl font-bold">min</span>
                        </p>
                      </div>
                    </div>
                    <div className="hidden xl:flex items-center gap-4 text-xs text-muted-foreground bg-primary/5 px-6 py-4 rounded-[30px] border border-primary/10 max-w-sm leading-relaxed">
                      <div className="bg-white p-2 rounded-xl shadow-sm shrink-0">
                        <Info className="w-5 h-5 text-primary" />
                      </div>
                      <span>Use "Food Nearby" to discover expert-curated dining situated logically along your planned route.</span>
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
