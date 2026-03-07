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
import { Search, Star, CheckCircle2 } from "lucide-react";
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
          className="pl-10 h-11 border-primary/20 focus-visible:ring-primary/30"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead className="font-black text-foreground">Experience</TableHead>
              <TableHead className="font-black text-foreground">Type</TableHead>
              <TableHead className="hidden md:table-cell font-black text-foreground">Brief Summary</TableHead>
              <TableHead className="text-right font-black text-foreground">Duration</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredActivities.map((activity) => {
              const short = isInShortlist(activity.id);
              const planned = isPlanned(activity.id);

              return (
                <TableRow key={activity.id} className={cn(planned && "bg-muted/20 opacity-60")}>
                  <TableCell>
                    {planned ? (
                      <div className="flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => short ? removeFromShortlist(activity.id) : addToShortlist(activity)}
                        className={cn("h-8 w-8 transition-all", short ? "text-accent" : "text-muted-foreground hover:text-primary")}
                      >
                        <Star className={cn("h-4 w-4", short && "fill-current")} />
                      </Button>
                    )}
                  </TableCell>
                  <TableCell className="font-bold text-sm">{activity.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("capitalize text-[9px] font-bold", typeColors[activity.type as keyof typeof typeColors] || "bg-muted")}>
                      {activity.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground hidden md:table-cell max-w-md">
                    <p className="line-clamp-1">{activity.description}</p>
                  </TableCell>
                  <TableCell className="text-right text-xs font-mono font-bold text-primary/70">
                    {activity.durationMinutes}m
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