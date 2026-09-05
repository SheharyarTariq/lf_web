import { cn } from "@/utils/cn";
import { StepIcon, TrustIcon } from "@/components/icons";
import { PANEL_TRUST, STEPS } from "@/utils/content";
import { SECTION_H2_MARGIN, WRAP } from "@/utils/styles";

/**
 * Condensed version of the process, sitting directly under the hero.
 */
export default function HowItWorks() {
  return (
    <section
      className="border-b border-b-line py-14 to-1280:py-[52px] to-1024:py-[46px] to-720:py-12"
      id="how-it-works"
      aria-labelledby="lf-how"
    >
      <div className={WRAP}>
        <div className="relative overflow-hidden rounded-card-xl bg-panel px-10 pb-[34px] pt-11 to-1280:px-[34px] to-1280:pb-[30px] to-1280:pt-9 to-1024:px-[26px] to-1024:pb-[26px] to-1024:pt-[30px] to-720:px-6 to-720:pb-7 to-720:pt-8">
          <div className="mb-[30px]">
            <p className="mb-4 inline-block rounded-[6px] bg-brand px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[1.5px] text-ink">
              How it works
            </p>
            <h2
              id="lf-how"
              className={cn("mb-1.5 text-[clamp(28px,3.1vw,40px)] font-extrabold leading-[1.1] tracking-[-1.2px]", SECTION_H2_MARGIN)}
            >
              How to live laundry-free
            </h2>
          </div>

          <ol className="mb-[30px] grid grid-cols-[repeat(4,1fr)] gap-3.5 to-1024:grid-cols-[repeat(2,1fr)] to-1024:gap-3 to-720:grid-cols-[1fr] to-720:gap-2.5">
            {STEPS.map((s, i) => (
              <li
                className="rounded-card-md border border-line bg-white px-4 pb-5 pt-[18px] transition-[transform,box-shadow] duration-[160ms] ease-[ease] hover:-translate-y-0.5 hover:shadow-lift to-1180:px-[15px] to-1180:pb-[18px] to-1180:pt-4 to-720:px-4 to-720:pb-4 to-720:pt-[15px]"
                key={s.title}
              >
                {/* Number and icon share a row on phones — three stacked rows
                    before any content made the cards needlessly tall. */}
                <span className="flex flex-col items-start to-720:mb-3 to-720:flex-row to-720:items-center to-720:justify-between to-720:gap-3">
                  <span className="mb-4 flex items-center gap-[7px] text-[11.5px] font-bold uppercase tracking-[1.3px] text-ink-3 to-720:mb-0">
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                    Step 0{i + 1}
                  </span>
                  <span className="mb-4 flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[9px] bg-brand text-ink to-720:mb-0 to-720:h-8 to-720:w-8 to-720:rounded-lg">
                    <StepIcon name={s.icon} />
                  </span>
                </span>
                {/* Sized so the longest title plus its qualifier — "YOU
                    APPROVE & PAY (optional)" — stays on one line inside the
                    ~216px card at four across. */}
                <h3 className="mb-[9px] text-[12.5px] font-extrabold uppercase tracking-[.8px] to-720:mb-1.5">
                  {s.title}
                  {/* Qualifier, not part of the label — lighter, lowercase,
                      no tracking. */}
                  {s.note && (
                    <span className="ml-[5px] whitespace-nowrap text-[11.5px] font-medium normal-case tracking-normal text-ink-3">
                      ({s.note})
                    </span>
                  )}
                </h3>
                <p className="text-[14.5px] leading-[1.6] text-ink-2 to-1180:text-[14px] to-720:leading-[1.55]">
                  {s.body}
                </p>
              </li>
            ))}
          </ol>

          {/* Centred summary band. Kept together rather than split
              one-per-card: "No service fees" applies to the whole service,
              not to any one step. On phones it stacks left-aligned —
              centred, they wrap into a ragged block with the icons
              scattered. */}
          <ul className="flex flex-wrap justify-center gap-x-11 gap-y-4 pt-1 to-1024:gap-x-[30px] to-1024:gap-y-3.5 to-1024:pt-[26px] to-720:flex-col to-720:items-start to-720:justify-start to-720:gap-3.5 to-720:pt-[30px]">
            {PANEL_TRUST.map((t) => (
              <li key={t.label} className="flex items-center gap-[9px] text-[14.5px] font-bold">
                <TrustIcon name={t.icon} className="flex-none text-ink-2" />
                {t.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
