"use client"

import { usePlanner } from "./planner-store";
import { ActivityCard } from "./ActivityCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Map, Sparkles, Navigation, Info, Plus, Search, ListTodo, Trash2, Clock, LayoutDashboard, Settings2, Wand2, Utensils, Loader2 } from "lucide-react";
import { DiscoveryTable } from "./DiscoveryTable";
import { AIRecommendations } from "./AIRecommendations";
import { OptimizeItinerary } from "./OptimizeItinerary";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { suggestNearbyFood } from "@/ai/flows/suggest-nearby-food-flow";
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
    distributeShortlistIntoDays
  } = usePlanner();
  
  const [showAI, setShowAI] = useState(false);
  const [loadingFood, setLoadingFood] = useState(false);

  const activeDay = days.find(d => d.id === activeDayId) || days[0];

  const totalDuration = activeDay.activities.reduce((sum, a) => sum + (a.isOptional ? 0 : a.durationMinutes), 0);
  const totalTravelTime = activeDay.activities.reduce((sum, a) => sum + (a.travelTimeFromPrev || 0), 0);

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
      // For simplicity, we just toast the first suggestion for now or could show a dialog
      // In a real app, we'd add these to a special "Suggested Food" section
      toast({
        title: "Food Suggestions Ready!",
        description: `Try ${result.suggestions[0].name}: ${result.suggestions[0].reason}`,
      });
    } catch (err) {
      console.error(err);
      toast({ title: "Food Search Failed", variant: "destructive" });
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
      <div className="flex items-center justify-center mb-8">
        <TabsList className="grid w-full max-md:max-w-xs max-w-md grid-cols-2 bg-muted p-1 border shadow-sm rounded-xl">
          <TabsTrigger value="discover" className="flex items-center gap-2 rounded-lg py-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
            <Search className="h-4 w-4" /> Discovery Library
          </TabsTrigger>
          <TabsTrigger value="plan" className="flex items-center gap-2 rounded-lg py-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
            <ListTodo className="h-4 w-4" /> Build My Plan
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="discover" className="animate-in fade-in duration-300">
        <div className="bg-white rounded-2xl p-6 border shadow-lg">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-foreground mb-1">Activity Library</h2>
            <p className="text-muted-foreground text-sm">Star the activities you're interested in, then head to the Plan tab to build your itinerary.</p>
          </div>
          <DiscoveryTable />
        </div>
      </TabsContent>

      <TabsContent value="plan" className="animate-in fade-in duration-300">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Left Column: Shortlist & Config - Sticky on Desktop */}
          <div className="w-full lg:w-96 flex flex-col gap-6 lg:sticky lg:top-8">
            {/* Trip Config */}
            <div className="bg-white p-5 rounded-2xl border border-primary/20 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Settings2 className="w-4 h-4" />
                <h3 className="text-sm font-black uppercase tracking-wider">Trip Settings</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground">Days</Label>
                  <Input 
                    type="number" 
                    value={tripDuration} 
                    onChange={(e) => setTripDuration(parseInt(e.target.value) || 1)}
                    className="h-9 text-xs font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground">Start Time (24h)</Label>
                  <Input 
                    type="number" 
                    value={startHour} 
                    onChange={(e) => setStartHour(parseInt(e.target.value) || 9)}
                    className="h-9 text-xs font-bold"
                    min={0}
                    max={23}
                  />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground">Max Hours/Day</Label>
                  <Input 
                    type="number" 
                    value={dailyActiveHours} 
                    onChange={(e) => setDailyActiveHours(parseInt(e.target.value) || 1)}
                    className="h-9 text-xs font-bold"
                  />
                </div>
              </div>
              <Button 
                onClick={distributeShortlistIntoDays}
                disabled={shortlist.length === 0}
                className="w-full bg-accent hover:bg-accent/90 text-white font-black text-xs h-9 shadow-md"
              >
                <Wand2 className="w-3.5 h-3.5 mr-2" />
                Auto-Group Activities
              </Button>
            </div>

            <div className="flex items-center justify-between px-1">
              <div>
                <h3 className="text-lg font-black text-foreground">Interested</h3>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Your Shortlist</p>
              </div>
              <Badge variant="secondary" className="px-2 py-0.5 text-[10px] font-bold">
                {shortlist.length} Items
              </Badge>
            </div>
            
            <ScrollArea className="h-[400px] lg:h-[600px] rounded-2xl border bg-secondary/20 p-4">
              {shortlist.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center p-6 opacity-60">
                  <div className="bg-white p-3 rounded-full mb-3 shadow-sm border">
                    <Search className="w-6 h-6 text-primary/40" />
                  </div>
                  <p className="font-bold text-sm mb-1">Star some experiences!</p>
                  <p className="text-[11px]">Go to 'Discovery Library' and star activities to see them here.</p>
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

          {/* Right Column: Main Planning Area */}
          <div className="flex-1 w-full flex flex-col gap-6">
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
                  onClick={handleSuggestFood}
                  disabled={loadingFood}
                  className="border-primary/30 text-primary hover:bg-primary/5 h-8 text-xs font-bold"
                >
                  {loadingFood ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Utensils className="w-3 h-3 mr-2" />}
                  Food Nearby
                </Button>
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
                  AI Tips
                </Button>
                <Button 
                  size="sm"
                  asChild
                  className="bg-accent hover:bg-accent/90 text-white h-8 text-xs font-bold shadow-sm"
                >
                  <a href={generateGoogleMapsLink()} target="_blank" rel="noopener noreferrer">
                    <Map className="w-3.5 h-3.5 mr-1.5" />
                    Map
                  </a>
                </Button>
              </div>
            </div>

            {showAI && (
              <div className="animate-in slide-in-from-top-2 duration-300">
                <AIRecommendations />
              </div>
            )}

            {/* Itinerary Area */}
            <div className="bg-white rounded-3xl border shadow-xl p-6 md:p-8 min-h-[600px] flex flex-col relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/10" />
              
              <div className="flex items-center gap-3 mb-10 pl-4">
                <div className="bg-primary/10 p-2.5 rounded-xl">
                  <LayoutDashboard className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-foreground">{activeDay.name} Final Plan</h2>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Day Itinerary</p>
                </div>
              </div>

              {activeDay.activities.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                  <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mb-6 border border-primary/10">
                    <Navigation className="w-10 h-10 text-primary opacity-20" />
                  </div>
                  <h3 className="font-bold text-xl text-foreground mb-3">Plan is empty</h3>
                  <p className="max-w-xs text-xs text-muted-foreground leading-relaxed">
                    Add activities from your shortlisted items on the left or use the Auto-Group feature to fill your days automatically.
                  </p>
                </div>
              ) : (
                <>
                  <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-12 pb-10">
                      {activeDay.activities.map((activity, index) => (
                        <div key={activity.id} className="relative group pl-12">
                          {/* Travel Marker Above */}
                          {activity.travelTimeFromPrev && (
                             <div className="absolute -top-8 left-0 pl-14 flex items-center gap-2">
                               <div className="h-0.5 w-4 bg-accent/30" />
                               <span className="text-[9px] font-black uppercase text-accent bg-accent/5 px-2 py-0.5 rounded-full border border-accent/10 whitespace-nowrap">
                                 Travel: ~{activity.travelTimeFromPrev} min
                               </span>
                             </div>
                          )}

                          {/* Progress Line */}
                          {index < activeDay.activities.length - 1 && (
                            <div className="absolute top-10 left-[1.375rem] w-0.5 h-[calc(100%+3rem)] bg-gradient-to-b from-primary/30 to-transparent" />
                          )}
                          
                          {/* Timeline Marker */}
                          <div className="absolute left-0 top-0 flex flex-col items-center">
                            <div className={cn(
                              "w-11 h-11 rounded-full border-2 flex items-center justify-center font-black text-sm bg-white shadow-sm z-10 transition-transform group-hover:scale-110",
                              activity.isMeal ? "border-accent text-accent" : "border-primary text-primary"
                            )}>
                              {activity.scheduledTime ? <Clock className="w-5 h-5" /> : index + 1}
                            </div>
                            {activity.scheduledTime && (
                              <div className="mt-2 flex flex-col items-center gap-0.5">
                                <span className="text-[9px] font-black text-primary bg-primary/5 px-2.5 py-0.5 rounded-full border border-primary/10 whitespace-nowrap uppercase tracking-tighter">
                                  {activity.scheduledTime}
                                </span>
                                {activity.endTime && (
                                  <span className="text-[8px] font-bold text-muted-foreground">
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

                  {/* Summary Footer */}
                  <div className="mt-8 pt-8 border-t flex flex-wrap gap-10 items-center justify-between">
                    <div className="flex gap-10">
                      <div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5">Active Time</p>
                        <p className="text-3xl font-black text-primary">
                          {Math.floor(totalDuration / 60)}h <span className="text-base font-bold">{totalDuration % 60}m</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5">Travel Est.</p>
                        <p className="text-3xl font-black text-accent">
                          ~{totalTravelTime} <span className="text-base font-bold">min</span>
                        </p>
                      </div>
                    </div>
                    <div className="hidden md:flex items-center gap-3 text-[11px] text-muted-foreground bg-primary/5 px-5 py-3 rounded-2xl border border-primary/10 max-w-sm">
                      <Info className="w-4 h-4 text-primary shrink-0" />
                      <span>Use "Food Nearby" to see top-rated eats specifically along your current route between stops.</span>
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
