import Image from "next/image";
import { PlannerProvider } from "./components/planner-store";
import { PlannerUI } from "./components/PlannerUI";
import { PlaceHolderImages } from "./lib/placeholder-images";
import { Compass } from "lucide-react";

export default function Home() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-wanderer');

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative h-[250px] w-full overflow-hidden flex items-center justify-center">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            fill
            className="object-cover brightness-75"
            priority
            data-ai-hint={heroImage.imageHint}
          />
        )}
        <div className="relative z-10 text-center px-4 max-w-4xl">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Compass className="w-10 h-10 text-accent animate-pulse" />
            <h1 className="text-4xl md:text-5xl font-headline font-black text-white tracking-tight drop-shadow-lg">
              Boston Merrimack Wanderer
            </h1>
          </div>
          <p className="text-lg md:text-xl text-white/90 font-medium drop-shadow-md">
            Explore Tewksbury & beyond with your personalized local itinerary
          </p>
        </div>
      </header>

      {/* Main Content - Removed negative margin to fix persistent shadowed line */}
      <main className="container mx-auto px-4 py-8 relative z-20">
        <PlannerProvider>
          <PlannerUI />
        </PlannerProvider>
      </main>

      <footer className="py-8 border-t bg-white/50 text-center text-sm text-muted-foreground">
        <div className="container mx-auto px-4">
          <p>© {new Date().getFullYear()} Boston Merrimack Wanderer. Proudly exploring the Merrimack Valley.</p>
          <p className="mt-1">Crafted with tranquility in Tewksbury, MA.</p>
        </div>
      </footer>
    </div>
  );
}
