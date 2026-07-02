"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { clsx } from "@/lib/clsx";
import { formatSar } from "@/lib/format";
import { vehicles } from "@/data/transport";
import type { TransportRate, VehicleKey } from "@/data/types";

const categories = ["All", "Airport", "Hotel", "Railway", "Ziyarat"] as const;
type Category = (typeof categories)[number];

export function TransportTable({ rates }: { rates: TransportRate[] }) {
  const [category, setCategory] = useState<Category>("All");
  const [vehicle, setVehicle] = useState<VehicleKey>("car");

  const filtered = useMemo(
    () => (category === "All" ? rates : rates.filter((r) => r.category === category)),
    [rates, category],
  );

  return (
    <div>
      {/* Vehicle selector */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {vehicles.map((v) => (
          <button
            key={v.key}
            onClick={() => setVehicle(v.key)}
            className={clsx(
              "flex flex-col items-center rounded-xl border p-4 text-center transition-all",
              vehicle === v.key
                ? "border-secondary bg-secondary-container"
                : "border-outline-variant/40 bg-surface-container-lowest hover:border-secondary/40",
            )}
          >
            <Icon
              name={v.icon}
              className={clsx(
                "text-3xl",
                vehicle === v.key ? "text-on-secondary-container" : "text-secondary",
              )}
            />
            <span className="mt-2 text-sm font-semibold text-on-surface">{v.name}</span>
            <span className="text-xs text-on-surface-variant">{v.capacity}</span>
          </button>
        ))}
      </div>

      {/* Category tabs */}
      <div className="mt-8 flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={clsx(
              "rounded-full px-5 py-2 text-sm font-semibold transition-colors",
              category === c
                ? "bg-primary text-on-primary"
                : "bg-surface-container text-on-surface-variant hover:text-on-surface",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Rate table */}
      <div className="mt-6 overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-lowest">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-outline-variant/40 bg-surface-container text-xs uppercase tracking-wider text-on-surface-variant">
              <th className="px-6 py-4 font-semibold">Route</th>
              <th className="px-6 py-4 font-semibold">Category</th>
              <th className="px-6 py-4 text-right font-semibold">
                {vehicles.find((v) => v.key === vehicle)?.name} Rate
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const price = r.prices[vehicle];
              return (
                <tr
                  key={r.id}
                  className="border-b border-outline-variant/30 transition-colors last:border-0 hover:bg-surface-container-low"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 font-medium text-on-surface">
                      <span>{r.from}</span>
                      <Icon name="arrow_forward" className="text-base text-secondary" />
                      <span>{r.to}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-semibold text-on-surface-variant">
                      {r.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-[var(--font-heading)] text-lg text-on-surface">
                    {typeof price === "number" ? formatSar(price) : "On request"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-on-surface-variant">
        Rates are per vehicle, one way, in Saudi Riyal (SAR). Contact us for custom routes
        and Coaster pricing.
      </p>
    </div>
  );
}
