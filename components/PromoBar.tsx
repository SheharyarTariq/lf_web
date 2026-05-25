"use client";

import { useEffect, useState } from "react";

interface OrderDiscount {
  forOrder: number;
  type: string;
  amount: number;
}

interface SystemStatusResponse {
  orderDiscounts?: OrderDiscount[];
}

export default function PromoBar() {
  const [discountText, setDiscountText] = useState("35%");

  useEffect(() => {
    async function fetchDiscount() {
      try {
        const response = await fetch("https://api.staging.laundryfree.co.uk/system-status");
        if (!response.ok) return;

        const data: SystemStatusResponse = await response.json();
        if (data && Array.isArray(data.orderDiscounts)) {
          const firstOrderDiscount = data.orderDiscounts.find(
            (d) => d.forOrder === 1
          );

          if (firstOrderDiscount && typeof firstOrderDiscount.amount === "number") {
            const suffix = firstOrderDiscount.type === "percent" ? "%" : "";
            setDiscountText(`${firstOrderDiscount.amount}${suffix}`);
          }
        }
      } catch (error) {
        console.error("Failed to fetch promo bar discount:", error);
      }
    }

    fetchDiscount();
  }, []);

  return (
    <div className="bg-lime py-[10px] px-12 text-center text-[13px] font-bold text-dark tracking-[0.1px]">
      🎉 {discountText} off your first order{" "}
      <span className="font-normal opacity-70">— download the app to claim</span>
    </div>
  );
}
