"use client"

import { Activity } from "@/app/lib/activities";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Plus, Trash2, CheckCircle2, Utensils, CalendarClock, ExternalLink, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ActivityCardProps {
  activity: Activity & { isOptional?: boolean; isMeal?: boolean; fixedStartTime?: string; notes?: string; website?: string };
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
    sightseeing: "bg-sky-100 text-sky-800 border-sky-200"
  };

  const isCustom = activity.id.startsWith('custom-');

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-300 border hover:shadow-md w-full",
      activity.isOptional ? "opacity-60 grayscale-[0.3] border-dashed bg-muted/20" : "border-border shadow-sm bg-white",
      activity.isMeal ? "bg-accent/5 border-accent/20" : "",
      activity.fixedStartTime ? "border-accent/40 shadow-accent/5" : ""
    )}>
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start gap-2">
          <Badge variant="outline" className={cn("capitalize font-bold text-[10px] border px-2 py-0", typeColors[activity.type] || "bg-muted")}>
            {isCustom ? "Custom" : activity.type}
          </Badge>
          <div className="flex items-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            <Clock className="w-3 h-3 mr-1" />
            {activity.durationMinutes} min
          </div>
        </div>
        <CardTitle className="text-sm mt-2 leading-tight font-headline font-bold text-foreground flex items-center gap-2">
          {activity.isMeal && <Utensils className="w-3.5 h-3.5 text-accent" />}
          {activity.fixedStartTime && <CalendarClock className="w-3.5 h-3.5 text-accent" />}
          <span className="line-clamp-1">{activity.name}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-1">
        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-normal mb-2">
          {activity.description}
        </p>
        <div className="flex items-center text-[10px] text-primary/80 font-medium">
          <MapPin className="w-3 h-3 mr-1 shrink-0" />
          <span className="truncate">{activity.address}</span>
        </div>
        
        {activity.notes && (
          <div className="mt-3 p-2 bg-accent/10 rounded-xl border border-accent/20 flex gap-2 items-start">
             <Info className="w-3 h-3 text-accent mt-0.5" />
             <p className="text-[9px] text-accent font-bold leading-tight uppercase">{activity.notes}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0 flex gap-2 items-center">
        {actionType === 'add' ? (
          <Button 
            onClick={onAction} 
            variant="default" 
            size="sm" 
            className="w-full bg-primary h-7 text-[11px] font-black uppercase hover:bg-primary/90"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add to Day
          </Button>
        ) : (
          <>
            <Button 
              onClick={onAction} 
              variant="ghost" 
              size="icon" 
              className="text-destructive h-7 w-7 hover:bg-destructive/10 shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
            
            {activity.website && (
               <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg border-accent/20 text-accent" asChild>
                 <a href={activity.website} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-3 h-3" /></a>
               </Button>
            )}

            {!isCustom && !activity.isMeal && (
              <Button 
                onClick={onToggleOptional} 
                variant="outline" 
                size="sm" 
                className={cn(
                  "flex-1 text-[10px] h-7 font-black uppercase transition-colors",
                  activity.isOptional ? "bg-accent/10 border-accent text-accent" : "hover:border-accent"
                )}
              >
                {activity.isOptional ? "Optional" : "Set Optional"}
              </Button>
            )}
            {activity.fixedStartTime && (
              <div className="ml-auto text-[9px] font-black text-accent uppercase flex items-center gap-1">
                <Clock className="w-3 h-3" /> {activity.fixedStartTime}
              </div>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  );
}
