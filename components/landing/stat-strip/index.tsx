import { STATS } from "@/utils/content";
import { WRAP } from "@/utils/styles";

export default function StatStrip() {
  return (
    <div className="on-dark bg-ink text-on-dark">
      <div
        className={`${WRAP} flex flex-wrap justify-center gap-[38px] py-[18px] text-[14.5px] font-semibold to-720:gap-x-[22px] to-720:gap-y-2.5 to-720:text-[13.5px]`}
      >
        {STATS.map(([value, label]) => (
          <span key={label}>
            <b className="mr-1.5 font-extrabold text-brand">{value}</b>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
