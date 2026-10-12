import { HeartHandshake, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Guideline banner explaining the Australian 24-Hour Movement Guidelines connection.
 */
export function GuidelineBanner() {
  return (
    <section className="py-6 sm:py-8" aria-labelledby="guidelines-heading">
      <Card className="overflow-hidden border border-[#93AB63]/40 bg-gradient-to-br from-white/90 via-white/80 to-[#93AB63]/10 shadow-xs">
        <CardContent className="p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[#93AB63]/20 text-[#5B7330]">
            <HeartHandshake className="size-7" aria-hidden="true" />
          </div>

          <div className="flex-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#93AB63]/15 px-2.5 py-0.5 text-xs font-semibold text-[#5B7330]">
              <CheckCircle className="size-3.5" aria-hidden="true" />
              <span>Australian 24-Hour Movement Guidelines</span>
            </div>
            <h3
              id="guidelines-heading"
              className="mt-2 text-lg font-bold text-zinc-900 sm:text-xl"
            >
              Aiming for 60 minutes of daily active play—guilt-free.
            </h3>
            <p className="mt-2 text-xs text-zinc-600 sm:text-sm leading-relaxed">
              National health guidelines recommend that children aged 5–17 accumulate at least 60 minutes of moderate to vigorous physical play every day.
              PlayGo & Co breaks this down into bite-sized 15, 30, or 45-minute playful missions, helping families build lasting, joyful active habits together.
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
