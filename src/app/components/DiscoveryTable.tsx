"use client"

import { useState } from "react";
import { ACTIVITIES, Activity } from "@/app/lib/activities";
import { usePlanner } from "./planner-store";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Star, StarOff, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function DiscoveryTable() {
  const { shortlist, addToShortlist, removeFromShortlist, days } = usePlanner();
  const [search, setSearch] = useState("");

  const filteredActivities = ACTIVITIES.filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.type.toLowerCase().includes(search.toLowerCase()) ||
    a.description.toLowerCase().includes(search.toLowerCase())
  );

  const isInShortlist = (id: string) => shortlist.some(s => s.id === id);
  const isPlanned = (id: string) => days.some(d => d.activities.some(da => da.id === id));

  const typeColors = {
    nature: "bg-green-100 text-green-700",
    food: "bg-orange-100 text-orange-700",
    historical: "bg-amber-100 text-amber-900",
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
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search activities, locations, or types..." 
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead className="font-bold">Activity</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="hidden md:table-cell">Brief Summary</TableHead>
              <TableHead className="text-right">Duration</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredActivities.map((activity) => {
              const short = isInShortlist(activity.id);
              const planned = isPlanned(activity.id);

              return (
                <TableRow key={activity.id} className={cn(planned && "bg-muted/30 opacity-70")}>
                  <TableCell>
                    {planned ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => short ? removeFromShortlist(activity.id) : addToShortlist(activity)}
                        className={cn(short ? "text-accent" : "text-muted-foreground")}
                      >
                        <Star className={cn("h-5 w-5", short && "fill-current")} />
                      </Button>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{activity.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("capitalize text-[10px]", typeColors[activity.type as keyof typeof typeColors] || "bg-muted")}>
                      {activity.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden md:table-cell max-w-md">
                    <p className="line-clamp-1">{activity.description}</p>
                  </TableCell>
                  <TableCell className="text-right text-xs font-mono">
                    {activity.durationMinutes}m
                  </TableCell>
                  <TableCell>
                    {!planned && !short && (
                       <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs h-8"
                        onClick={() => addToShortlist(activity)}
                       >
                         Shortlist
                       </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}