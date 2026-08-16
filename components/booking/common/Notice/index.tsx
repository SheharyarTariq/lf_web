"use client";

import { cn } from "@/utils/cn";
import type { ReactNode } from "react";
import { Icon, P } from "@/components/booking/icons";
import { NOTE, NOTE_TONE } from "@/utils/booking/styles";

/** A boxed aside with an icon: confirmations, warnings and the plain
 *  "here is how this works" note all use it, distinguished only by tone. */
export default function Notice({
  tone = "",
  icon = P.info,
  title,
  children,
}: {
  tone?: keyof typeof NOTE_TONE;
  icon?: string;
  title?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn(NOTE, NOTE_TONE[tone])}>
      <Icon d={icon} size={19} className="mt-0.5 flex-none" />
      <div>
        {title && <b className="mb-0.5 block">{title}</b>}
        {children}
      </div>
    </div>
  );
}
