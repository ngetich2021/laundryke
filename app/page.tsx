import { SiteHeader } from "@/components/site-header";
import { HeroBanner } from "@/components/hero-banner";
import { ListingGrid } from "@/components/listing-grid";
import { getActiveListingsCount, getFeaturedListing } from "@/lib/listings-data";

export default async function HomePage() {
  const [count, featured] = await Promise.all([
    getActiveListingsCount(),
    getFeaturedListing(),
  ]);

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <HeroBanner featured={featured} />
      <ListingGrid initialCount={count} />
    </div>
  );
}
