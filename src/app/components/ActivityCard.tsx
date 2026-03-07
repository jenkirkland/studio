"use client"

import { Activity } from "@/app/lib/activities";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Plus, Trash2, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityCardProps {
  activity: Activity & { isOptional?: boolean };
  onAction?: () => void;
  onToggleOptional?: () => void;
  actionType: 'add' | 'remove';
}

export function ActivityCard({ activity, onAction, onToggleOptional, actionType }: ActivityCardProps) {
  const typeColors = {
    nature: "bg-green-100 text-green-700",
    food: "bg-orange-100 text-orange-700",
    historical: "bg-brown-100 text-amber-900",
    art: "bg-purple-100 text-purple-700",
    entertainment: "bg-blue-100 text-blue-700",
    shopping: "bg-pink-100 text-pink-700",
    sports: "bg-red-100 text-red-700",
    culture: "bg-indigo-100 text-indigo-700",
    science: "bg-cyan-100 text-cyan-700",
    'sightseeing': "bg-emerald-100 text-emerald-700",
    'boat tour': "bg-sky-100 text-sky-700",
    'family': "bg-rose-100 text-rose-700",
    'nightlife': "bg-violet-100 text-violet-700"
  };

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-300 border-2 hover:shadow-md",
      activity.isOptional ? "opacity-60 grayscale-[0.5] border-dashed" : "border-transparent"
    )}>
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start gap-2">
          <Badge variant="outline" className={cn("capitalize font-medium text-[10px]", typeColors[activity.type as keyof typeof typeColors] || "bg-muted")}>
            {activity.type}
          </Badge>
          <div className="flex items-center text-xs text-muted-foreground">
            <Clock className="w-3 h-3 mr-1" />
            {activity.durationMinutes} min
          </div>
        </div>
        <CardTitle className="text-sm mt-2 leading-tight font-headline font-bold text-foreground line-clamp-1">{activity.name}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
          {activity.description}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex gap-2">
        {actionType === 'add' ? (
          <Button 
            onClick={onAction} 
            variant="default" 
            size="sm" 
            className="w-full bg-primary h-8 text-xs hover:bg-primary/90 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add to Itinerary
          </Button>
        ) : (
          <>
            <Button 
              onClick={onAction} 
              variant="ghost" 
              size="icon" 
              className="text-destructive h-8 w-8 hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button 
              onClick={onToggleOptional} 
              variant="outline" 
              size="sm" 
              className={cn(
                "flex-1 text-[10px] h-8",
                activity.isOptional ? "bg-accent/10 border-accent text-accent" : ""
              )}
            >
              {activity.isOptional ? (
                <><CheckCircle2 className="w-3 h-3 mr-1" /> Optional</>
              ) : (
                <><Circle className="w-3 h-3 mr-1" /> Optional?</>
              )}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}