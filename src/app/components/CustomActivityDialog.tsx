"use client"

import { useState } from "react";
import { usePlanner, PlannedActivity } from "./planner-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarClock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

export function CustomActivityDialog() {
  const { addCustomActivity, days } = usePlanner();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    duration: "60",
    fixedTime: "",
    description: "",
    date: ""
  });

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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-primary">Add Custom Experience</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-muted-foreground">Select Day *</Label>
            <Select onValueChange={(v) => setFormData({...formData, date: v})} value={formData.date}>
              <SelectTrigger>
                <SelectValue placeholder="Which day?" />
              </SelectTrigger>
              <SelectContent>
                {days.map(day => (
                  <SelectItem key={day.date} value={day.date}>
                    {day.name} ({format(new Date(day.date + 'T00:00:00'), 'MMM d')})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name" className="text-[10px] font-black uppercase text-muted-foreground">Event Name *</Label>
            <Input id="name" placeholder="e.g. Hamilton" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address" className="text-[10px] font-black uppercase text-muted-foreground">Address / Location *</Label>
            <Input id="address" placeholder="e.g. Boston, MA" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration" className="text-[10px] font-black uppercase text-muted-foreground">Duration (mins)</Label>
              <Input id="duration" type="number" value={formData.duration} onChange={(e) => setFormData({...formData, duration: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time" className="text-[10px] font-black uppercase text-muted-foreground">Fixed Time (Optional)</Label>
              <Input id="time" placeholder="e.g. 7:30 PM" value={formData.fixedTime} onChange={(e) => setFormData({...formData, fixedTime: e.target.value})} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc" className="text-[10px] font-black uppercase text-muted-foreground">Notes</Label>
            <Textarea id="desc" placeholder="Details..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
          </div>
          <DialogFooter>
            <Button type="submit" className="w-full bg-primary font-black uppercase text-xs h-11">Add to Itinerary</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
