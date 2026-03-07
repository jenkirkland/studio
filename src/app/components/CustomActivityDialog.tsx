"use client"

import { useState } from "react";
import { usePlanner, PlannedActivity } from "./planner-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarClock, Search, Loader2, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { searchCustomEvent } from "@/ai/flows/search-custom-event-flow";

export function CustomActivityDialog() {
  const { addCustomActivity, days } = usePlanner();
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    duration: "60",
    fixedTime: "",
    description: "",
    date: ""
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const result = await searchCustomEvent({ query: searchQuery });
      setSearchResults(result.results);
    } catch (err) {
      toast({ title: "Search failed", variant: "destructive" });
    } finally {
      setSearching(false);
    }
  };

  const selectResult = (res: any) => {
    setFormData({
      ...formData,
      name: res.name,
      address: res.address,
      duration: res.suggestedDurationMinutes.toString(),
      description: res.description
    });
    setSearchResults([]);
    setSearchQuery("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.address || !formData.date) {
      toast({ title: "Missing fields", description: "Name, address, and date are required.", variant: "destructive" });
      return;
    }

    const customActivity: PlannedActivity = {
      id: `custom-${Date.now()}`,
      name: formData.name,
      address: formData.address,
      description: formData.description || "Custom planned event.",
      durationMinutes: parseInt(formData.duration) || 60,
      type: 'entertainment',
      isOptional: false,
      fixedStartTime: formData.fixedTime || undefined,
      date: formData.date
    };

    addCustomActivity(customActivity, formData.date);
    setOpen(false);
    setFormData({ name: "", address: "", duration: "60", fixedTime: "", description: "", date: "" });
    toast({ title: "Event Added", description: `${formData.name} added to your plan.` });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full border-dashed border-primary/40 text-primary hover:bg-primary/5 h-10 rounded-xl text-xs font-bold">
          <CalendarClock className="w-4 h-4 mr-2" />
          Add Custom Event
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] rounded-[32px] border-4 border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-primary">Custom Experience</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-muted-foreground">Quick Search</Label>
            <div className="flex gap-2">
              <Input 
                placeholder="Search event, museum, or venue..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="rounded-xl"
              />
              <Button onClick={handleSearch} disabled={searching} size="icon" className="shrink-0 bg-primary">
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
            
            {searchResults.length > 0 && (
              <div className="mt-2 border rounded-xl overflow-hidden bg-muted/20">
                {searchResults.map((res, i) => (
                  <button 
                    key={i} 
                    onClick={() => selectResult(res)}
                    className="w-full p-3 text-left hover:bg-primary/5 border-b last:border-0 transition-colors"
                  >
                    <div className="text-xs font-bold text-foreground">{res.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{res.address}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">Select Day *</Label>
                <Select onValueChange={(v) => setFormData({...formData, date: v})} value={formData.date}>
                  <SelectTrigger className="rounded-xl h-10">
                    <SelectValue placeholder="Date" />
                  </SelectTrigger>
                  <SelectContent>
                    {days.map(day => (
                      <SelectItem key={day.date} value={day.date} className="text-xs font-bold">
                        {day.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="time" className="text-[10px] font-black uppercase text-muted-foreground">Time (Optional)</Label>
                <Input id="time" placeholder="e.g. 7:30 PM" className="rounded-xl h-10" value={formData.fixedTime} onChange={(e) => setFormData({...formData, fixedTime: e.target.value})} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-[10px] font-black uppercase text-muted-foreground">Event Name *</Label>
              <Input id="name" placeholder="e.g. Hamilton" className="rounded-xl h-10" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-[10px] font-black uppercase text-muted-foreground">Address / Location *</Label>
              <Input id="address" placeholder="Full address" className="rounded-xl h-10" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration" className="text-[10px] font-black uppercase text-muted-foreground">Duration (mins)</Label>
              <Input id="duration" type="number" className="rounded-xl h-10" value={formData.duration} onChange={(e) => setFormData({...formData, duration: e.target.value})} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc" className="text-[10px] font-black uppercase text-muted-foreground">Notes</Label>
              <Textarea id="desc" placeholder="Specific notes..." className="rounded-xl" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
            </div>

            <DialogFooter>
              <Button type="submit" className="w-full bg-primary font-black uppercase text-xs h-12 rounded-2xl shadow-lg">Add to Itinerary</Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
