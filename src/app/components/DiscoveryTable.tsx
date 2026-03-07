"use client"

import { useState } from "react";
import { ACTIVITIES } from "@/app/lib/activities";
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

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search activities, locations, or types..." 
          className="pl-10 h-11 border-primary/20 focus-visible:ring-primary/30 rounded-xl"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="w-[60px] text-center">Star</TableHead>
              <TableHead className="font-black text-foreground">Experience</TableHead>
              <TableHead className="font-black text-foreground">Kind</TableHead>
              <TableHead className="hidden md:table-cell font-black text-foreground">Brief Summary</TableHead>
              <TableHead className="text-right font-black text-foreground">Duration</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredActivities.map((activity) => {
              const short = isInShortlist(activity.id);
              const planned = isPlanned(activity.id);

              return (
                <TableRow key={activity.id} className={cn("group transition-colors", planned && "bg-muted/10 opacity-60")}>
                  <TableCell className="text-center">
                    {planned ? (
                      <CheckCircle2 className="h-5 w-5 text-primary mx-auto" />
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => short ? removeFromShortlist(activity.id) : addToShortlist(activity)}
                        className={cn("h-9 w-9 rounded-full transition-all", short ? "text-accent bg-accent/5 hover:bg-accent/10" : "text-muted-foreground hover:text-primary hover:bg-primary/5")}
                      >
                        <Star className={cn("h-4 w-4", short && "fill-current")} />
                      </Button>
                    )}
                  </TableCell>
                  <TableCell className="font-bold text-sm text-foreground">{activity.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize text-[9px] font-bold border-primary/20 bg-primary/5 text-primary">
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
