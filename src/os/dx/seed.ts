import type { EjecucionAuditoria, Lead } from "./types";

/**
 * Datos de demo del lado Diagnóstico. Se sustituyen por Supabase cuando llegue.
 *
 * Los dominios son reales a propósito: son sitios públicos contra los que la herramienta
 * se puede ejecutar de verdad desde la pantalla, en vez de enseñar un resultado inventado.
 */

const d = (dias: number) => new Date(Date.now() - dias * 86_400_000).toISOString();

export const leads: Lead[] = [
  {
    id: "ld_1", empresa: "Nordic Clinic", dominio: "nordicclinic.es",
    contacto: "Elena Vidal", email: "elena@nordicclinic.es", telefono: "+34963000000",
    mensaje: "Invertimos en Meta desde hace un año y no sabemos si funciona.",
    origen: "Formulario web", estado: "ganado", clienteSlug: "nordic-clinic", recibidoEn: d(64),
  },
  {
    id: "ld_2", empresa: "Taller Rivas", dominio: "tallerrivas.com",
    contacto: "Sergio Rivas", email: "sergio@tallerrivas.com", telefono: "+34961111111",
    mensaje: "Queremos empezar a captar clientes por internet.",
    origen: "Recomendación", estado: "ganado", clienteSlug: "taller-rivas", recibidoEn: d(31),
  },
  {
    id: "ld_3", empresa: "Casa Boix", dominio: "casaboix.es",
    contacto: "Marta Boix", email: "marta@casaboix.es", telefono: null,
    mensaje: "Nos han dicho que necesitamos estar en Google.",
    origen: "Formulario web", estado: "auditado", clienteSlug: null, recibidoEn: d(3),
  },
  {
    id: "ld_4", empresa: "Grupo Almenar", dominio: "almenar.example",
    contacto: "Pablo Almenar", email: "pablo@almenar.example", telefono: "+34962222222",
    mensaje: "Tenemos agencia pero no vemos resultados. Queremos una segunda opinión.",
    origen: "LinkedIn", estado: "nuevo", clienteSlug: null, recibidoEn: d(1),
  },
  {
    id: "ld_5", empresa: "Cerámicas Ponent", dominio: "ponent.example",
    contacto: null, email: "info@ponent.example", telefono: null,
    mensaje: null,
    origen: "Formulario web", estado: "nuevo", clienteSlug: null, recibidoEn: d(0),
  },
];

export const ejecuciones: EjecucionAuditoria[] = [
  {
    id: "au_1", leadId: "ld_3", dominio: "casaboix.es", herramienta: "web",
    ejecutadaEn: d(3), duracionMs: 24_100, señales: 13,
    hallazgos: { p0: 1, p1: 2, p2: 1, p3: 1, positivos: 0 },
  },
  {
    id: "au_2", leadId: "ld_3", dominio: "casaboix.es", herramienta: "seo",
    ejecutadaEn: d(3), duracionMs: 31_400, señales: 21,
    hallazgos: { p0: 0, p1: 1, p2: 3, p3: 2, positivos: 1 },
  },
  {
    id: "au_3", leadId: "ld_1", dominio: "nordicclinic.es", herramienta: "paid",
    ejecutadaEn: d(60), duracionMs: 22_800, señales: 6,
    hallazgos: { p0: 0, p1: 1, p2: 1, p3: 0, positivos: 2 },
  },
];
