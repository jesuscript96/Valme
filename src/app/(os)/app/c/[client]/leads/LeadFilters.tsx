"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input, Select } from "@/os/ui/primitives";

/** Los filtros viven en la URL: un filtro puesto se puede pegar en Slack. */
export function LeadFilters({ offers }: { offers: { id: string; name: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  function set(key: string, value: string) {
    const next = new URLSearchParams(sp.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      <Select
        className="w-56"
        value={sp.get("offer") ?? ""}
        onChange={(e) => set("offer", e.target.value)}
        aria-label="Filtrar por oferta"
      >
        <option value="">Todas las ofertas</option>
        {offers.map((o) => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </Select>
      <Input
        className="w-64"
        placeholder="Buscar por nombre, email o teléfono"
        defaultValue={sp.get("q") ?? ""}
        onChange={(e) => set("q", e.target.value)}
        aria-label="Buscar"
      />
    </div>
  );
}
