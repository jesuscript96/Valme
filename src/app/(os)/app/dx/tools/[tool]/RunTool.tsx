"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertTriangle, KeyRound, Play } from "lucide-react";
import { Badge, Button, Card, CardHeader, cx, Input } from "@/os/ui/primitives";
import { FUNCIONES, type Auditoria, type Gravedad } from "@/os/audit/types";
import type { Herramienta } from "@/os/audit/tools";
import { ejecutar, type EstadoEjecucion } from "./actions";
import { Embudo } from "./Embudo";
import { COMPROBACIONES } from "@/os/audit/web-checks";
import { PASOS, type Paso } from "@/os/audit/types";

const TONO: Record<Gravedad, "accent" | "warn" | "neutral"> = {
  p0: "accent", p1: "accent", p2: "warn", p3: "neutral",
};

function Lanzar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? "Auditando…" : <><Play className="size-3.5" aria-hidden /> Auditar</>}
    </Button>
  );
}

/** Mientras corre: se dice cuánto tarda y por qué, que es mejor que una ruleta girando. */
function Esperando() {
  const { pending } = useFormStatus();
  if (!pending) return null;
  return (
    <Card className="mt-4 p-4">
      <p className="text-[13px] font-medium text-os-text">Cargando la página con un navegador…</p>
      <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-os-muted">
        Tarda entre veinte y cuarenta segundos. La mayor parte es esperar a que se ejecute
        todo lo que la web inyecta después de cargar: es lo único que distingue lo que está
        instalado de verdad de lo que solo aparece escrito en el código.
      </p>
    </Card>
  );
}

export function RunTool({
  tool, dominioInicial, faltan,
}: {
  tool: Herramienta["clave"];
  dominioInicial: string;
  faltan: string[];
}) {
  const [estado, accion] = useActionState<EstadoEjecucion, FormData>(ejecutar, { fase: "vacio" });

  return (
    <div className="space-y-4">
      <form action={accion}>
        <input type="hidden" name="tool" value={tool} />
        <Card className="flex flex-wrap items-end gap-3 p-4">
          <label className="min-w-0 flex-1">
            <span className="mb-1.5 block text-[13px] font-medium text-os-text">Dominio</span>
            <Input
              name="dominio"
              defaultValue={dominioInicial}
              placeholder="ejemplo.es"
              required
              autoFocus={!dominioInicial}
            />
          </label>
          <Lanzar />
        </Card>
        <Esperando />
      </form>

      {faltan.length > 0 ? (
        <Card className="flex items-start gap-3 border-os-warn/30 bg-os-warn-soft p-4">
          <KeyRound className="mt-0.5 size-4 shrink-0 text-os-warn" aria-hidden />
          <div>
            <p className="text-[13px] font-medium text-os-warn">
              La auditoría funciona, pero incompleta
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-os-warn">
              Sin estas variables faltan fuentes. Lo que no se pueda comprobar aparecerá
              declarado en el informe, no se dará por bueno:{" "}
              <span className="font-mono text-[12px]">{faltan.join(", ")}</span>
            </p>
          </div>
        </Card>
      ) : null}

      {estado.fase === "error" ? (
        <Card className="bg-os-accent-soft p-4">
          <p role="alert" className="text-[13px] text-os-accent">{estado.mensaje}</p>
        </Card>
      ) : null}

      {estado.fase === "hecho"
        ? tool === "web"
          ? <Embudo a={estado.resultado} comprobaciones={estado.comprobaciones} />
          : <Resultado a={estado.resultado} />
        : null}

      {/* Antes de ejecutar, el alcance. Delante de un cliente, enseñar lo que se va a
          mirar cambia la conversación: se discute lo mirado, no si se miró poco. */}
      {estado.fase !== "hecho" && tool === "web" ? <Alcance /> : null}
    </div>
  );
}

