"use client";

import { useState, useTransition } from "react";
import { leerPaginasAccion } from "../acciones";
import {
  avisos, escribirPaginas, generarJsonLd, generarLlmsTxt, leerPaginas, type DatosEmpresa, type TipoEntidad,
} from "../generadores";
import { Button, Card, CardHeader, Field, Input, Select, Textarea } from "@valme/os/ui/primitives";

type Inicial = Omit<DatosEmpresa, "paginas" | "servicios" | "perfiles"> & {
  servicios: string;
  perfiles: string;
  paginas: string;
};

/** Genera llms.txt y JSON-LD mientras se escribe. Nada se publica: se copia y se sube a la web. */
export function Generador({ proyectoId, inicial }: { proyectoId: string; inicial: Inicial }) {
  const [v, setV] = useState(inicial);
  const [tipo, setTipo] = useState<TipoEntidad>("ProfessionalService");
  const [leyendo, empezar] = useTransition();
  const [aviso, setAviso] = useState<string | null>(null);

  const datos: DatosEmpresa = {
    ...v,
    servicios: v.servicios.split(/[,\n]/),
    perfiles: v.perfiles.split(/\s*\n\s*/),
    paginas: leerPaginas(v.paginas),
  };
  const llms = generarLlmsTxt(datos);
  const jsonld = generarJsonLd(datos, tipo);
  const campo = (k: keyof Inicial) => ({
    value: v[k],
    onChange: (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value }),
  });

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card className="space-y-3 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nombre"><Input {...campo("nombre")} /></Field>
          <Field label="Web"><Input {...campo("url")} placeholder="https://www.ejemplo.com" /></Field>
        </div>
        <Field label="Qué hace la empresa" hint="Una o dos frases, sin eslóganes: es lo primero que lee un asistente.">
          <Textarea {...campo("descripcion")} className="min-h-16" />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Servicios (separados por comas)"><Input {...campo("servicios")} /></Field>
          <Field label="Zona de trabajo"><Input {...campo("zona")} placeholder="España, Madrid…" /></Field>
          <Field label="Teléfono"><Input {...campo("telefono")} /></Field>
          <Field label="Email"><Input {...campo("email")} /></Field>
          <Field label="Logo (URL)"><Input {...campo("logo")} /></Field>
          <Field label="Tipo de entidad">
            <Select value={tipo} onChange={(e) => setTipo(e.target.value as TipoEntidad)}>
              <option value="ProfessionalService">Servicio profesional</option>
              <option value="LocalBusiness">Negocio local (con sede)</option>
              <option value="Organization">Organización</option>
            </Select>
          </Field>
        </div>
        <Field label="Perfiles (uno por línea)"><Textarea {...campo("perfiles")} className="min-h-14" placeholder="https://www.linkedin.com/company/…" /></Field>
        <Field label="Páginas clave (una por línea: Título | URL | descripción)">
          <Textarea {...campo("paginas")} className="min-h-32 font-mono text-[12px]" />
        </Field>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            size="sm"
            disabled={leyendo}
            onClick={() =>
              empezar(async () => {
                setAviso(null);
                const r = await leerPaginasAccion(proyectoId);
                if (!r.ok) return setAviso(r.error);
                setV((x) => ({ ...x, paginas: escribirPaginas(r.paginas) }));
                setAviso(`${r.paginas.length} páginas leídas del sitio. Revisa las descripciones antes de publicar.`);
              })
            }
          >
            {leyendo ? "Leyendo el sitio…" : "Leer páginas del sitio"}
          </Button>
          {aviso ? <span className="text-[12px] text-os-muted">{aviso}</span> : null}
        </div>
        {avisos(datos).length ? (
          <ul className="list-disc space-y-0.5 pl-5 text-xs text-os-warn">{avisos(datos).map((a) => <li key={a}>{a}</li>)}</ul>
        ) : null}
      </Card>

      <div className="space-y-6">
        <Salida titulo="llms.txt" nota="Se publica en la raíz: /llms.txt" texto={llms} />
        <Salida titulo="Datos estructurados (JSON-LD)" nota="Va en el <head> de la home" texto={jsonld} />
      </div>
    </div>
  );
}

function Salida({ titulo, nota, texto }: { titulo: string; nota: string; texto: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <Card>
      <CardHeader
        title={titulo}
        action={
          <Button
            type="button"
            size="sm"
            onClick={async () => {
              await navigator.clipboard.writeText(texto);
              setCopiado(true);
              setTimeout(() => setCopiado(false), 1500);
            }}
          >
            {copiado ? "Copiado" : "Copiar"}
          </Button>
        }
      />
      <pre className="max-h-96 overflow-auto whitespace-pre-wrap px-4 py-3 font-mono text-[12px] leading-relaxed text-os-text">{texto}</pre>
      <p className="border-t border-os-border px-4 py-2 text-xs text-os-muted">{nota}. Desde aquí no se publica nada.</p>
    </Card>
  );
}
