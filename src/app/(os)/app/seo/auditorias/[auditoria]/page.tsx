import Link from "next/link";
import { notFound } from "next/navigation";
import { referencias, rutaAuditoria, seoModulo } from "@/os/seo";
import { alClienteActivo } from "@/os/seo/equivalente";
import { coberturaAccion, editarAlcanceAccion } from "@/os/seo/acciones";
import { seguimientoAbierto, soloLectura } from "@/os/seo/estados";
import { SERVICIOS } from "@/os/seo/tipos";
import { CoberturaBadge, EstadoBadge, fmtDia } from "@/os/seo/ui/etiquetas";
import { Desplegable, Formulario } from "@/os/seo/ui/Formulario";
import { ProximasAcciones } from "@/os/seo/ui/ProximasAcciones";
import { fmtDateTime } from "@/os/ui/labels";
import {
  Badge, Card, CardHeader, EmptyState, Field, Input, Select, Table, Td, Textarea, Th, cx,
} from "@/os/ui/primitives";
import { Decisiones, Pista } from "./Decisiones";
import { Hallazgos } from "./Hallazgos";

/** El motor de auditoría carga la página con un navegador y rastrea el sitemap. */
export const maxDuration = 60;

const PESTAÑAS = [
  ["resumen", "Resumen"],
  ["alcance", "Alcance"],
  ["evidencias", "Evidencias"],
  ["hallazgos", "Hallazgos"],
  ["cobertura", "Cobertura"],
  ["historial", "Historial"],
] as const;
type Pestaña = (typeof PESTAÑAS)[number][0];

export async function generateMetadata({
  params,
}: { params: Promise<{ auditoria: string }> }) {
  const { auditoria } = await params;
  const d = (await seoModulo()).detalle(auditoria);
  return { title: `${d?.auditoria.ref ?? "Auditoría"} · Valme OS` };
}

