import Link from "next/link";
import { notFound } from "next/navigation";
import { HERRAMIENTAS } from "@valme/os/audit/tools";
import { requireMember } from "@valme/os/auth/dal";
import { PageHeader } from "@valme/os/ui/primitives";
import { RunTool } from "../../../dx/tools/[tool]/RunTool";

/** El motor carga la página con un navegador: 20-40 s. */
export const maxDuration = 60;

const DEL_MODULO = ["seo", "geo"] as const;

export async function generateMetadata({ params }: { params: Promise<{ tool: string }> }) {
  const { tool } = await params;
  const clave = DEL_MODULO.find((c) => c === tool);
  return { title: clave ? `${HERRAMIENTAS[clave].nombre} · SEO · Valme OS` : "Valme OS" };
}

export default async function Herramienta({
  params, searchParams,
}: { params: Promise<{ tool: string }>; searchParams: Promise<{ dominio?: string }> }) {
  const { tool } = await params;
  const { dominio } = await searchParams;
  await requireMember();
  const clave = DEL_MODULO.find((c) => c === tool);
  if (!clave) notFound();
  const h = HERRAMIENTAS[clave];
  const faltan = clave === "geo" && !process.env.OS_LLM_API_KEY && !process.env.ANTHROPIC_API_KEY
    ? ["OS_LLM_API_KEY"]
    : [];

  return (
    <>
      <nav className="mb-3 text-[13px] text-os-muted">
        <Link href="/app/seo/herramientas" className="hover:text-os-text">Herramientas</Link>
        <span className="mx-1.5 text-os-faint">/</span>
        {h.nombre}
      </nav>
      <PageHeader title={h.nombre} description={h.descripcion} />
      <RunTool tool={h.clave} dominioInicial={dominio ?? ""} faltan={faltan} />
    </>
  );
}
