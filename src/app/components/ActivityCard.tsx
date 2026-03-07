"use client"

import { Activity } from "@/app/lib/activities";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Plus, Trash2, CheckCircle2, Circle, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityCardProps {
  activity: Activity & { isOptional?: boolean; isMeal?: boolean };
  onAction?: () => void;
  onToggleOptional?: () => void;
  actionType: 'add' | 'remove';
}

export function ActivityCard({ activity, onAction, onToggleOptional, actionType }: ActivityCardProps) {
  const typeColors: Record<string, string> = {
    nature: "bg-emerald-100 text-emerald-800 border-emerald-200",
    food: "bg-orange-100 text-orange-800 border-orange-200",
    historical: "bg-amber-100 text-amber-800 border-amber-200",
    art: "bg-purple-100 text-purple-800 border-purple-200",
    entertainment: "bg-blue-100 text-blue-800 border-blue-200",
    shopping: "bg-pink-100 text-pink-800 border-pink-200",
    sports: "bg-red-100 text-red-800 border-red-200",
    culture: "bg-indigo-100 text-indigo-800 border-indigo-200",
    science: "bg-cyan-100 text-cyan-800 border-cyan-200",
    'sightseeing': "bg-sky-100 text-sky-800 border-sky-200",
    'boat tour': "bg-cyan-100 text-cyan-800 border-cyan-200",
    'family': "bg-rose-100 text-rose-800 border-rose-200",
    'nightlife': "bg-violet-100 text-violet-800 border-violet-200"
  };

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-300 border hover:shadow-lg",
      activity.isOptional ? "opacity-60 grayscale-[0.3] border-dashed" : "border-border shadow-sm",
      activity.isMeal ? "bg-accent/5 border-accent/20" : "bg-white"
    )}>
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start gap-2">
          <Badge variant="outline" className={cn("capitalize font-bold text-[9px] border", typeColors[activity.type] || "bg-muted")}>
            {activity.type}
          </Badge>
          <div className="flex items-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            <Clock className="w-3 h-3 mr-1" />
            {activity.durationMinutes} min
          </div>
        </div>
        <CardTitle className="text-base mt-2 leading-tight font-headline font-black text-foreground line-clamp-1 flex items-center gap-2">
          {activity.isMeal && <Utensils className="w-4 h-4 text-accent" />}
          {activity.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-1">
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {activity.description}
        </p>
        <div className="flex items-center text-[10px] text-primary mt-2 font-medium">
          <MapPin className="w-3 h-3 mr-1" />
          {activity.address}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex gap-2">
        {actionType === 'add' ? (
          <Button 
            onClick={onAction} 
            variant="default" 
            size="sm" 
            className="w-full bg-primary h-8 text-xs font-bold hover:bg-primary/90 shadow-sm"
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
              className="text-destructive h-8 w-8 hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button 
              onClick={onToggleOptional} 
              variant="outline" 
              size="sm" 
              className={cn(
                "flex-1 text-[10px] h-8 font-bold",
                activity.isOptional ? "bg-accent/10 border-accent text-accent" : "hover:border-accent"
              )}
            >
              {activity.isOptional ? (
                <><CheckCircle2 className="w-3 h-3 mr-1" /> Optional</>
              ) : (
                <><Circle className="w-3 h-3 mr-1" /> Set Optional</>
              )}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}