function Resultado({ a }: { a: Auditoria }) {
  const positivos = a.hallazgos.filter((h) => h.positivo);
  const problemas = a.hallazgos.filter((h) => !h.positivo);

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center gap-x-8 gap-y-3 p-4">
        {[
          ["Dominio", a.dominio],
          ["Señales", String(a.señales.length)],
          ["Hallazgos", String(problemas.length)],
          ["Tiempo", `${(a.duracionMs / 1000).toFixed(1)} s`],
        ].map(([k, v]) => (
          <div key={k}>
            <p className="text-[11px] uppercase tracking-wide text-os-faint">{k}</p>
            <p className="os-num mt-0.5 font-display text-[17px] font-semibold text-os-text">{v}</p>
          </div>
        ))}
      </Card>

      {positivos.length > 0 ? (
        <Card>
          <CardHeader title="Lo que funciona" />
          <ul className="divide-y divide-os-border">
            {positivos.map((h) => (
              <li key={h.id} className="px-4 py-3">
                <p className="text-[13px] font-medium text-os-ok">{h.titulo}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-os-muted">{h.consecuencia}</p>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card>
        <CardHeader title={`Hallazgos (${problemas.length})`} />
        {problemas.length === 0 ? (
          <p className="px-4 py-8 text-center text-[13px] text-os-muted">
            Nada que señalar con lo que se ha podido comprobar.
          </p>
        ) : (
          <ul className="divide-y divide-os-border">
            {problemas.map((h) => (
              <li key={h.id} className="px-4 py-3.5">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge tone={TONO[h.gravedad]}>{h.gravedad.toUpperCase()}</Badge>
                  <span className="text-[13px] font-semibold text-os-text">{h.titulo}</span>
                  <span className="text-[11px] text-os-faint">{FUNCIONES[h.funcion].nombre}</span>
                </div>
                <dl className="space-y-1 text-[13px] leading-relaxed">
                  {([["Situación", h.situacion], ["Consecuencia", h.consecuencia], ["Solución", h.solucion]] as const)
                    .map(([k, v]) => (
                      <div key={k} className="grid grid-cols-[92px_minmax(0,1fr)] gap-2">
                        <dt className="text-[12px] text-os-faint">{k}</dt>
                        <dd className="min-w-0 text-os-text">{v}</dd>
                      </div>
                    ))}
                </dl>
                <p className="mt-2 font-mono text-[11px] text-os-faint">
                  evidencia: {h.evidencia.join(", ")} · confianza {h.confianza}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Cobertura" />
          <ul className="divide-y divide-os-border">
            {a.cobertura.filter((c) => c.verificadas + c.pendientes > 0).map((c) => (
              <li key={c.funcion} className="flex items-center gap-3 px-4 py-2.5">
                <span className="min-w-0 flex-1 text-[13px]">{FUNCIONES[c.funcion].nombre}</span>
                <span className="h-1.5 w-24 overflow-hidden rounded-full bg-os-sunken">
                  <span
                    className={cx("block h-full", c.pct === 100 ? "bg-os-ok" : "bg-os-warn")}
                    style={{ width: `${c.pct}%` }}
                  />
                </span>
                <span className="os-num w-10 text-right text-[12px] text-os-muted">{c.pct}%</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Fuentes no disponibles" />
          {a.fuentesNoDisponibles.length === 0 ? (
            <p className="px-4 py-6 text-center text-[13px] text-os-muted">
              Se ha podido consultar todo.
            </p>
          ) : (
            <ul className="divide-y divide-os-border">
              {a.fuentesNoDisponibles.map((f) => (
                <li key={f.fuente} className="flex items-start gap-2.5 px-4 py-2.5">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-os-warn" aria-hidden />
                  <span>
                    <span className="block text-[13px] font-medium text-os-text">{f.fuente}</span>
                    <span className="block text-[12px] leading-relaxed text-os-muted">{f.motivo}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

/** Las 52 comprobaciones de la auditoría Web, agrupadas por paso del embudo. */
function Alcance() {
  return (
    <Card>
      <CardHeader
        title="Qué se audita"
        action={<span className="text-[12px] text-os-faint">{COMPROBACIONES.length} comprobaciones</span>}
      />
      <div className="divide-y divide-os-border">
        {(Object.keys(PASOS) as Paso[]).map((clave) => {
          const del = COMPROBACIONES.filter((c) => c.paso === clave);
          const p = PASOS[clave];
          return (
            <div key={clave} className="px-4 py-3">
              <p className="mb-2 flex items-baseline gap-2">
                <span className="os-num text-[12px] font-semibold text-os-accent">{p.n}</span>
                <span className="text-[13px] font-semibold text-os-text">{p.titulo}</span>
                <span className="text-[12px] text-os-muted">{p.desc}</span>
                <span className="os-num ml-auto text-[11px] text-os-faint">{del.length}</span>
              </p>
              <ul className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
                {del.map((c) => (
                  <li key={c.señal} className="flex items-start gap-2 text-[12px] text-os-muted">
                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-os-border-strong" />
                    <span>
                      {c.que}
                      {c.necesita ? (
                        <span className="ml-1.5 font-mono text-[10px] text-os-warn">
                          necesita {c.necesita}
                        </span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
