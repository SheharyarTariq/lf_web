"use client";

import type { ReactNode } from "react";
import { Icon, P } from "@/components/booking/icons";
import { ERR, FIELD, HINT, LABEL } from "@/utils/booking/styles";

/** Label, control, and either an error or a hint — never both, because the
 *  error is the thing to act on and a hint underneath it competes. */
export default function Field({
  label,
  hint,
  error,
  id,
  className = "",
  children,
}: {
  label: ReactNode;
  hint?: string;
  error?: string;
  id: string;
  /** For the paired rows, whose cells share the row's free space. */
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`${FIELD} ${className}`.trimEnd()}>
      <label className={LABEL} htmlFor={id}>
        {label}
      </label>
      {children}
      {error ? (
        <p className={ERR} id={`${id}-err`}>
          <Icon d={P.alert} size={16} className="mt-0.5 flex-none" />
          {error}
        </p>
      ) : (
        hint && (
          <p className={HINT} id={`${id}-hint`}>
            {hint}
          </p>
        )
      )}
    </div>
  );
}
