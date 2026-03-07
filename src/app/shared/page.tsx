"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PlannedActivity, PlannedDay } from "../components/planner-store";
import { ActivityCard } from "../components/ActivityCard";
import { Clock, Car, Map, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";

function SharedItineraryContent() {
    const searchParams = useSearchParams();
    const [day, setDay] = useState<PlannedDay | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        try {
            const planParam = searchParams.get("plan");
            if (!planParam) {
                setError("No itinerary provided in the URL.");
                return;
            }

            // Decode the base-64 compressed payload safely
            // Some browsers replace + with spaces in URL params, so we replace them back.
            const safeParam = planParam.replace(/ /g, '+');
            const decompressed = decodeURIComponent(escape(window.atob(safeParam)));
            if (!decompressed) {
                throw new Error("Could not decode itinerary data.");
            }

            const decodedDay = JSON.parse(decompressed) as PlannedDay;
            setDay(decodedDay);
        } catch (e: any) {
            console.error("Failed to parse shared itinerary:", e);
            setError("This itinerary link appears to be invalid or corrupted.");
        }
    }, [searchParams]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-[#f8f9fa]">
                <AlertCircle className="w-12 h-12 text-destructive mb-4 opacity-50" />
                <h1 className="text-xl font-black uppercase tracking-widest text-foreground">Oops</h1>
                <p className="text-muted-foreground mt-2 text-sm max-w-sm">{error}</p>
            </div>
        );
    }

    if (!day) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#f8f9fa]">
                <div className="animate-pulse flex items-center gap-3 opacity-50">
                    <Map className="w-5 h-5" />
                    <span className="text-xs font-black uppercase tracking-widest">Loading Itinerary...</span>
                </div>
            </div>
        );
    }

    // Generate Google Maps link for the 'Route' button
    const origin = encodeURIComponent(day.startLocation || "Tewksbury,MA");
    const stops = day.activities
        .filter(a => !a.isOptional)
        .map(a => encodeURIComponent(a.address))
        .join('/');
    const destination = encodeURIComponent(day.endLocation || "Tewksbury,MA");
    const mapsLink = `https://www.google.com/maps/dir/${origin}/${stops}/${destination}`;

    return (
        <div className="min-h-screen bg-[#f8f9fa] pb-24">
            {/* Sticky Header */}
            <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-primary/10 px-6 py-4 flex items-center justify-between shadow-sm">
                <div>
                    <h1 className="text-lg font-black text-foreground truncate">{day.name}</h1>
                    <p className="text-[9px] text-muted-foreground uppercase font-black flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3 h-3" /> {day.startLocation} → {day.endLocation}
                    </p>
                </div>
                <Button size="sm" asChild className="h-8 text-[10px] font-black uppercase rounded-xl bg-primary shadow-md">
                    <a href={mapsLink} target="_blank" rel="noopener noreferrer"><Map className="w-3 h-3 mr-1.5" /> Route</a>
                </Button>
            </div>

            {/* Main Timeline Content */}
            <div className="p-6 max-w-md mx-auto mt-4">
                <div className="space-y-8 pl-6 border-l-2 border-primary/20 relative">
                    {day.activities.length === 0 ? (
                        <div className="text-center py-20 opacity-30 font-black uppercase tracking-widest text-xs">
                            No activities planned.
                        </div>
                    ) : day.activities.map((activity, idx) => {
                        const isMealPlaceholder = activity.isMeal && activity.type === 'food' && activity.description.toLowerCase().includes('recommended');
                        return (
                            <div key={activity.id} className="relative">
                                {/* Number Badge */}
                                <div className={cn(
                                    "absolute -left-[2.15rem] top-0 w-8 h-8 rounded-2xl border-2 bg-white flex items-center justify-center font-black text-[11px] shadow-sm",
                                    activity.fixedStartTime ? "border-accent text-accent" : "border-primary text-primary"
                                )}>
                                    {activity.fixedStartTime ? "!" : idx + 1}
                                </div>

                                {/* Meta Bar */}
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="text-[10px] font-black text-primary/80 uppercase bg-primary/10 px-3 py-1 rounded-full shrink-0">
                                        {activity.scheduledTime || "--:--"} — {activity.endTime || "--:--"}
                                    </span>

                                    {activity.travelTimeFromPrev !== undefined && activity.travelTimeFromPrev > 0 && (
                                        <div className="flex items-center gap-1 text-[9px] font-black uppercase text-muted-foreground bg-muted px-2 py-1 rounded-md shrink-0">
                                            {activity.travelModeFromPrev === 'walk' ? <span className="text-sm leading-none">🚶</span> : <Car className="w-3 h-3" />}
                                            <span>{activity.travelTimeFromPrev} min</span>
                                        </div>
                                    )}
                                </div>

                                {/* Read-Only Card Frame */}
                                {isMealPlaceholder ? (
                                    <div className="bg-orange-50/50 border border-orange-200 p-4 rounded-3xl opacity-80">
                                        <h4 className="text-sm font-black text-orange-900 mb-1">{activity.name}</h4>
                                        <p className="text-xs text-orange-800/70">{activity.description}</p>
                                    </div>
                                ) : (
                                    <div className="pointer-events-none">
                                        <ActivityCard
                                            activity={activity}
                                            actionType="none" // Disable all interaction buttons
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="text-center mt-12 opacity-30">
                <Map className="w-6 h-6 mx-auto mb-2" />
                <p className="text-[9px] font-black uppercase tracking-widest">Boston Merrimack Wanderer</p>
            </div>
        </div>
    );
}

export default function SharedItineraryPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-8"><span className="animate-pulse">Loading Itinerary...</span></div>}>
            <SharedItineraryContent />
        </Suspense>
    );
}
