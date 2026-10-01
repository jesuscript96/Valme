import { requireMember } from "@valme/os/auth/dal";
import { CAPACIDAD_AGENTE } from "@valme/os/seo/operacion/panel";
import { ESTADO_LABEL, ESTADOS } from "@valme/os/seo/tipos";
import { Estado } from "@valme/os/seo/ui/etiquetas";
import { Card, CardHeader, PageHeader } from "@valme/os/ui/primitives";

export const metadata = { title: "Configuración · SEO · Valme OS" };

const ESTADOS_SISTEMA = [
  "Funcionamiento normal", "Aprobación pendiente", "Agente trabajando", "Acción completada", "Bloqueo",
  "Riesgo", "Error", "Datos insuficientes", "Cliente en onboarding", "Revisión humana en curso",
];

/** Gobierno del servicio: las reglas que aplica el módulo, a la vista. */
export default async function Configuracion() {
  await requireMember();
  return (
    <>
      <PageHeader title="Configuración" description="Reglas de gobierno del servicio SEO. Son las que aplican las herramientas del módulo." />
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Autonomía supervisada" />
          <div className="space-y-2 px-4 py-4 text-[13px]">
            <p><span className="font-medium">Permitido:</span> analizar, planificar, preparar borradores y ejecutar comprobaciones dentro del alcance autorizado.</p>
            <p><span className="font-medium">Revisión obligatoria:</span> publicar, enviar comunicaciones, eliminar, cambiar permisos o presupuestos.</p>
            <p className="text-xs text-os-muted">Autorizar una auditoría permite recoger evidencias; no autoriza cambios en la web, publicaciones, comunicaciones, gasto ni la ejecución de planes.</p>
          </div>
        </Card>
        <Card>
          <CardHeader title="Capacidad y compromisos" />
          <dl className="grid gap-x-6 gap-y-3 px-4 py-4 text-[13px] sm:grid-cols-2">
            {[
              ["Techo propuesto", "100 clientes"],
              ["Responsable final", "Project Manager (admin o estratega)"],
              ["Capacidad por especialidad", `${CAPACIDAD_AGENTE} elementos abiertos`],
              ["Registro", "Cliente, agente, estado, evidencia y decisión"],
            ].map(([k, v]) => <div key={k}><dt className="text-[11px] uppercase text-os-faint">{k}</dt><dd>{v}</dd></div>)}
          </dl>
        </Card>
      </div>
      <Card className="mb-6">
        <CardHeader title="Estados del sistema" />
        <div className="flex flex-wrap gap-2 px-4 py-4">{ESTADOS_SISTEMA.map((s) => <Estado key={s} t={s} />)}</div>
      </Card>
      <Card>
        <CardHeader title="Estados de una auditoría" />
        <div className="flex flex-wrap gap-2 px-4 py-4">{ESTADOS.map((s) => <Estado key={s} t={ESTADO_LABEL[s]} />)}</div>
      </Card>
    </>
  );
}