export default async function AuditoriaSeo({
  params, searchParams,
}: {
  params: Promise<{ auditoria: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { auditoria: id } = await params;
  const { tab } = await searchParams;
  const seo = await seoModulo();
  const d = seo.detalle(id);
  if (!d) notFound();
  alClienteActivo.auditoria(seo, d.auditoria.clientId, tab);

  const { auditoria: a, proyecto, hallazgos, evidencias, tareas, eventos, cobertura } = d;
  const pestaña: Pestaña = PESTAÑAS.some(([k]) => k === tab) ? (tab as Pestaña) : "resumen";
  const bloqueada = soloLectura(a);
  const refH = referencias(hallazgos, "H");
  const refE = referencias(evidencias, "E");
  const base = rutaAuditoria(a.id);
  const cliente = seo.cliente(a.clientId);
  const pms = seo.pmsDe(a.clientId);

  return (
    <>
      <nav className="mb-3 text-[13px] text-os-muted">
        <Link href="/app/seo/auditorias" className="hover:text-os-text">Auditorías</Link>
        <span className="mx-1.5 text-os-faint">/</span>
        <span className="os-num">{a.ref}</span>
      </nav>

      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="os-num text-[11px] uppercase tracking-wide text-os-faint">{a.ref}</p>
          <h1 className="font-display text-xl font-semibold tracking-tight text-os-text">
            {cliente?.name ?? "Cliente"} · {proyecto?.nombre ?? "Proyecto"}
          </h1>
          <p className="mt-1 text-[13px] text-os-muted">{a.dominio}</p>
        </div>
        <span className="inline-flex gap-1.5">
          <EstadoBadge e={a.estado} />
          {a.archivadaEn ? <Badge>Archivada</Badge> : null}
        </span>
      </header>

      <Pista estado={a.estado} />
      <Decisiones a={a} actor={seo.actor} hallazgos={hallazgos.length} />

      <nav className="mb-5 flex gap-1 overflow-x-auto border-b border-os-border">
        {PESTAÑAS.map(([k, label]) => (
          <Link
            key={k}
            href={k === "resumen" ? base : `${base}?tab=${k}`}
            aria-current={pestaña === k ? "page" : undefined}
            className={cx(
              "-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-[13px]",
              pestaña === k
                ? "border-os-accent font-medium text-os-text"
                : "border-transparent text-os-muted hover:text-os-text",
            )}
          >
            {label}
            {k === "hallazgos" && hallazgos.length ? (
              <span className="os-num ml-1.5 text-[11px] text-os-faint">{hallazgos.length}</span>
            ) : null}
            {k === "evidencias" && evidencias.length ? (
              <span className="os-num ml-1.5 text-[11px] text-os-faint">{evidencias.length}</span>
            ) : null}
          </Link>
        ))}
      </nav>

      {pestaña === "resumen" ? (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
            <Card>
              <CardHeader title="Contrato" />
              <dl className="grid gap-x-6 gap-y-4 px-4 py-4 text-[13px] sm:grid-cols-2">
                <Dato k="Cliente / proyecto" v={`${cliente?.name ?? "—"} / ${proyecto?.nombre ?? "—"}`} />
                <Dato k="Dominio" v={a.dominio} />
                <Dato k="Servicios" v={a.servicios.join(" · ")} />
                <Dato k="Solicitado por" v={`${a.solicitadaPor} · ${fmtDia(a.creadaEn)}`} />
                <Dato
                  k="Límites"
                  v={`${a.limites.paginas} páginas · ${a.limites.minutos} min · ${a.limites.costeEur.toFixed(2)} EUR`}
                />
                <Dato
                  k="Autorización"
                  v={a.autorizacion ? `${a.autorizacion.por} · ${fmtDia(a.autorizacion.en)} · ${a.autorizacion.referencia}` : "Sin autorizar"}
                />
              </dl>
            </Card>
            <Card>
              <CardHeader title="Preparación" />
              <dl className="divide-y divide-os-border text-[13px]">
                <Cifra n={evidencias.length} k="Evidencias" />
                <Cifra n={hallazgos.length} k="Hallazgos" />
                <Cifra
                  n={`${cobertura.filter((c) => c.estado !== "pendiente_justificado").length}/${cobertura.length}`}
                  k="Servicios cubiertos"
                />
              </dl>
            </Card>
          </div>
          <ProximasAcciones
            tareas={tareas}
            auditorias={[a]}
            hallazgos={hallazgos}
            pms={pms}
            refHallazgo={refH}
          />
        </div>
      ) : null}

      {pestaña === "alcance" ? (
        <Card className="px-4 py-4">
          <h2 className="mb-2 text-[13px] font-semibold">Alcance autorizado</h2>
          <p className="text-[13px] leading-relaxed text-os-text">{a.alcance}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {a.servicios.map((s) => (
              <Badge key={s} tone="info">{s}</Badge>
            ))}
          </div>
          {!bloqueada && (a.estado === "borrador" || a.estado === "devuelto") ? (
            <div className="mt-4">
              <Desplegable titulo="Editar alcance">
                <Formulario accion={editarAlcanceAccion.bind(null, a.id)} boton="Guardar alcance">
                  <div className="flex flex-wrap gap-4 text-[13px]">
                    {SERVICIOS.map((s) => (
                      <label key={s} className="inline-flex items-center gap-2">
                        <input type="checkbox" name="servicios" value={s} defaultChecked={a.servicios.includes(s)} />
                        {s}
                      </label>
                    ))}
                  </div>
                  <Field label="Límites y exclusiones">
                    <Textarea name="alcance" defaultValue={a.alcance} required />
                  </Field>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="Páginas"><Input name="paginas" type="number" defaultValue={a.limites.paginas} /></Field>
                    <Field label="Duración (min)"><Input name="minutos" type="number" defaultValue={a.limites.minutos} /></Field>
                    <Field label="Coste (EUR)"><Input name="coste" type="number" step="0.01" defaultValue={a.limites.costeEur} /></Field>
                  </div>
                </Formulario>
              </Desplegable>
            </div>
          ) : (
            <p className="mt-4 text-xs text-os-faint">El alcance solo se cambia en borrador o devuelto.</p>
          )}
        </Card>
      ) : null}

      {pestaña === "evidencias" ? (
        evidencias.length ? (
          <Card>
            <CardHeader
              title="Evidencias"
              action={<span className="os-num text-[11px] uppercase text-os-faint">{evidencias.length} registros</span>}
            />
            <ul className="divide-y divide-os-border">
              {evidencias.map((e) => (
                <li key={e.id} id={`e-${e.id}`} className="scroll-mt-6 px-4 py-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 space-y-1">
                      <p className="os-num text-[11px] text-os-faint">{refE.get(e.id)} · {e.metodo}</p>
                      <p className="text-[13px] font-medium text-os-text">{e.fuente}</p>
                      <p className="break-words text-[13px] text-os-muted">
                        <a href={e.recurso} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
                          {e.recurso}
                        </a>{" "}
                        · {e.observado}
                      </p>
                      <p className="text-[11px] text-os-faint">Observado {fmtDateTime(e.observadoEn)}</p>
                    </div>
                    <Badge tone={e.externa ? "warn" : "ok"}>{e.externa ? "Dato externo" : "Interna"}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          <EmptyState
            title="Todavía no hay evidencias"
            body="Se registran después de autorizar e iniciar el encargo, al ejecutar el motor o al cargar una revisión."
          />
        )
      ) : null}

      {pestaña === "hallazgos" ? (
        <Hallazgos
          a={a}
          actor={seo.actor}
          pms={pms}
          bloqueada={!seguimientoAbierto(a)}
          hallazgos={hallazgos}
          tareas={tareas}
          refH={refH}
          refE={refE}
        />
      ) : null}

      {pestaña === "cobertura" ? (
        <div className="space-y-4">
          <Table>
            <thead>
              <tr><Th>Servicio</Th><Th>Estado</Th><Th className="text-right">Hallazgos</Th><Th className="text-right">Evidencias</Th><Th>Motivo</Th></tr>
            </thead>
            <tbody>
              {cobertura.map((c) => (
                <tr key={c.servicio}>
                  <Td className="font-medium">{c.servicio}</Td>
                  <Td><CoberturaBadge e={c.estado} /></Td>
                  <Td className="os-num text-right">{c.hallazgos}</Td>
                  <Td className="os-num text-right">{c.evidencias}</Td>
                  <Td className="text-os-muted">{c.motivo ?? "—"}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
          <p className="text-xs text-os-muted">
            Para pasar a control de calidad o validar, cada servicio necesita hallazgos con evidencia o una
            declaración escrita de por qué no los tiene.
          </p>
          {!bloqueada ? (
            <Desplegable titulo="Declarar cobertura de un servicio">
              <Formulario accion={coberturaAccion.bind(null, a.id)} boton="Guardar declaración">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Servicio">
                    <Select name="servicio">
                      {a.servicios.map((s) => <option key={s} value={s}>{s}</option>)}
                    </Select>
                  </Field>
                  <Field label="Declaración">
                    <Select name="estado">
                      <option value="ausencia_declarada">Ausencia declarada (no aplica o no hay nada)</option>
                      <option value="pendiente_justificado">Pendiente justificado (falta un acceso o dato)</option>
                    </Select>
                  </Field>
                </div>
                <Field label="Motivo">
                  <Textarea name="motivo" required placeholder="Por qué este servicio no tiene hallazgos con evidencia" />
                </Field>
              </Formulario>
            </Desplegable>
          ) : null}
        </div>
      ) : null}

      {pestaña === "historial" ? (
        <Card>
          <CardHeader title="Historial" />
          <ol className="divide-y divide-os-border">
            {eventos.map((e) => (
              <li key={e.id} className="flex gap-4 px-4 py-2.5 text-[13px]">
                <span className="os-num w-36 shrink-0 text-os-faint">{fmtDateTime(e.en)}</span>
                <span className="text-os-text">
                  {e.texto}
                  <span className="text-os-muted"> · {e.por}</span>
                </span>
              </li>
            ))}
          </ol>
        </Card>
      ) : null}
    </>
  );
}

function Dato({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-os-faint">{k}</dt>
      <dd className="mt-0.5 text-os-text">{v}</dd>
    </div>
  );
}

function Cifra({ n, k }: { n: number | string; k: string }) {
  return (
    <div className="flex items-baseline justify-between px-4 py-3">
      <dd className="os-num font-display text-xl font-semibold text-os-text">{n}</dd>
      <dt className="text-os-muted">{k}</dt>
    </div>
  );
}
