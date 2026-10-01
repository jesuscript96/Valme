import { seoModulo } from "@valme/os/seo";
import { medirGeoAccion } from "@valme/os/seo/acciones";
import { fmtDia } from "@valme/os/seo/ui/etiquetas";
import { ActionButton } from "@valme/os/ui/ActionButton";
import { Badge, Card, CardHeader, EmptyState, PageHeader, Table, Td, Th } from "@valme/os/ui/primitives";

export const metadata = { title: "Visibilidad IA · SEO · Valme OS" };

/** Cada medición pregunta a un modelo y carga la home con un navegador. */
export const maxDuration = 60;

/**
 * VISIBILIDAD EN IA (GEO).
 *
 * Si un comprador pregunta a un asistente por la categoría del cliente, ¿sale? En qué
 * puesto, y a quién nombra en su lugar. Se mide varias veces: una sola respuesta de un
 * modelo no dice nada; la tendencia sí. «Nadie lo está haciendo» (roadmap §6).
 */
export default async function Geo() {
  const seo = await seoModulo();
  const hayClave = Boolean(process.env.OS_LLM_API_KEY || process.env.ANTHROPIC_API_KEY);

  return (
    <>
      <PageHeader
        title="Visibilidad en IA (GEO)"
        description="Se describe a qué se dedica el cliente sin su nombre, se hacen al modelo las preguntas de un comprador y se mira si aparece, en qué puesto y a quién recomienda en su lugar."
      />

      {!hayClave ? (
        <Card className="mb-6 border-os-warn/30 bg-os-warn-soft px-4 py-3">
          <p className="text-[13px] text-os-warn">
            Falta <span className="font-mono">OS_LLM_API_KEY</span> en el entorno. Sin ella no se puede preguntar a un
            asistente; la medición se registra como «no disponible» con el motivo.
          </p>
        </Card>
      ) : null}

      {seo.proyectos.length ? (
        <div className="space-y-6">
          {seo.proyectos.map((p) => {
            const historial = seo.mediciones
              .filter((m) => m.proyectoId === p.id)
              .sort((a, b) => b.en.localeCompare(a.en));
            const ultima = historial.find((m) => m.estado === "medida");
            return (
              <Card key={p.id}>
                <CardHeader
                  title={
                    <span>
                      {seo.cliente(p.clientId)?.name} <span className="font-normal text-os-muted">· {p.dominio}</span>
                    </span>
                  }
                  action={
                    <ActionButton
                      action={medirGeoAccion.bind(null, p.id)}
                      size="sm"
                      pendingLabel="Preguntando… (hasta 1 min)"
                    >
                      Medir ahora
                    </ActionButton>
                  }
                />
                {ultima ? (
                  <div className="grid gap-4 border-b border-os-border px-4 py-4 sm:grid-cols-3">
                    <Cifra
                      k="Respuestas que le citan"
                      v={`${ultima.menciones} de ${ultima.consultas.length}`}
                      tono={ultima.menciones ? "ok" : "accent"}
                    />
                    <Cifra k="Mejor puesto" v={ultima.posicion ? `#${ultima.posicion}` : "—"} />
                    <Cifra k="Categoría preguntada" v={ultima.categoria ?? "—"} pequeño />
                    {ultima.competidores.length ? (
                      <p className="text-[13px] text-os-muted sm:col-span-3">
                        <span className="font-medium text-os-text">Recomienda en su lugar:</span>{" "}
                        {ultima.competidores.join(", ")}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                {historial.length ? (
                  <Table>
                    <thead>
                      <tr><Th>Fecha</Th><Th>Resultado</Th><Th>Puesto</Th><Th>Por</Th></tr>
                    </thead>
                    <tbody>
                      {historial.map((m) => (
                        <tr key={m.id}>
                          <Td className="text-os-muted">{fmtDia(m.en)}</Td>
                          <Td>
                            {m.estado === "medida" ? (
                              <Badge tone={m.menciones ? "ok" : "accent"}>
                                {m.menciones} de {m.consultas.length}
                              </Badge>
                            ) : (
                              <span className="text-xs text-os-muted">No disponible · {m.motivo}</span>
                            )}
                          </Td>
                          <Td className="os-num">{m.posicion ? `#${m.posicion}` : "—"}</Td>
                          <Td className="text-os-muted">{m.por}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <p className="px-4 py-5 text-[13px] text-os-muted">Sin mediciones todavía.</p>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No hay proyectos" body="Crea el proyecto (dominio) del cliente en Proyectos para poder medirlo." />
      )}
    </>
  );
}

function Cifra({ k, v, tono, pequeño }: { k: string; v: string; tono?: "ok" | "accent"; pequeño?: boolean }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-os-faint">{k}</p>
      <p
        className={
          (pequeño ? "text-[13px] " : "os-num font-display text-xl ") +
          "mt-1 font-semibold " +
          (tono === "ok" ? "text-os-ok" : tono === "accent" ? "text-os-accent" : "text-os-text")
        }
      >
        {v}
      </p>
    </div>
  );
}
