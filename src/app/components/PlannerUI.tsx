
"use client"

import { usePlanner, PlannedActivity, DayPlan } from "./planner-store";
import { ActivityCard } from "./ActivityCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Map, 
  Sparkles, 
  Search, 
  ListTodo, 
  Trash2, 
  Clock, 
  LayoutDashboard, 
  Settings2, 
  Utensils, 
  Loader2, 
  Wand2, 
  CalendarClock,
  Send,
  MessageSquare
} from "lucide-react";
import { DiscoveryTable } from "./DiscoveryTable";
import { AIRecommendations } from "./AIRecommendations";
import { OptimizeItinerary } from "./OptimizeItinerary";
import { CustomActivityDialog } from "./CustomActivityDialog";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { suggestNearbyFood } from "@/ai/flows/suggest-nearby-food-flow";
import { optimizeItinerary } from "@/ai/flows/optimize-itinerary-flow";
import { refineItineraryChat } from "@/ai/flows/refine-itinerary-chat-flow";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

export function PlannerUI() {
  const { 
    shortlist, 
    days, 
    activeDayId, 
    setActiveDayId, 
    addActivityToDay, 
    removeActivityFromDay, 
    toggleOptional,
    arrivalDate,
    departureDate,
    setArrivalDate,
    setDepartureDate,
    dailyActiveHours,
    setDailyActiveHours,
    defaultStartHour,
    setDays,
    setShortlist
  } = usePlanner();
  
  const [loadingFood, setLoadingFood] = useState(false);
  const [isGrouping, setIsGrouping] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isChatting, setIsChatting] = useState(false);

  const activeDay = days.find(d => d.id === activeDayId) || days[0];

  // Guard for initial hydration or empty days
  if (!activeDay) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest">Initialising Planner...</p>
      </div>
    );
  }

  const handleAutoGroupAndOptimize = async () => {
    if (shortlist.length === 0) {
      toast({ title: "Wishlist is empty", description: "Star some activities first!", variant: "destructive" });
      return;
    }
    setIsGrouping(true);
    toast({ title: "Generating Trip Plan", description: "Organizing and optimizing routes..." });

    try {
      const maxMinutesPerDay = dailyActiveHours * 60;
      const initialDays = days.map(d => ({ ...d, activities: d.activities.filter(a => !!a.fixedStartTime) }));
      const items = [...shortlist];
      
      let currentDayIdx = 0;
      while (items.length > 0 && currentDayIdx < initialDays.length) {
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

        const result = await optimizeItinerary({
          activities: day.activities.map(a => ({
            id: a.id,
            name: a.name,
            durationMinutes: a.durationMinutes,
            type: a.type,
            address: a.address,
            fixedStartTime: a.fixedStartTime
          })),
          startHour: day.startHourOverride || defaultStartHour,
          endHour: day.endHourOverride
        });

        if (result?.itinerary) {
          const planned: PlannedActivity[] = result.itinerary.map(item => {
            const existing = day.activities.find(a => a.id === item.id);
            return {
              id: item.id || `opt-${Date.now()}-${Math.random()}`,
              name: item.name,
              description: item.reason || existing?.description || "Recommended stop.",
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
      }

      setDays(optimizedDays);
      setShortlist(items);
      toast({ title: "Trip Ready!", description: "Itinerary created with travel and optimized order." });
    } catch (err) {
      console.error(err);
      toast({ title: "Failed", description: "Could not generate plan.", variant: "destructive" });
    } finally {
      setIsGrouping(false);
    }
  };

  const handleChatRefinement = async () => {
    if (!chatInput.trim()) return;
    setIsChatting(true);
    try {
      const result = await refineItineraryChat({
        currentItinerary: days.map(d => ({
          name: d.name,
          activities: d.activities.map(a => ({
            id: a.id,
            name: a.name,
            type: a.type,
            startTime: a.scheduledTime,
            endTime: a.endTime,
            durationMinutes: a.durationMinutes
          }))
        })),
        userPrompt: chatInput
      });

      const updatedDays = days.map((d, i) => {
        const aiDay = result.updatedItinerary.find(rd => rd.name === d.name);
        if (!aiDay) return d;
        
        return {
          ...d,
          activities: aiDay.activities.map(a => {
            const existing = d.activities.find(ex => ex.id === a.id);
            return {
              ...a,
              id: a.id || `ai-${Date.now()}-${Math.random()}`,
              isOptional: existing?.isOptional || false,
              address: existing?.address || a.name,
              description: existing?.description || "Updated by AI assistant."
            } as PlannedActivity;
          })
        };
      });

      setDays(updatedDays);
      setChatInput("");
      toast({ title: "Plan Updated", description: result.explanation });
    } catch (err) {
      console.error(err);
      toast({ title: "Chat Error", description: "Could not update itinerary.", variant: "destructive" });
    } finally {
      setIsChatting(false);
    }
  };

  const handleSuggestFood = async () => {
    if (activeDay.activities.length < 1) return;
    setLoadingFood(true);
    try {
      const result = await suggestNearbyFood({
        activities: activeDay.activities.map(a => ({ name: a.name, address: a.address }))
      });
      toast({ title: "Food Suggestions!", description: `Try ${result.suggestions[0].name}. ${result.suggestions[0].reason}` });
    } catch (err) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setLoadingFood(false);
    }
  };

  const generateGoogleMapsLink = () => {
    if (!activeDay || !activeDay.activities) return "https://www.google.com/maps";
    const origin = "Tewksbury,MA";
    const destinations = activeDay.activities
      .filter(a => !a.isOptional)
      .map(a => encodeURIComponent(a.address))
      .join('/');
    return destinations ? `https://www.google.com/maps/dir/${origin}/${destinations}/${origin}` : `https://www.google.com/maps/dir/${origin}`;
  };

  return (
    <Tabs defaultValue="discover" className="w-full">
      <div className="flex items-center justify-center mb-10">
        <TabsList className="grid w-full max-w-lg grid-cols-2 bg-muted h-12 rounded-2xl p-1 shadow-sm border">
          <TabsTrigger value="discover" className="rounded-xl font-black text-sm uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-primary">
            <Search className="h-4 w-4 mr-2" /> 1. Discover
          </TabsTrigger>
          <TabsTrigger value="plan" className="rounded-xl font-black text-sm uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-primary">
            <ListTodo className="h-4 w-4 mr-2" /> 2. Plan My Day
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="discover">
        <div className="bg-white rounded-3xl p-8 border shadow-xl border-primary/5">
          <div className="mb-8">
            <h2 className="text-3xl font-black text-foreground mb-2">Experience Library</h2>
            <p className="text-muted-foreground">Star items to build your wishlist for the itinerary. We'll group them for you later.</p>
          </div>
          <DiscoveryTable />
        </div>
      </TabsContent>

      <TabsContent value="plan">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* LEFT COLUMN: Settings & Shortlist */}
          <div className="w-full lg:w-[380px] flex flex-col gap-6 lg:sticky lg:top-8">
            <div className="bg-white p-6 rounded-3xl border border-primary/10 shadow-lg space-y-6">
              <div className="flex items-center gap-3 text-primary">
                <Settings2 className="w-5 h-5" />
                <h3 className="text-xs font-black uppercase tracking-widest">Trip Configuration</h3>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] uppercase font-black text-muted-foreground">Arrival</Label>
                    <Input 
                      type="datetime-local" 
                      value={format(arrivalDate, "yyyy-MM-dd'T'HH:mm")}
                      onChange={(e) => setArrivalDate(new Date(e.target.value))}
                      className="h-10 text-xs font-bold rounded-xl border-primary/10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] uppercase font-black text-muted-foreground">Departure</Label>
                    <Input 
                      type="datetime-local" 
                      value={format(departureDate, "yyyy-MM-dd'T'HH:mm")}
                      onChange={(e) => setDepartureDate(new Date(e.target.value))}
                      className="h-10 text-xs font-bold rounded-xl border-primary/10"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] uppercase font-black text-muted-foreground">Daily Activity Limit (Hours)</Label>
                  <Input 
                    type="number" 
                    value={dailyActiveHours} 
                    onChange={(e) => setDailyActiveHours(parseInt(e.target.value) || 8)}
                    className="h-10 text-sm font-bold rounded-xl border-primary/10"
                  />
                  <p className="text-[9px] text-muted-foreground italic">Excludes travel time back to Tewksbury.</p>
                </div>
              </div>

              <div className="pt-2 space-y-3">
                <Button 
                  onClick={handleAutoGroupAndOptimize}
                  disabled={shortlist.length === 0 || isGrouping}
                  className="w-full bg-primary hover:bg-primary/90 font-black text-xs h-12 rounded-xl shadow-lg transition-all active:scale-[0.98]"
                >
                  {isGrouping ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  Auto-Group & Optimize
                </Button>
                <CustomActivityDialog />
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[11px] font-black text-foreground uppercase tracking-widest">Wishlist ({shortlist.length})</h3>
                {shortlist.length > 0 && <Badge variant="secondary" className="text-[9px] font-bold">Unplanned</Badge>}
              </div>
              <ScrollArea className="h-[400px] pr-4 -mr-4">
                <div className="space-y-3">
                  {shortlist.length === 0 ? (
                    <div className="text-center py-10 opacity-30">
                      <Search className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-[10px]">Add items from Discover</p>
                    </div>
                  ) : (
                    shortlist.map(activity => (
                      <ActivityCard 
                        key={activity.id} 
                        activity={activity} 
                        actionType="add" 
                        onAction={() => addActivityToDay(activity, activeDayId)} 
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* RIGHT COLUMN: Active Day Itinerary */}
          <div className="flex-1 w-full space-y-6">
            <AIRecommendations />
            
            <div className="bg-white p-4 rounded-3xl border shadow-md flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                {days.map((day) => (
                  <Button
                    key={day.id}
                    variant={activeDayId === day.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveDayId(day.id)}
                    className={cn(
                      "rounded-xl px-5 h-10 text-[11px] font-black uppercase tracking-tighter transition-all",
                      activeDayId === day.id ? "bg-primary text-white shadow-md" : "text-muted-foreground border-primary/10 hover:border-primary/30"
                    )}
                  >
                    {day.name}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <OptimizeItinerary />
                <Button variant="outline" size="sm" onClick={handleSuggestFood} disabled={loadingFood} className="h-8 text-[10px] font-black uppercase text-primary border-primary/20 hover:bg-primary/5">
                  <Utensils className="w-3 h-3 mr-1" /> Food Nearby
                </Button>
                <Button size="sm" asChild className="bg-accent text-white h-8 text-[10px] font-black uppercase hover:bg-accent/90">
                  <a href={generateGoogleMapsLink()} target="_blank" rel="noopener noreferrer"><Map className="w-3 h-3 mr-1" /> Route</a>
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-[40px] border shadow-xl p-8 min-h-[600px] relative">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-2xl font-black text-foreground tracking-tight">{activeDay.name} Timeline</h2>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black flex items-center gap-2 mt-1">
                    <Clock className="w-3 h-3" />
                    {activeDay.startHourOverride !== undefined ? `Starts at ${activeDay.startHourOverride}:00` : "Full Day"}
                    {activeDay.endHourOverride !== undefined ? ` • Ends by ${activeDay.endHourOverride}:00` : ""}
                  </p>
                </div>
              </div>

              {activeDay.activities.length === 0 ? (
                <div className="py-24 text-center">
                  <div className="bg-muted/30 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <LayoutDashboard className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">This day is currently empty.</p>
                  <p className="text-[10px] text-muted-foreground uppercase mt-1">Drag items from your wishlist or use Auto-Group.</p>
                </div>
              ) : (
                <div className="space-y-12 pl-6 border-l-2 border-primary/10 relative">
                  {activeDay.activities.map((activity, idx) => (
                    <div key={activity.id} className="relative">
                      {/* Timeline Dot */}
                      <div className={cn(
                        "absolute -left-[2.15rem] top-0 w-8 h-8 rounded-2xl border-2 bg-white flex items-center justify-center font-black text-[11px] shadow-sm",
                        activity.fixedStartTime ? "border-accent text-accent animate-pulse" : "border-primary text-primary"
                      )}>
                        {activity.fixedStartTime ? "!" : idx + 1}
                      </div>

                      {/* Travel Marker (except first item) */}
                      {idx > 0 && (
                        <div className="absolute -left-[1.6rem] -top-8 text-[9px] font-black text-muted-foreground/40 uppercase bg-white px-2 py-0.5 rounded-full border border-primary/5">
                          {activity.travelTimeFromPrev ? `~${activity.travelTimeFromPrev}m Travel` : "Travel"}
                        </div>
                      )}

                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-[11px] font-black text-primary/80 uppercase tracking-widest bg-primary/5 px-3 py-1 rounded-full">
                          {activity.scheduledTime} — {activity.endTime}
                        </span>
                        {activity.fixedStartTime && (
                          <Badge variant="default" className="bg-accent text-[8px] py-0 h-5 font-black uppercase">
                            <CalendarClock className="w-3 h-3 mr-1" /> Locked Event
                          </Badge>
                        )}
                      </div>
                      <ActivityCard 
                        activity={activity} 
                        actionType="remove" 
                        onAction={() => removeActivityFromDay(activity.id, activeDayId)} 
                        onToggleOptional={() => toggleOptional(activity.id, activeDayId)} 
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Chat Interface */}
              <div className="mt-16 pt-10 border-t border-primary/5">
                <div className="bg-primary/5 rounded-[32px] p-8 border border-primary/10">
                  <div className="flex items-center gap-3 mb-6 text-primary">
                    <div className="bg-primary/10 p-2 rounded-xl">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest">Itinerary Assistant</h4>
                      <p className="text-[10px] text-muted-foreground">Ask for swaps, specific days, or thematic changes.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Input 
                      placeholder="e.g. 'I don't want two boat tours on Day 1' or 'Move the museum to Day 2'" 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="rounded-2xl bg-white border-primary/10 h-14 text-sm px-6 focus-visible:ring-primary/20"
                      onKeyDown={(e) => e.key === 'Enter' && handleChatRefinement()}
                    />
                    <Button 
                      onClick={handleChatRefinement} 
                      disabled={isChatting} 
                      className="bg-primary hover:bg-primary/90 h-14 w-14 rounded-2xl shrink-0 shadow-lg shadow-primary/20"
                    >
                      {isChatting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </Button>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 px-1">
                    <button 
                      onClick={() => setChatInput("Spread the boat activities across different days")}
                      className="text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors bg-white/50 px-3 py-1 rounded-full border border-primary/5"
                    >
                      "Avoid same-day duplicates"
                    </button>
                    <button 
                      onClick={() => setChatInput("Make the first day focused on history")}
                      className="text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors bg-white/50 px-3 py-1 rounded-full border border-primary/5"
                    >
                      "Theme: History Day"
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
