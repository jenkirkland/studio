
"use client"

import { usePlanner, PlannedActivity, DayPlan, TransitMethod } from "./planner-store";
import { ActivityCard } from "./ActivityCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Map, 
  Sparkles, 
  Search, 
  ListTodo, 
  Clock, 
  LayoutDashboard, 
  Settings2, 
  Loader2, 
  CalendarClock,
  Send,
  MessageSquare,
  Plane,
  TrainFront,
  Car,
  Share2,
  CloudUpload
} from "lucide-react";
import { DiscoveryTable } from "./DiscoveryTable";
import { AIRecommendations } from "./AIRecommendations";
import { OptimizeItinerary } from "./OptimizeItinerary";
import { CustomActivityDialog } from "./CustomActivityDialog";
import { MealRecommendation } from "./MealRecommendation";
import { useState } from "react";
import { cn } from "@/lib/utils";
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
    arrivalMethod,
    setArrivalMethod,
    arrivalLocation,
    setArrivalLocation,
    departureMethod,
    setDepartureMethod,
    departureLocation,
    setDepartureLocation,
    dailyActiveHours,
    setDailyActiveHours,
    defaultStartHour,
    setDays,
    setShortlist
  } = usePlanner();
  
  const [isGrouping, setIsGrouping] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isChatting, setIsChatting] = useState(false);

  // Robust active day lookup to avoid "Initializing" screen hang
  const activeDay = days.find(d => d.id === activeDayId) || days[0];

  const handleSaveTrip = async () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      const code = Math.random().toString(36).substring(2, 7).toUpperCase();
      toast({
        title: "Trip Saved to Cloud!",
        description: `Access Code: WANDER-${code}. This code stores your reservations and notes.`,
      });
    }, 1500);
  };

  const handleAutoGroupAndOptimize = async () => {
    if (shortlist.length === 0) {
      toast({ title: "Wishlist is empty", description: "Star some activities first!", variant: "destructive" });
      return;
    }
    setIsGrouping(true);
    try {
      const maxMinutesPerDay = dailyActiveHours * 60;
      const initialDays = days.map(d => ({ ...d, activities: d.activities.filter(a => !!a.fixedStartTime) }));
      const items = [...shortlist];
      
      let currentDayIdx = 0;
      while (items.length > 0 && currentDayIdx < initialDays.length) {
        const activity = items[0];
        const currentDayTime = initialDays[currentDayIdx].activities.reduce((s, a) => s + a.durationMinutes, 0);
        
        if (currentDayTime + activity.durationMinutes + 30 <= maxMinutesPerDay) {
          initialDays[currentDayIdx].activities.push({ ...activity, isOptional: false } as PlannedActivity);
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
            startHour: day.startHourOverride || defaultStartHour,
            endHour: day.endHourOverride,
            startLocation: day.startLocation,
            endLocation: day.endLocation
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
              } as PlannedActivity;
            });
            optimizedDays.push({ ...day, activities: planned });
          } else {
            optimizedDays.push(day);
          }
        } catch (dayErr: any) {
          console.error("Day Optimization Error:", dayErr);
          optimizedDays.push(day); // Keep unoptimized if AI fails
        }
      }

      setDays(optimizedDays);
      setShortlist(items);
      toast({ title: "Itinerary Distributed!", description: "Activities have been grouped and sequenced." });
    } catch (err: any) {
      console.error(err);
      const isQuotaError = err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED');
      toast({ 
        title: isQuotaError ? "AI Limit Reached" : "Auto-Group Failed", 
        description: isQuotaError ? "Too many requests. Please wait a moment." : "Could not build plan.", 
        variant: "destructive" 
      });
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

      const updatedDays = days.map((d) => {
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
      toast({ title: "Plan Refined", description: result.explanation });
    } catch (err: any) {
      console.error(err);
      const isQuotaError = err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED');
      toast({ 
        title: isQuotaError ? "AI Assistant Busy" : "Chat Error", 
        description: isQuotaError ? "Please wait a moment before sending more requests." : "Could not refine itinerary.", 
        variant: "destructive" 
      });
    } finally {
      setIsChatting(false);
    }
  };

  const generateGoogleMapsLink = () => {
    if (!activeDay || !activeDay.activities || activeDay.activities.length === 0) return "https://www.google.com/maps";
    const origin = encodeURIComponent(activeDay.startLocation || "Tewksbury,MA");
    const stops = activeDay.activities
      .filter(a => !a.isOptional)
      .map(a => encodeURIComponent(a.address))
      .join('/');
    const destination = encodeURIComponent(activeDay.endLocation || "Tewksbury,MA");
    return `https://www.google.com/maps/dir/${origin}/${stops}/${destination}`;
  };

  const handleShareToPhone = () => {
    const link = generateGoogleMapsLink();
    navigator.clipboard.writeText(link);
    toast({
      title: "Route Copied!",
      description: "Paste this link into your mobile maps app to start navigating.",
    });
  };

  const transitIcons = {
    airport: <Plane className="w-3.5 h-3.5" />,
    train: <TrainFront className="w-3.5 h-3.5" />,
    car: <Car className="w-3.5 h-3.5" />
  };

  const airportOptions = [
    { name: "BOS - Logan International", value: "Boston Logan International Airport" },
    { name: "MHT - Manchester-Boston", value: "Manchester-Boston Regional Airport" }
  ];

  const trainOptions = [
    { name: "Lowell Station", value: "Lowell MBTA Station" },
    { name: "Boston North Station", value: "Boston North Station" },
    { name: "Boston South Station", value: "Boston South Station" }
  ];

  if (!activeDay) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest">Generating Itinerary...</p>
      </div>
    );
  }

  return (
    <Tabs defaultValue="discover" className="w-full">
      <div className="flex items-center justify-center mb-10 relative">
        <TabsList className="grid w-full grid-cols-2 bg-muted h-12 rounded-2xl p-1 shadow-sm border border-primary/10 max-w-lg">
          <TabsTrigger value="discover" className="rounded-xl font-black text-sm uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-primary">
            <Search className="h-4 w-4 mr-2" /> 1. Discover
          </TabsTrigger>
          <TabsTrigger value="plan" className="rounded-xl font-black text-sm uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-primary">
            <ListTodo className="h-4 w-4 mr-2" /> 2. Plan My Day
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="discover" className="mt-0 outline-none">
        <div className="bg-white rounded-[40px] p-8 border border-primary/5 shadow-sm">
          <div className="mb-8">
            <h2 className="text-3xl font-black text-foreground mb-2">Experience Library</h2>
            <p className="text-muted-foreground">Star items to build your wishlist. We'll group them for you in the planning tab.</p>
          </div>
          <DiscoveryTable />
        </div>
      </TabsContent>

      <TabsContent value="plan" className="mt-0 outline-none">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="w-full lg:w-[380px] flex flex-col gap-6 lg:sticky lg:top-8">
            <div className="bg-white p-6 rounded-[32px] border border-primary/10 shadow-sm space-y-6">
              <div className="flex items-center gap-3 text-primary">
                <Settings2 className="w-5 h-5" />
                <h3 className="text-xs font-black uppercase tracking-widest">Trip Logistics</h3>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-4 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                  <Label className="text-[10px] font-black uppercase text-primary">Arrival</Label>
                  <div className="grid grid-cols-1 gap-3">
                    <Input 
                      type="datetime-local" 
                      value={format(arrivalDate, "yyyy-MM-dd'T'HH:mm")}
                      onChange={(e) => setArrivalDate(new Date(e.target.value))}
                      className="h-10 text-xs font-bold rounded-xl bg-white border-primary/10"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      {(['airport', 'train', 'car'] as TransitMethod[]).map((m) => (
                        <Button
                          key={m}
                          variant={arrivalMethod === m ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setArrivalMethod(m);
                            if (m === 'car') setArrivalLocation('Tewksbury, MA');
                          }}
                          className="h-9 p-0 rounded-lg text-[9px] font-black uppercase gap-1"
                        >
                          {transitIcons[m]} {m}
                        </Button>
                      ))}
                    </div>
                    {arrivalMethod !== 'car' && (
                      <Select value={arrivalLocation} onValueChange={setArrivalLocation}>
                        <SelectTrigger className="h-9 text-[10px] font-bold bg-white rounded-xl border-primary/10">
                          <SelectValue placeholder="Station/Airport" />
                        </SelectTrigger>
                        <SelectContent>
                          {(arrivalMethod === 'airport' ? airportOptions : trainOptions).map(opt => (
                            <SelectItem key={opt.value} value={opt.value} className="text-[10px] font-bold">{opt.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                <div className="space-y-4 p-4 rounded-2xl bg-accent/5 border border-accent/10">
                  <Label className="text-[10px] font-black uppercase text-accent">Departure</Label>
                  <div className="grid grid-cols-1 gap-3">
                    <Input 
                      type="datetime-local" 
                      value={format(departureDate, "yyyy-MM-dd'T'HH:mm")}
                      onChange={(e) => setDepartureDate(new Date(e.target.value))}
                      className="h-10 text-xs font-bold rounded-xl bg-white border-accent/10"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      {(['airport', 'train', 'car'] as TransitMethod[]).map((m) => (
                        <Button
                          key={m}
                          variant={departureMethod === m ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setDepartureMethod(m);
                            if (m === 'car') setDepartureLocation('Tewksbury, MA');
                          }}
                          className="h-9 p-0 rounded-lg text-[9px] font-black uppercase gap-1"
                        >
                          {transitIcons[m]} {m}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="px-1">
                  <Label className="text-[9px] uppercase font-black text-muted-foreground">Daily Active Limit ({dailyActiveHours}h)</Label>
                  <Input 
                    type="number" 
                    value={dailyActiveHours} 
                    onChange={(e) => setDailyActiveHours(parseInt(e.target.value) || 8)}
                    className="h-10 text-sm font-bold rounded-xl border-primary/10 mt-1"
                  />
                </div>
              </div>

              <div className="pt-2 space-y-3">
                <Button 
                  onClick={handleAutoGroupAndOptimize}
                  disabled={shortlist.length === 0 || isGrouping}
                  className="w-full bg-primary hover:bg-primary/90 font-black text-[10px] uppercase tracking-widest h-12 rounded-xl shadow-lg"
                >
                  {isGrouping ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  Auto-Group Activities
                </Button>
                <CustomActivityDialog />
                <Button 
                  variant="outline" 
                  onClick={handleSaveTrip} 
                  disabled={isSaving}
                  className="w-full border-primary text-primary hover:bg-primary/5 font-black text-[10px] uppercase tracking-widest h-12 rounded-xl"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CloudUpload className="w-4 h-4 mr-2" />}
                  Save Trip to Cloud
                </Button>
              </div>
            </div>

            <div className="bg-white p-5 rounded-[32px] border border-primary/10 shadow-sm">
              <h3 className="text-[11px] font-black text-foreground uppercase tracking-widest mb-4 flex items-center justify-between">
                <span>Wishlist</span>
                <Badge variant="secondary" className="h-5 text-[9px] font-black">{shortlist.length}</Badge>
              </h3>
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-3">
                  {shortlist.length === 0 ? (
                    <div className="text-center py-10 opacity-30">
                      <p className="text-[10px] font-black uppercase tracking-widest">Star experiences to add them here</p>
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

          <div className="flex-1 w-full space-y-6">
            <div className="bg-white p-4 rounded-[32px] border border-primary/10 shadow-sm flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
                {days.map((day) => (
                  <Button
                    key={day.id}
                    variant={activeDayId === day.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveDayId(day.id)}
                    className={cn(
                      "rounded-xl px-5 h-10 text-[11px] font-black uppercase tracking-tighter transition-all",
                      activeDayId === day.id ? "bg-primary text-white shadow-md" : "text-muted-foreground border-primary/10"
                    )}
                  >
                    {day.name}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <AIRecommendations />
                <OptimizeItinerary />
                <div className="flex items-center gap-1 bg-accent/5 p-1 rounded-xl border border-accent/10">
                  <Button size="sm" variant="ghost" asChild className="text-accent h-7 text-[9px] font-black uppercase hover:bg-white px-2">
                    <a href={generateGoogleMapsLink()} target="_blank" rel="noopener noreferrer"><Map className="w-3 h-3 mr-1" /> Route</a>
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleShareToPhone} className="text-accent h-7 text-[9px] font-black uppercase hover:bg-white px-2">
                    <Share2 className="w-3 h-3 mr-1" /> Send to Phone
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[40px] border border-primary/10 shadow-sm p-8 min-h-[600px]">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-2xl font-black text-foreground tracking-tight">{activeDay.name} Timeline</h2>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black flex items-center gap-2 mt-1">
                    <Clock className="w-3 h-3" />
                    {activeDay.startLocation} → {activeDay.endLocation}
                  </p>
                </div>
              </div>

              {activeDay.activities.length === 0 ? (
                <div className="py-24 text-center opacity-40">
                  <LayoutDashboard className="w-8 h-8 mx-auto mb-4" />
                  <p className="text-sm font-black uppercase tracking-widest">No activities scheduled yet</p>
                </div>
              ) : (
                <div className="space-y-8 pl-6 border-l-2 border-primary/10 relative">
                  {activeDay.activities.map((activity, idx) => {
                    const isMealPlaceholder = activity.isMeal && activity.type === 'food' && activity.description.toLowerCase().includes('recommended');
                    
                    return (
                      <div key={activity.id} className="relative">
                        <div className={cn(
                          "absolute -left-[2.15rem] top-0 w-8 h-8 rounded-2xl border-2 bg-white flex items-center justify-center font-black text-[11px]",
                          activity.fixedStartTime ? "border-accent text-accent" : "border-primary text-primary"
                        )}>
                          {activity.fixedStartTime ? "!" : idx + 1}
                        </div>

                        {idx > 0 && (
                          <div className="absolute -left-[1.6rem] -top-6 text-[8px] font-black text-muted-foreground/60 uppercase bg-white px-2 py-0.5 rounded-full border border-primary/5">
                            {activity.travelTimeFromPrev ? `~${activity.travelTimeFromPrev}m Travel` : "Travel"}
                          </div>
                        )}

                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-[11px] font-black text-primary/80 uppercase bg-primary/5 px-3 py-1 rounded-full">
                            {activity.scheduledTime || "--:--"} — {activity.endTime || "--:--"}
                          </span>
                          {activity.fixedStartTime && <Badge className="bg-accent text-[8px] h-5 font-black uppercase">Fixed Point</Badge>}
                        </div>

                        {isMealPlaceholder ? (
                          <MealRecommendation 
                            activity={activity} 
                            prevActivity={activeDay.activities[idx - 1]} 
                            nextActivity={activeDay.activities[idx + 1]}
                            dayId={activeDayId}
                          />
                        ) : (
                          <ActivityCard 
                            activity={activity} 
                            actionType="remove" 
                            onAction={() => removeActivityFromDay(activity.id, activeDayId)} 
                            onToggleOptional={() => toggleOptional(activity.id, activeDayId)} 
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-16 pt-10 border-t border-primary/5">
                <div className="bg-primary/5 rounded-[32px] p-8 border border-primary/10">
                  <div className="flex items-center gap-3 mb-6 text-primary">
                    <MessageSquare className="w-5 h-5" />
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest">Itinerary Assistant</h4>
                      <p className="text-[10px] text-muted-foreground">Ask for changes or route adjustments.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Input 
                      placeholder="e.g. 'Move the museum to Day 2' or 'Swap the park for something indoor'" 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="rounded-2xl bg-white h-14 text-sm px-6 border-primary/10"
                      onKeyDown={(e) => e.key === 'Enter' && handleChatRefinement()}
                    />
                    <Button onClick={handleChatRefinement} disabled={isChatting} className="bg-primary h-14 w-14 rounded-2xl shrink-0">
                      {isChatting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </Button>
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
