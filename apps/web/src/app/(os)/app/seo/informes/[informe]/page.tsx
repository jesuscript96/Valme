import Link from "next/link";
import { notFound } from "next/navigation";
import { seoModulo } from "@valme/os/seo";
import { alClienteActivo } from "@valme/os/seo/equivalente";
import { aprobarContenidoAccion, autorizarEnvioAccion } from "@valme/os/seo/operacion/acciones";
import { contenido, estadoInforme } from "@valme/os/seo/operacion/informes";
import { Estado, fmtDia } from "@valme/os/seo/ui/etiquetas";
import { ActionButton } from "@valme/os/ui/ActionButton";
import { Card, CardHeader } from "@valme/os/ui/primitives";

export async function generateMetadata({ params }: { params: Promise<{ informe: string }> }) {
  const { informe } = await params;
  return { title: `${informe} · Informes · Valme OS` };
}

export default async function Informe({ params }: { params: Promise<{ informe: string }> }) {
  const { informe } = await params;
  const seo = await seoModulo();
  const inf = seo.datos.informes.find((x) => x.id === informe && seo.clientes.some((c) => c.id === x.clientId));
  if (!inf) notFound();
  alClienteActivo.informe(seo, inf.clientId);
  const c = contenido(seo.datos, inf);
  const estado = estadoInforme(seo.datos, inf);

  return (
    <>
      <nav className="mb-3 text-[13px] text-os-muted"><Link href="/app/seo/informes" className="hover:text-os-text">← Informes</Link></nav>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="os-num text-[11px] uppercase tracking-wide text-os-faint">Entregable / {inf.id}</p>
          <h1 className="font-display text-xl font-semibold tracking-tight">{inf.titulo}</h1>
          <p className="mt-1 text-[13px] text-os-muted">{seo.cliente(inf.clientId)?.name} · {c.periodo}</p>
        </div>
        <Estado t={estado} />
      </header>

      <Card className="mb-6">
        <CardHeader title={c.listo ? "Resumen para revisión" : "Medición pendiente"} />
        <div className="space-y-4 px-4 py-4 text-[13px]">
          {c.falta ? <p className="text-os-accent">{c.falta} El informe no está listo para entregar.</p> : null}
          {c.secciones.map((s) => (
            <section key={s.titulo}>
              <h3 className="mb-1 font-medium">{s.titulo}</h3>
              {s.lineas.length ? <ul className="list-disc space-y-0.5 pl-5 text-os-text">{s.lineas.map((l, i) => <li key={i}>{l}</li>)}</ul> : <p className="text-os-muted">Nada que reportar.</p>}
            </section>
          ))}
        </div>
      </Card>

      <Card className="mb-6">
        <dl className="grid gap-x-6 gap-y-3 px-4 py-4 text-[13px] sm:grid-cols-2">
          {[
            ["Responsable", "Analítica e informes"],
            ["Revisor", "Control de calidad → Project Manager"],
            ["Validación", inf.contenidoAprobado ? `Contenido aprobado por ${inf.contenidoAprobado.por} · ${fmtDia(inf.contenidoAprobado.en)}` : c.listo ? "En revisión" : "Bloqueada por datos insuficientes"],
            ["Envío", inf.envioAutorizado ? `Autorizado por ${inf.envioAutorizado.por} · ${fmtDia(inf.envioAutorizado.en)}` : "No autorizado"],
          ].map(([k, v]) => <div key={k}><dt className="text-[11px] uppercase text-os-faint">{k}</dt><dd>{v}</dd></div>)}
        </dl>
        <div className="flex flex-wrap items-center gap-3 border-t border-os-border px-4 py-3">
          {!inf.contenidoAprobado ? (
            <ActionButton action={aprobarContenidoAccion.bind(null, inf.id)} variant="primary" size="sm" disabled={!c.listo}>Aprobar el contenido</ActionButton>
          ) : !inf.envioAutorizado ? (
            <ActionButton action={autorizarEnvioAccion.bind(null, inf.id)} variant="primary" size="sm" confirm="¿Autorizar el envío al cliente? Desde aquí no se envía nada: queda registrada la autorización.">Autorizar el envío</ActionButton>
          ) : (
            <p className="text-[13px] text-os-ok">Envío autorizado. Desde la aplicación no se envía ninguna comunicación.</p>
          )}
          {!c.listo && !inf.contenidoAprobado ? <Link href="/app/seo/supervision?f=Bloqueo" className="text-[13px] underline">Ver bloqueo de datos</Link> : null}
        </div>
        <p className="border-t border-os-border px-4 py-3 text-xs text-os-muted">La aprobación del contenido y la autorización de envío son decisiones separadas.</p>
      </Card>
    </>
  );
}
