import type { Metadata } from "next";
import { PartnerBundlesClient } from "@/components/partners/bundles/PartnerBundlesClient";

export const metadata: Metadata = {
  title: "سبدهای اختصاصی همکاران",
  description: "پکیج‌ها و سبدهای تخفیف‌دار عمده ویژه همکاران و نمایندگان حامی همراه در مشهد و سراسر کشور.",
  robots: { index: false, follow: false },
};

export default function PartnerBundlesPage() {
  return (
    <main className="container min-h-[75vh] py-8 md:py-12">
      <PartnerBundlesClient />
    </main>
  );
}

