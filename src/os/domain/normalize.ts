/**
 * Normalización de datos de contacto. Funciones puras, deliberadamente FUERA de
 * `meta.ts`: allí vive `server-only` y esto lo necesitan también el formulario de la
 * landing y los tests.
 *
 * Importa que sean uno y sólo un sitio: si la deduplicación normaliza el email de una
 * forma y el hash de la Conversions API de otra, la atribución se pierde EN SILENCIO —
 * Meta recibe un hash que no casa con nadie y no devuelve ningún error.
 */

export const normalizeEmail = (v: string): string => v.trim().toLowerCase();

/** Sólo dígitos, como pide Meta para el hash de teléfono (sin '+', sin espacios). */
export const normalizePhone = (v: string): string => v.replace(/[^\d]/g, "");
