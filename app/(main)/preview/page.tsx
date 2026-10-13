import { Metadata } from "next";
import { resolveDesignSystem, DESIGN_SYSTEM_MAP } from "@/lib/design-system";

export const metadata: Metadata = {
  title: "پیش‌نمایش کامپوننت‌ها | Multi Design System",
  description: "محیط مجزا و ایزوله برای بررسی کامپوننت‌ها در دیزاین سیستم‌های مختلف",
  robots: { index: false, follow: false },
};

interface PreviewPageProps {
  searchParams: Promise<{
    style?: string;
    embed?: string;
  }>;
}

export default async function ComponentPreviewPage({ searchParams }: PreviewPageProps) {
  const params = await searchParams;
  const styleKey = resolveDesignSystem(params.style);
  const isEmbed = params.embed === "1" || params.embed === "true";
  const definition = DESIGN_SYSTEM_MAP[styleKey];

  return (
    <div
      data-testid="preview-container"
      data-style={styleKey}
      data-embed={isEmbed ? "true" : "false"}
      className={`min-h-[300px] w-full p-6 transition-colors duration-200 ${
        isEmbed ? "bg-transparent" : "container mx-auto py-12"
      }`}
    >
      <div className="mx-auto max-w-4xl space-y-8">
        {!isEmbed && (
          <header className="border-b border-border/20 pb-4">
            <h1 className="text-2xl font-bold text-foreground">
              پیش‌نمایش کامپوننت‌ها ({definition.label})
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {definition.description}
            </p>
          </header>
        )}

        {/* Sample Component Showcase */}
        <section className="grid gap-6 sm:grid-cols-2">
          {/* Card 1: Buttons & Inputs */}
          <div className="rounded-2xl border border-border/20 bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-card-foreground mb-4">دکمه‌ها و فرم‌ها</h2>
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
                >
                  دکمه اصلی (Primary)
                </button>
                <button
                  type="button"
                  className="rounded-full border border-border/30 bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition hover:bg-secondary/80"
                >
                  دکمه ثانویه (Secondary)
                </button>
              </div>
              <div>
                <input
                  type="text"
                  placeholder="ورودی نمونه..."
                  className="w-full rounded-xl border border-border/20 bg-background/50 px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Card 2: Badges & Surface */}
          <div className="rounded-2xl border border-border/20 bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-card-foreground mb-4">نشان‌ها و سطوح</h2>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary">
                  نشان شاخص
                </span>
                <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                  نشان خاموش
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                این پیش‌نمایش در محیط کامپوننتی مستقل اجرا می‌شود و توکن‌های{" "}
                <code className="text-primary font-mono text-xs">{definition.className}</code> را اعمال می‌کند.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

