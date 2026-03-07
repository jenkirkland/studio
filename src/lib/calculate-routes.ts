'use server';

import { PlannedActivity } from '@/app/components/planner-store';
import { calculateTravelTimeMock } from './mock-routes';

const MAPS_API_KEY = process.env.MAPS_API_KEY;

export type TravelMode = 'car' | 'walk' | 'transit';

interface RouteResponse {
    distanceMeters: number;
    durationSeconds: number;
    staticDurationSeconds?: number;
}

/**
 * Pings the Google Maps Routes API (V2) to get distance and time.
 */
async function getRouteOptions(origin: string, destination: string, departureTimeDate: Date) {
    // Fallback to LLM / mocked values if no API key is provided
    if (!MAPS_API_KEY) {
        console.warn("MAPS_API_KEY is not set. Defaulting to LLM / mocked times.");
        return null;
    }

    const departureTime = departureTimeDate.toISOString();

    const fetchRoute = async (travelMode: 'DRIVE' | 'WALK') => {
        const url = 'https://routes.googleapis.com/directions/v2:computeRoutes';
        const body: any = {
            origin: { address: origin },
            destination: { address: destination },
            travelMode: travelMode,
        };

        if (travelMode === 'DRIVE') {
            const now = new Date();
            // Google Maps Routes API only accepts departureTime for TRAFFIC_AWARE if it's in the future/present
            if (departureTimeDate >= now) {
                body.routingPreference = 'TRAFFIC_AWARE';
                body.departureTime = departureTime;
            } else {
                body.routingPreference = 'TRAFFIC_UNAWARE';
            }
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': MAPS_API_KEY,
                'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.legs'
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            console.error(`Routes API Error (${travelMode}):`, await response.text());
            return null;
        }

        const data = await response.json();
        if (!data.routes || data.routes.length === 0) return null;

        const route = data.routes[0];
        return {
            distanceMeters: route.distanceMeters as number,
            durationSeconds: parseInt(route.duration?.replace('s', '') || '0'),
            staticDurationSeconds: parseInt(route.staticDuration?.replace('s', '') || '0'),
        } as RouteResponse;
    };

    try {
        const [driveRoute, walkRoute] = await Promise.all([
            fetchRoute('DRIVE'),
            fetchRoute('WALK')
        ]);

        return { driveRoute, walkRoute };
    } catch (error) {
        console.error("Error fetching routes:", error);
        return null;
    }
}

function recommendMode(drive: RouteResponse | null, walk: RouteResponse | null): { mode: TravelMode, minutes: number } {
    // If we couldn't get routes, fallback to something nominal
    if (!drive && !walk) return { mode: 'car', minutes: 15 };

    const walkMinutes = walk ? Math.ceil(walk.durationSeconds / 60) : Infinity;
    const walkMiles = walk ? walk.distanceMeters * 0.000621371 : Infinity;

    const driveMinutes = drive ? Math.ceil(drive.durationSeconds / 60) : Infinity;

    // Rule: If walking is less than 1 mile OR less than 15 minutes, recommend walk (saves parking/traffic overhead).
    // Unless driving is somehow drastically faster for a very short distance.
    if (walk && (walkMiles < 1.0 || walkMinutes <= 15)) {
        return { mode: 'walk', minutes: walkMinutes };
    }

    // Otherwise, default to car (assuming they have one / taking rideshare)
    if (drive) {
        return { mode: 'car', minutes: driveMinutes };
    }

    // Fallback to walk if car failed but walk succeeded
    if (walk) return { mode: 'walk', minutes: walkMinutes };

    return { mode: 'car', minutes: 15 };
}

function formatAMPM(date: Date) {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strMinutes = minutes < 10 ? '0' + minutes : minutes;
    return hours + ':' + strMinutes + ' ' + ampm;
}

/**
 * Takes a sequence of activities for a single day and post-processes their exact start and end times
 * based on true geographic distances and real-time traffic using the Google Routes API.
 */
export async function recalculateTimelineWithTraffic(
    activities: PlannedActivity[],
    startLocation: string,
    targetDateString: string,
    startHour: number = 9
): Promise<PlannedActivity[]> {

    if (activities.length === 0) return [];

    const updatedActivities: PlannedActivity[] = [];

    // Base date object set to the day of the itinerary
    const baseDate = new Date(targetDateString);
    if (isNaN(baseDate.getTime())) {
        baseDate.setTime(Date.now()); // fallback
    }

    // Start the cursor at the designated start hour
    let currentTimeCursor = new Date(baseDate);
    currentTimeCursor.setHours(startHour, 0, 0, 0);

    let previousLocation = startLocation;

    for (let i = 0; i < activities.length; i++) {
        const activity = activities[i];
        const destination = activity.address || activity.name;

        // Fetch exact route times from the previous step to this step
        const routes = await getRouteOptions(previousLocation, destination, currentTimeCursor);

        const { mode, minutes } = recommendMode(routes?.driveRoute || null, routes?.walkRoute || null);

        // Apply travel time offset (buffer + 5 mins for parking/walking to door if car)
        const travelBuffer = mode === 'car' ? 5 : 0;
        const finalTravelMinutes = minutes + travelBuffer;

        currentTimeCursor.setMinutes(currentTimeCursor.getMinutes() + finalTravelMinutes);

        // If activity has a strict FIXED START TIME, we must snap the cursor forward to it (if we arrived early)
        // Note: If we arrived late, we currently just let the schedule shift, but typically we'd warn the user.
        if (activity.fixedStartTime) {
            // Parse HH:MM AM/PM
            const match = activity.fixedStartTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
            if (match) {
                let h = parseInt(match[1]);
                const m = parseInt(match[2]);
                const isPM = match[3].toUpperCase() === 'PM';
                if (isPM && h !== 12) h += 12;
                if (!isPM && h === 12) h = 0;

                const fixedDate = new Date(baseDate);
                fixedDate.setHours(h, m, 0, 0);

                if (currentTimeCursor < fixedDate) {
                    currentTimeCursor = fixedDate;
                }
            }
        }

        const scheduledTimeStr = formatAMPM(currentTimeCursor);

        // Add activity duration
        currentTimeCursor.setMinutes(currentTimeCursor.getMinutes() + (activity.durationMinutes || 60));
        const endTimeStr = formatAMPM(currentTimeCursor);

        updatedActivities.push({
            ...activity,
            scheduledTime: scheduledTimeStr,
            endTime: endTimeStr,
            travelTimeFromPrev: finalTravelMinutes,
            travelModeFromPrev: mode,
        });

        // Advance location for the next hop
        previousLocation = destination;
    }

    return updatedActivities;
}
