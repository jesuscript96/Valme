import { notFound } from "next/navigation";
import Link from "next/link";
import { CLAVES, HERRAMIENTAS, type Herramienta } from "@/os/audit/tools";
import { requireMember } from "@/os/auth/dal";
import { Badge, PageHeader } from "@/os/ui/primitives";
import { FUNCIONES } from "@/os/audit/types";
import { RunTool } from "./RunTool";

/**
 * Cargar una página con navegador tarda entre veinte y cuarenta segundos, muy por encima
 * del límite por defecto de una función serverless. Sesenta es el techo del plan Pro de
 * Vercel; en Hobby se recorta a diez y la auditoría no cabe.
 *
 * Va aquí y no en `actions.ts` porque es configuración de segmento de ruta: un fichero
 * "use server" solo puede exportar funciones asíncronas.
 */
export const maxDuration = 60;

export async function generateMetadata({ params }: { params: Promise<{ tool: string }> }) {
  const { tool } = await params;
  const h = HERRAMIENTAS[tool as Herramienta["clave"]];
  return { title: h ? `${h.nombre} · Valme OS` : "Valme OS" };
}

export default async function ToolPage({
  params,
  searchParams,
}: {
  params: Promise<{ tool: string }>;
  searchParams: Promise<{ dominio?: string }>;
}) {
  const { tool } = await params;
  const { dominio } = await searchParams;
  await requireMember();

  if (!CLAVES.includes(tool as Herramienta["clave"])) notFound();
  const h = HERRAMIENTAS[tool as Herramienta["clave"]];

  // Qué le falta a ESTA herramienta, no a todas. Las tres son deterministas y no usan
  // modelo de lenguaje, así que pedir la clave del LLM aquí sería desinformar.
  const faltan: string[] = [];
  if (h.colectores.includes("adlib") && !process.env.META_ADLIB_TOKEN) {
    faltan.push("META_ADLIB_TOKEN");
  }
  if (h.colectores.includes("web") && !process.env.PAGESPEED_API_KEY) {
    faltan.push("PAGESPEED_API_KEY");
  }

  return (
    <>
      <nav className="mb-3 text-[12px] text-os-faint">
        <Link href="/app/dx/tools" className="hover:underline">Herramientas</Link>
        <span className="mx-1.5">/</span>
        <span className="text-os-muted">{h.nombre}</span>
      </nav>

      <PageHeader
        title={h.nombre}
        description={h.descripcion}
        action={
          <span className="flex flex-wrap justify-end gap-1.5">
            {h.funciones.map((f) => (
              <Badge key={f} tone="info">{FUNCIONES[f].nombre}</Badge>
            ))}
            <Badge>@{h.dueño}</Badge>
          </span>
        }
      />

      <RunTool tool={h.clave} dominioInicial={dominio ?? ""} faltan={faltan} />
    </>
  );
}
