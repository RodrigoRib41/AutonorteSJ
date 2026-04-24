import { FeaturedVehicles } from "@/components/home/featured-vehicles";
import { FinancingOffers } from "@/components/home/financing-offers";
import { Hero } from "@/components/home/hero";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <Header />
      <main>
        <Hero />
        <FeaturedVehicles />
        <FinancingOffers />
      </main>
      <Footer />
    </div>
  );
}
