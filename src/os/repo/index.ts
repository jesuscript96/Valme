import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { requireMember } from "@/os/auth/dal";
import type { Member } from "@/os/data/members";
import * as seed from "./seed.data";
import type {
  AdCreative, AiJob, BrandKit, Campaign, Client, Integration, Landing, Lead, Offer,
} from "./types";

/**
 * REPOSITORIO CON ÁMBITO OBLIGATORIO.
 *
 * No existe `repo.offers.list()`. El único acceso a datos de un cliente es
 * `forClient(slug)`, que resuelve la sesión, valida la pertenencia y devuelve un objeto
 * cuyas consultas ya están filtradas. Así olvidarse del filtro no es un descuido posible:
 * no hay una función a la que llamar sin él.
 *
 * En el Sprint 1 esto se apoya en RLS de Postgres y `forClient` pasa a fijar el
 * `client_id` de la sesión de base de datos. La forma que ve el resto del código no cambia.
 */

const byClient = <T extends { clientId: string }>(rows: T[], clientId: string) =>
  rows.filter((r) => r.clientId === clientId);

export function memberHasAccess(member: Member, slug: string): boolean {
  return member.clients === "*" || member.clients.includes(slug);
}

/** Clientes visibles para quien ha iniciado sesión. Es la única consulta sin ámbito. */
export const listVisibleClients = cache(async (): Promise<Client[]> => {
  const { member } = await requireMember();
  return seed.clients.filter((c) => memberHasAccess(member, c.slug));
});

export type ClientScope = {
  client: Client;
  member: Member;
  role: Member["role"];
  brandKit: () => Promise<BrandKit>;
  offers: {
    list: () => Promise<Offer[]>;
    get: (id: string) => Promise<Offer | null>;
  };
  creatives: {
    listByOffer: (offerId: string) => Promise<AdCreative[]>;
  };
  campaigns: {
    listByOffer: (offerId: string) => Promise<Campaign[]>;
  };
  landings: {
    list: () => Promise<Landing[]>;
    get: (id: string) => Promise<Landing | null>;
  };
  leads: {
    list: (filter?: LeadFilter) => Promise<Lead[]>;
    get: (id: string) => Promise<Lead | null>;
    countSince: (days: number) => Promise<number>;
  };
  aiJobs: {
    list: () => Promise<AiJob[]>;
    totalCostUsd: () => Promise<number>;
  };
  integrations: () => Promise<Integration[]>;
};

export type LeadFilter = {
  offerId?: string;
  from?: string;
  to?: string;
  q?: string;
};

/**
 * Punto de entrada único. Un slug que no existe, o al que esta persona no tiene acceso,
 * da 404 — no 403: no confirmamos la existencia de clientes ajenos.
 */
export const forClient = cache(async (slug: string): Promise<ClientScope> => {
  const { member } = await requireMember();
  const client = seed.clients.find((c) => c.slug === slug);
  if (!client || !memberHasAccess(member, slug)) notFound();

  const id = client.id;

  return {
    client,
    member,
    role: member.role,

    brandKit: async () => {
      const kit = seed.brandKits.find((k) => k.clientId === id);
      if (!kit) notFound();
      return kit;
    },

    offers: {
      list: async () => byClient(seed.offers, id),
      get: async (offerId) =>
        seed.offers.find((o) => o.id === offerId && o.clientId === id) ?? null,
    },

    creatives: {
      listByOffer: async (offerId) =>
        seed.adCreatives.filter((c) => c.clientId === id && c.offerId === offerId),
    },

    campaigns: {
      listByOffer: async (offerId) =>
        seed.campaigns.filter((c) => c.clientId === id && c.offerId === offerId),
    },

    landings: {
      list: async () => byClient(seed.landings, id),
      get: async (landingId) =>
        seed.landings.find((l) => l.id === landingId && l.clientId === id) ?? null,
    },

    leads: {
      list: async (filter) => {
        let rows = byClient(seed.leads, id);
        if (filter?.offerId) {
          const landingIds = seed.landings
            .filter((l) => l.clientId === id && l.offerId === filter.offerId)
            .map((l) => l.id);
          rows = rows.filter((l) => l.landingId && landingIds.includes(l.landingId));
        }
        if (filter?.from) rows = rows.filter((l) => l.createdAt >= filter.from!);
        if (filter?.to) rows = rows.filter((l) => l.createdAt <= filter.to!);
        if (filter?.q) {
          const q = filter.q.toLowerCase();
          rows = rows.filter((l) =>
            [l.name, l.email, l.phone].some((v) => v?.toLowerCase().includes(q)),
          );
        }
        return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      },
      get: async (leadId) =>
        seed.leads.find((l) => l.id === leadId && l.clientId === id) ?? null,
      countSince: async (days) => {
        const since = new Date(Date.now() - days * 86_400_000).toISOString();
        return byClient(seed.leads, id).filter((l) => l.createdAt >= since).length;
      },
    },

    aiJobs: {
      list: async () =>
        byClient(seed.aiJobs, id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      totalCostUsd: async () =>
        byClient(seed.aiJobs, id).reduce((sum, j) => sum + (j.costUsd ?? 0), 0),
    },

    integrations: async () => byClient(seed.integrations, id),
  };
});

/** Resumen para la lista de clientes. Respeta la visibilidad del miembro. */
export const clientSummaries = cache(async () => {
  const visible = await listVisibleClients();
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
  return visible.map((c) => ({
    client: c,
    brandKitStatus: seed.brandKits.find((k) => k.clientId === c.id)?.status ?? "draft",
    offers: seed.offers.filter((o) => o.clientId === c.id).length,
    leads30d: seed.leads.filter((l) => l.clientId === c.id && l.createdAt >= since).length,
    costUsd: seed.aiJobs
      .filter((j) => j.clientId === c.id)
      .reduce((s, j) => s + (j.costUsd ?? 0), 0),
  }));
});
