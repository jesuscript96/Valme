import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { señal, type Señal } from "../../types";

const run = promisify(execFile);

/**
 * DNS. Cuatro consultas, 200 ms, gratis y sin permisos.
 *
 * Es el mejor ratio de toda la auditoría: la mayoría de las pymes no tiene DMARC y no lo
 * sabe, y eso se traduce solo a «una parte de tus correos comerciales va a spam».
 */

async function txt(nombre: string): Promise<string[]> {
  try {
    const { stdout } = await run("dig", ["+short", "TXT", nombre], { timeout: 8000 });
    return stdout.split("\n").map((l) => l.trim().replace(/^"|"$/g, "")).filter(Boolean);
  } catch {
    return [];
  }
}

export async function recogerDns(dominio: string): Promise<Señal[]> {
  const out: Señal[] = [];
  const base = { funcion: 8 as const, fuente: "DNS" };

  const spfs = (await txt(dominio)).filter((r) => r.toLowerCase().startsWith("v=spf1"));
  const spf = spfs[0] ?? null;
  out.push(señal({
    ...base, id: "datos.spf", que: "Registro SPF",
    valor: spf,
    // Dos SPF es peor que ninguno: los servidores receptores fallan la comprobación.
    estado: spfs.length > 1 ? "parcial" : "verificado",
    limite: spfs.length > 1 ? "Hay más de un registro SPF, lo que invalida la comprobación en destino" : undefined,
  }));

  // El modificador final decide qué hace el receptor con el correo no autorizado.
  if (spf) {
    const modo = /-all\s*$/.test(spf) ? "-all (estricto)"
      : /~all\s*$/.test(spf) ? "~all (suave)"
      : /\?all\s*$/.test(spf) ? "?all (neutro)" : "sin modificador final";
    out.push(señal({ ...base, id: "datos.spf_modo", que: "Política del SPF", valor: modo, estado: "verificado" }));
  }

  const dmarc = (await txt(`_dmarc.${dominio}`)).find((r) => r.toLowerCase().startsWith("v=dmarc1")) ?? null;
  out.push(señal({ ...base, id: "datos.dmarc", que: "Registro DMARC", valor: dmarc, estado: "verificado" }));

  if (dmarc) {
    const p = /[;\s]p=([a-z]+)/i.exec(dmarc)?.[1] ?? "none";
    out.push(señal({ ...base, id: "datos.dmarc_politica", que: "Política DMARC", valor: p, estado: "verificado" }));
    out.push(señal({ ...base, id: "datos.dmarc_informes", que: "Recibe informes DMARC",
      valor: /rua=/i.test(dmarc), estado: "verificado" }));
  }

  try {
    const { stdout } = await run("dig", ["+short", "MX", dominio], { timeout: 8000 });
    const mx = stdout.split("\n").map((l) => l.trim()).filter(Boolean)
      .sort((a, b) => Number(a.split(" ")[0]) - Number(b.split(" ")[0]));
    out.push(señal({ ...base, id: "datos.mx", que: "Proveedor de correo",
      valor: mx.map((m) => m.split(" ")[1] ?? m), estado: mx.length ? "verificado" : "parcial",
      limite: mx.length ? undefined : "El dominio no declara servidores de correo" }));
  } catch {
    out.push(señal({ ...base, id: "datos.mx", que: "Proveedor de correo", valor: null,
      estado: "pendiente", limite: "La consulta DNS ha fallado" }));
  }

  // DKIM no se puede enumerar: el selector lo elige quien envía. Se prueban los habituales
  // y una ausencia NO demuestra que no esté configurado.
  const selectores = ["default", "google", "selector1", "selector2", "k1", "s1", "zoho", "mail"];
  const encontrados: string[] = [];
  for (const s of selectores) {
    if ((await txt(`${s}._domainkey.${dominio}`)).some((r) => /p=/i.test(r))) encontrados.push(s);
  }
  out.push(señal({
    ...base, id: "datos.dkim", que: "DKIM en selectores habituales",
    valor: encontrados.length ? encontrados : null,
    estado: "parcial",
    limite: "El selector DKIM lo elige quien envía y no se puede enumerar. No encontrarlo no prueba que falte.",
  }));

  return out;
}
