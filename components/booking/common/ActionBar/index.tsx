"use client";

import type { ReactNode } from "react";
import { ACTIONS, ACTIONS_MORE, NAV } from "@/utils/booking/styles";

/** The sticky bar at the foot of every step. It carries margin-top:auto, so
 *  on a short screen it sits at the bottom and on a tall one it simply
 *  follows the content. */
export default function ActionBar({
  more,
  nav = false,
  children,
}: {
  /** Something is still below it, so the top edge earns its shadow. */
  more: boolean;
  /** Back beside Continue rather than a single full-width button. */
  nav?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`${ACTIONS}${nav ? ` ${NAV}` : ""}${more ? ` ${ACTIONS_MORE}` : ""}`}>
      {children}
    </div>
  );
}
