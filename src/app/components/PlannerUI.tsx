"use client"

import { usePlanner, PlannedActivity, TransitMethod, ActivityPace, PACE_MULTIPLIERS } from "./planner-store";
import { ActivityCard } from "./ActivityCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import {
  Map,
  Search,
  ListTodo,
  Clock,
  Settings2,
  Loader2,
  Share2,
  Wand2,
  Plane,
  TrainFront,
  Car,
  Copy
} from "lucide-react";
import { DiscoveryTable } from "./DiscoveryTable";
import { AIRecommendations } from "./AIRecommendations";
import { CustomActivityDialog } from "./CustomActivityDialog";
import { MealRecommendation } from "./MealRecommendation";
import { OptimizeItinerary } from "./OptimizeItinerary";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { optimizeFullTrip } from "@/ai/flows/optimize-itinerary-flow";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ACTIVITIES } from "../lib/activities";
import { recalculateTimelineWithTraffic } from "@/lib/calculate-routes";
import { QRCodeSVG } from "qrcode.react";

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
    setArrivalDate,
    departureDate,
    setDepartureDate,
    arrivalMethod,
    setArrivalMethod,
    setArrivalLocation,
    dailyActiveHours,
    setDays,
    setShortlist,
    activityPace,
    setActivityPace
  } = usePlanner();

  const [isOptimizing, setIsOptimizing] = useState(false);

  const activeDay = useMemo(() => {
    return days.find(d => d.id === activeDayId) || days[0];
  }, [days, activeDayId]);

  const handleGlobalOptimization = async () => {
    if (days.length === 0) return;
    setIsOptimizing(true);
    try {
      const response = await optimizeFullTrip({
        days: days.map(d => ({
          id: d.id,
          name: d.name,
          date: d.date,
          activities: (d.activities || []).map(a => ({
            id: a.id,
            name: a.name,
            durationMinutes: Math.round((a.durationMinutes || 60) * PACE_MULTIPLIERS[activityPace]),
            type: a.type,
            address: a.address,
            fixedStartTime: a.fixedStartTime
          })),
          startLocation: d.startLocation || "Tewksbury, MA",
          endLocation: d.endLocation || "Tewksbury, MA",
          startHour: d.startHourOverride,
          endHour: d.endHourOverride,
        })),
        wishlist: shortlist.map(a => ({
          id: a.id,
          name: a.name,
          durationMinutes: Math.round((a.durationMinutes || 60) * PACE_MULTIPLIERS[activityPace]),
          type: a.type,
          address: a.address
        })),
        dailyActiveHours: dailyActiveHours
      });

      if (!response.success) {
        throw new Error(response.error);
      }

      const result = response.data;

      if (!result || !result.optimizedDays || result.optimizedDays.length === 0) {
        throw new Error("AI service did not return an updated plan.");
      }

      const updatedDays = days.map(d => {
        const optimizedDay = result.optimizedDays.find(od => od.id === d.id);
        if (!optimizedDay) return d;

        const activities: PlannedActivity[] = (optimizedDay.activities || []).map(item => {
          // Look for matching activity in existing day, wishlist, or global list
          const existing = [...d.activities, ...shortlist, ...ACTIVITIES].find(a =>
            a.id === item.id ||
            a.name.toLowerCase() === item.name.toLowerCase()
          );

          return {
            id: item.id || existing?.id || `ai-${Date.now()}-${Math.random()}`,
            name: item.name,
            description: item.reason || existing?.description || "Recommended stop.",
            type: item.type === 'meal' ? 'food' : (existing?.type || 'sightseeing'),
            durationMinutes: item.durationMinutes ? Math.round(item.durationMinutes / PACE_MULTIPLIERS[activityPace]) : (existing?.durationMinutes || 60),
            address: existing?.address || item.name,
            scheduledTime: item.startTime,
            endTime: item.endTime,
            isOptional: false,
            isMeal: item.type === 'meal',
            travelTimeFromPrev: item.travelTimeMinutes,
            travelModeFromPrev: 'car', // Temporary fallback, will be overwritten by route processor
            fixedStartTime: existing?.fixedStartTime || (item.isFixed ? item.startTime : undefined)
          } as PlannedActivity;
        });

        return { ...d, activities };
      });

      // Pass 2: Post-process every day through the Google Maps routing engine
      // First, temporarily simulate the scaled timeline locally because the Google Routes interceptor
      // needs the actual physical time windows
      const fullyRoutedDays = await Promise.all(updatedDays.map(async (d) => {
        const startLoc = d.startLocation || "Tewksbury, MA";
        const startH = d.startHourOverride || 9;

        // Temporarily scale before routing
        const scaledActivities = d.activities.map(a => ({
          ...a,
          durationMinutes: Math.round((a.durationMinutes || 60) * PACE_MULTIPLIERS[activityPace])
        }));

        try {
          const routedActivities = await recalculateTimelineWithTraffic(scaledActivities, startLoc, d.date, startH);
          // Restore unscaled duration for the store
          const unscaledRouted = routedActivities.map(a => ({
            ...a,
            durationMinutes: Math.round((a.durationMinutes || 60) / PACE_MULTIPLIERS[activityPace])
          }));
          return { ...d, activities: unscaledRouted };
        } catch (e) {
          console.error(`Routing failed for day ${d.id}, falling back to AI times:`, e);
          return d;
        }
      }));

      setDays(fullyRoutedDays);

      // Only filter the shortlist if we have a valid list of remaining IDs
      if (Array.isArray(result.remainingWishlistIds)) {
        setShortlist(shortlist.filter(a => result.remainingWishlistIds.includes(a.id)));
      }

      toast({
        title: "Itinerary Optimized",
        description: result.explanation || "Your entire trip has been organized.",
      });
    } catch (err: any) {
      console.error("Global Optimization Error:", err);
      const isQuotaError = err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED');
      toast({
        title: isQuotaError ? "AI is Busy" : "Optimization Failed",
        description: isQuotaError ? "Please wait 30 seconds and try again." : "Could not reach the planning service.",
        variant: "destructive"
      });
    } finally {
      setIsOptimizing(false);
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
    const link = generateSharedLink();
    navigator.clipboard.writeText(link);
    toast({ title: "Link Copied!", description: "Paste into your messages or notes app." });
  };

  const generateSharedLink = () => {
    if (typeof window === 'undefined' || !activeDay) return "http://localhost:9002";
    const origin = window.location.origin;
    // Compress the timeline payload for the URL using native base64
    const compressedPayload = btoa(unescape(encodeURIComponent(JSON.stringify(activeDay))));
    return `${origin}/shared?plan=${compressedPayload}`;
  };

  const transitIcons = {
    airport: <Plane className="w-3.5 h-3.5" />,
    train: <TrainFront className="w-3.5 h-3.5" />,
    car: <Car className="w-3.5 h-3.5" />
  };

  if (!activeDay) return null;

  return (
    <Tabs defaultValue="discover" className="w-full">
      <div className="flex items-center justify-center mb-10 relative">
        <TabsList className="grid w-full grid-cols-2 bg-muted h-12 rounded-2xl p-1 shadow-sm border border-primary/10 max-w-lg">
          <TabsTrigger value="discover" className="rounded-xl font-black text-sm uppercase tracking-wider">
            <Search className="h-4 w-4 mr-2" /> 1. Discover
          </TabsTrigger>
          <TabsTrigger value="plan" className="rounded-xl font-black text-sm uppercase tracking-wider">
            <ListTodo className="h-4 w-4 mr-2" /> 2. Plan My Day
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="discover">
        <div className="bg-white rounded-[40px] p-8 border border-primary/5 shadow-sm">
          <DiscoveryTable />
        </div>
      </TabsContent>

      <TabsContent value="plan">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <aside className="w-full lg:w-[380px] flex flex-col gap-6 lg:sticky lg:top-8">
            <div className="bg-white p-6 rounded-[32px] border border-primary/10 shadow-sm space-y-6">
              <div className="flex items-center gap-3 text-primary">
                <Settings2 className="w-5 h-5" />
                <h3 className="text-xs font-black uppercase tracking-widest">Trip Logistics</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-4 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                  <Label className="text-[10px] font-black uppercase text-primary">Arrival</Label>
                  <Input
                    type="datetime-local"
                    value={format(arrivalDate, "yyyy-MM-dd'T'HH:mm")}
                    onChange={(e) => setArrivalDate(new Date(e.target.value))}
                    className="h-10 text-xs font-bold rounded-xl"
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
                </div>

                <div className="space-y-4 p-4 rounded-2xl bg-accent/5 border border-accent/10">
                  <Label className="text-[10px] font-black uppercase text-accent">Departure</Label>
                  <Input
                    type="datetime-local"
                    value={format(departureDate, "yyyy-MM-dd'T'HH:mm")}
                    onChange={(e) => setDepartureDate(new Date(e.target.value))}
                    className="h-10 text-xs font-bold rounded-xl"
                  />
                </div>

                <div className="space-y-4 p-4 rounded-2xl bg-muted/20 border border-muted-foreground/10">
                  <Label className="text-[10px] font-black uppercase text-foreground">Activity Pace</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['breeze', 'normal', 'linger'] as ActivityPace[]).map((p) => (
                      <Button
                        key={p}
                        variant={activityPace === p ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActivityPace(p)}
                        className="h-9 p-0 rounded-lg text-[9px] font-black uppercase"
                      >
                        {p}
                      </Button>
                    ))}
                  </div>
                  <p className="text-[9px] text-muted-foreground leading-tight px-1">
                    {activityPace === 'breeze' && "Visits are 25% shorter. Fit in more stops."}
                    {activityPace === 'normal' && "Standard recommended activity durations."}
                    {activityPace === 'linger' && "Visits are 50% longer. Take it slow."}
                  </p>
                </div>
              </div>

              <div className="pt-2 space-y-3">
                <Button
                  onClick={handleGlobalOptimization}
                  disabled={isOptimizing}
                  type="button"
                  className="w-full bg-primary font-black text-[10px] uppercase h-12 rounded-xl"
                >
                  {isOptimizing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wand2 className="w-4 h-4 mr-2" />}
                  Auto-Plan Entire Trip
                </Button>
                <CustomActivityDialog />
              </div>
            </div>

            <div className="bg-white p-5 rounded-[32px] border border-primary/10 shadow-sm">
              <h3 className="text-[11px] font-black text-foreground uppercase tracking-widest mb-4">Wishlist</h3>
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-3">
                  {shortlist.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground font-bold uppercase text-center py-10 opacity-50">Empty Wishlist</p>
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
          </aside>

          <div className="flex-1 w-full space-y-6">
            <div className="bg-white p-4 rounded-[32px] border border-primary/10 shadow-sm flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
                {days.map((day) => (
                  <Button
                    key={day.id}
                    variant={activeDayId === day.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveDayId(day.id)}
                    className={cn("rounded-xl px-5 h-10 text-[11px] font-black uppercase", activeDayId === day.id ? "bg-primary" : "text-muted-foreground")}
                  >
                    {day.name}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-1 bg-accent/5 p-1 rounded-xl">
                <AIRecommendations />
                <OptimizeItinerary />
                <Button size="sm" variant="ghost" asChild className="text-accent h-7 text-[9px] font-black uppercase px-2">
                  <a href={generateGoogleMapsLink()} target="_blank" rel="noopener noreferrer"><Map className="w-3 h-3 mr-1" /> Route</a>
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="text-accent h-7 text-[9px] font-black uppercase px-2">
                      <Share2 className="w-3 h-3 mr-1" /> Send to Phone
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md rounded-[32px] border shadow-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-black text-foreground">Send to Phone</DialogTitle>
                      <DialogDescription className="text-xs text-muted-foreground">
                        Scan this QR code with your phone's camera to open your interactive itinerary directly in Google Maps.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center space-y-6 py-4">
                      <div className="bg-white p-4 rounded-3xl border-2 border-dashed border-primary/20 shadow-sm relative overflow-hidden group">
                        <div className="absolute inset-0 bg-primary/5 transition-opacity opacity-0 group-hover:opacity-100" />
                        {activeDay && (
                          <div className="relative z-10 w-52 h-52 flex items-center justify-center">
                            <QRCodeSVG value={generateSharedLink()} size={200} />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 w-full bg-muted/20 p-2 rounded-2xl border">
                        <Input readOnly value={generateSharedLink()} className="rounded-xl flex-1 text-xs border-0 bg-transparent focus-visible:ring-0 px-2 text-muted-foreground" />
                        <Button size="icon" onClick={handleShareToPhone} className="rounded-xl shrink-0 bg-white text-primary border shadow-sm hover:bg-muted text-xs font-bold gap-2 w-auto px-4">
                          <Copy className="w-3 h-3" /> Copy
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="bg-white rounded-[40px] border border-primary/10 shadow-sm p-8 min-h-[600px]">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-2xl font-black text-foreground">{activeDay.name} Timeline</h2>
                  <p className="text-[10px] text-muted-foreground uppercase font-black flex items-center gap-2 mt-1">
                    <Clock className="w-3 h-3" /> {activeDay.startLocation} → {activeDay.endLocation}
                  </p>
                </div>
              </div>

              <div className="space-y-8 pl-6 border-l-2 border-primary/10 relative">
                {activeDay.activities.length === 0 ? (
                  <div className="text-center py-20 opacity-30 font-black uppercase tracking-widest text-xs">
                    No activities planned for this day.
                  </div>
                ) : activeDay.activities.map((activity, idx) => {
                  const isMealPlaceholder = activity.isMeal && activity.type === 'food' && activity.description.toLowerCase().includes('recommended');
                  return (
                    <div key={activity.id} className="relative">
                      <div className={cn(
                        "absolute -left-[2.15rem] top-0 w-8 h-8 rounded-2xl border-2 bg-white flex items-center justify-center font-black text-[11px]",
                        activity.fixedStartTime ? "border-accent text-accent" : "border-primary text-primary"
                      )}>
                        {activity.fixedStartTime ? "!" : idx + 1}
                      </div>

                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-[11px] font-black text-primary/80 uppercase bg-primary/5 px-3 py-1 rounded-full">
                          {activity.scheduledTime || "--:--"} — {activity.endTime || "--:--"}
                        </span>

                        {activity.travelTimeFromPrev !== undefined && activity.travelTimeFromPrev > 0 && (
                          <div className="flex items-center gap-1 text-[10px] font-black uppercase text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                            {activity.travelModeFromPrev === 'walk' ? <span className="text-lg leading-none">🚶</span> : <Car className="w-3 h-3" />}
                            <span>{activity.travelTimeFromPrev} min</span>
                          </div>
                        )}
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
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
