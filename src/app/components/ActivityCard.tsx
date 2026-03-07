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
  };

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-300 border-2 hover:shadow-md",
      activity.isOptional ? "opacity-60 grayscale-[0.5] border-dashed" : "border-transparent"
    )}>
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start gap-2">
          <Badge variant="outline" className={cn("capitalize font-medium", typeColors[activity.type])}>
            {activity.type}
          </Badge>
          <div className="flex items-center text-xs text-muted-foreground">
            <Clock className="w-3 h-3 mr-1" />
            {activity.durationMinutes} min
          </div>
        </div>
        <CardTitle className="text-lg mt-2 leading-tight font-headline text-foreground">{activity.name}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {activity.description}
        </p>
        <div className="flex items-center text-xs text-muted-foreground">
          <MapPin className="w-3 h-3 mr-1 shrink-0" />
          <span className="truncate">{activity.address}</span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex gap-2">
        {actionType === 'add' ? (
          <Button 
            onClick={onAction} 
            variant="default" 
            size="sm" 
            className="w-full bg-primary hover:bg-primary/90 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add to Day
          </Button>
        ) : (
          <>
            <Button 
              onClick={onAction} 
              variant="ghost" 
              size="icon" 
              className="text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button 
              onClick={onToggleOptional} 
              variant="outline" 
              size="sm" 
              className={cn(
                "flex-1 text-xs",
                activity.isOptional ? "bg-accent/10 border-accent text-accent" : ""
              )}
            >
              {activity.isOptional ? (
                <><CheckCircle2 className="w-3 h-3 mr-1" /> Optional</>
              ) : (
                <><Circle className="w-3 h-3 mr-1" /> Mark Optional</>
              )}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
