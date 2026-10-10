import { NeedsActionSection } from "./sections/NeedsActionSection";
import { NewestOrdersSection } from "./sections/NewestOrdersSection";
import { OrderVolumeSection } from "./sections/OrderVolumeSection";
import { TakingsSection } from "./sections/TakingsSection";
import { CatalogInventorySection } from "./sections/CatalogInventorySection";
import { DashboardSummaryProvider } from "./DashboardSummaryProvider";

/** Dashboard cards read live data from authenticated admin APIs. */
export function DashboardClient() {
  return (
    <div className="admin-dashboard space-y-6 text-[#292326] [&_.text-foreground]:!text-[#292326] [&_.text-muted-foreground]:!text-[#746b6c] [&_.text-champagne]:!text-[#8a561f] [&_.text-aqua]:!text-[#80591f] [&_.text-emerald-400]:!text-[#176b4b] [&_.text-destructive]:!text-[#a52e35] [&_.bg-ink-2\/30]:!bg-white [&_.border-dashed]:!border-[#ded5cc]">
      <CatalogInventorySection />
      <DashboardSummaryProvider>
        <div className="grid gap-4 sm:grid-cols-2">
          <TakingsSection />
          <OrderVolumeSection />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <NeedsActionSection />
          <NewestOrdersSection />
        </div>
      </DashboardSummaryProvider>
    </div>
  );
}
