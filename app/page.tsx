import { SiteHeader } from "@/components/site-header";
import { HeroBanner } from "@/components/hero-banner";
import { ListingGrid } from "@/components/listing-grid";
import { ReferralBanner } from "@/components/referral-banner";
import { getActiveListingsCount, getFeaturedListings } from "@/lib/listings-data";

export const revalidate = 10;

export default async function HomePage(props: PageProps<"/">) {
  const searchParams = await props.searchParams;
  const ref = typeof searchParams.ref === "string" ? searchParams.ref : null;

  const [count, featured] = await Promise.all([
    getActiveListingsCount(),
    getFeaturedListings(),
  ]);

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      {ref && <ReferralBanner listingId={ref} />}
      <HeroBanner featured={featured} />
      <ListingGrid initialCount={count} />
    </div>
  );
}
