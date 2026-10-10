"use client";

import { createContext, useContext } from "react";
import { apiGet } from "@/lib/api-client";
import { useSection, type SectionRead } from "./useSection";
import type { SummaryData } from "./sections/derive";

const DashboardSummaryContext = createContext<SectionRead<SummaryData> | null>(null);

/** The report endpoint is one shared read for the dashboard's three summary consumers. */
export function DashboardSummaryProvider({ children }: { children: React.ReactNode }) {
  const summary = useSection<SummaryData>(
    () => apiGet<SummaryData>("/api/admin/reports/summary"),
    (data) => data.byStatus.length === 0,
  );

  return <DashboardSummaryContext.Provider value={summary}>{children}</DashboardSummaryContext.Provider>;
}

export function useDashboardSummary() {
  const summary = useContext(DashboardSummaryContext);
  if (!summary) throw new Error("useDashboardSummary must be used within <DashboardSummaryProvider>");
  return summary;
}
