"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type FocusEvent } from "react";
import {
  Building2, ClipboardCheck, Contact, Handshake, Home, Inbox, Megaphone, Menu, Palette,
  PanelLeftClose, Pin, Plug, Search, X, type LucideIcon,
} from "lucide-react";
import { elegirClienteActivo } from "@/os/tenancy/actions";
import { AREAS, ESPACIOS, areaDe, destinoAlCambiar, slugDeRuta, type Area, type Icono } from "./navegacion";
import { SelectorCliente, type ClienteMenu } from "./SelectorCliente";
import { UserMenu } from "./UserMenu";
import { cx } from "./primitives";

const ICONOS: Record<Icono, LucideIcon> = {
  inicio: Home, marca: Palette, paid: Megaphone, seo: Search, crm: Contact,
  integraciones: Plug, leads: Inbox, auditorias: ClipboardCheck,
};

const ICONO_ESPACIO = { ventas: Handshake, clientes: Building2 } as const;

/**
 * MENÚ PRINCIPAL.
 *
 * Arriba el espacio (Ventas o Clientes) y, en Clientes, el cliente activo; debajo las
 * áreas. En Inicio va abierto; en un área con menú propio se pliega a iconos para dejar
 * sitio al menú secundario. Plegado, se despliega por encima del contenido al pasar el
 * ratón (o al llegar con el teclado) y se vuelve a plegar al salir; el botón de abajo lo
 * deja abierto. En pantallas estrechas es un cajón que se abre desde la barra de arriba.
 *
 * El cliente activo sale de la URL cuando la ruta es de un cliente, y si no, del último
 * elegido (la misma cookie que lee SEO). El layout no se vuelve a pintar al navegar, así
 * que el último cliente visto se recuerda aquí también.
 */
export function MenuPrincipal({
  user, clientes, activoInicial,
}: {
  user: { name: string; email: string; role: string; isAdmin: boolean };
  clientes: ClienteMenu[];
  activoInicial: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const area = areaDe(pathname);
  const slugUrl = slugDeRuta(pathname);

  const [activo, setActivo] = useState(activoInicial);
  const [desplegado, setDesplegado] = useState(false);
  const [cajon, setCajon] = useState(false);
  const [asomado, setAsomado] = useState(false);
  const [ocupado, empezar] = useTransition();

  // Un pequeño retardo al entrar y al salir, para que cruzar el menú con el ratón camino
  // del contenido no lo haga parpadear.
  const reloj = useRef<ReturnType<typeof setTimeout> | null>(null);
  const asomar = (valor: boolean, ms: number) => {
    if (reloj.current) clearTimeout(reloj.current);
    reloj.current = setTimeout(() => setAsomado(valor), ms);
  };
  useEffect(() => () => {
    if (reloj.current) clearTimeout(reloj.current);
  }, []);
  const alSalirFoco = (e: FocusEvent<HTMLElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) asomar(false, 0);
  };

  // Ajustes de estado cuando cambian la ruta o lo que manda el servidor.
  const [rutaVista, setRutaVista] = useState(pathname);
  if (rutaVista !== pathname) {
    setRutaVista(pathname);
    setDesplegado(false);
    setCajon(false);
    setAsomado(false);
    if (slugUrl && slugUrl !== activo) setActivo(slugUrl);
  }
  const [inicialVisto, setInicialVisto] = useState(activoInicial);
  if (inicialVisto !== activoInicial) {
    setInicialVisto(activoInicial);
    setActivo(activoInicial);
  }

  const slug = slugUrl ?? activo;
  const cliente = clientes.find((c) => c.slug === slug) ?? null;
  /** Ocupa solo el ancho de los iconos. */
  const plegado = area.conMenu && !desplegado;
  /** Se pinta solo con iconos: plegado y sin el ratón encima. */
  const compacto = plegado && !asomado;

  function elegir(nuevo: string | null) {
    setActivo(nuevo);
    const destino = destinoAlCambiar(pathname, nuevo);
    empezar(async () => {
      await elegirClienteActivo(nuevo ?? "");
      if (destino !== pathname) router.push(destino);
    });
  }

  const visibles = AREAS.filter((a) => a.espacio === area.espacio && (!a.soloAdmin || user.isAdmin));
  const arriba = visibles.filter((a) => !a.soloAdmin);
  const abajo = visibles.filter((a) => a.soloAdmin);

  const entrada = (a: Area, compacto: boolean) => {
    const Icono = ICONOS[a.icono];
    const actual = a.clave === area.clave;
    return (
      <Link
        key={a.clave}
        href={a.href(cliente?.slug ?? null)}
        aria-current={actual ? "page" : undefined}
        aria-label={compacto ? a.nombre : undefined}
        className={cx(
          "group relative flex items-center rounded-md text-[13px] transition-colors",
          compacto ? "size-9 justify-center" : "gap-2.5 px-2.5 py-1.5",
          actual
            ? "bg-os-sunken font-medium text-os-text"
            : "text-os-muted hover:bg-os-sunken hover:text-os-text",
        )}
      >
        <Icono className={cx("size-4 shrink-0", actual && "text-os-accent")} aria-hidden />
        {compacto ? null : <span className="min-w-0 flex-1 truncate">{a.nombre}</span>}
      </Link>
    );
  };

  const cuerpo = (compacto: boolean) => (
    <>
      <Link
        href={ESPACIOS.find((e) => e.clave === area.espacio)!.href}
        className={cx(
          "font-display text-[15px] font-semibold tracking-tight text-os-text",
          compacto ? "flex size-9 items-center justify-center" : "px-1",
        )}
        aria-label={compacto ? "Valme OS" : undefined}
      >
        {compacto ? <span className="text-os-accent">V</span> : <>Valme <span className="text-os-accent">OS</span></>}
      </Link>

      <nav
        aria-label="Espacio"
        className={cx(compacto ? "flex flex-col gap-1" : "grid grid-cols-2 gap-0.5 rounded-md bg-os-sunken p-0.5")}
      >
        {ESPACIOS.map((e) => {
          const Icono = ICONO_ESPACIO[e.clave];
          const actual = e.clave === area.espacio;
          return (
            <Link
              key={e.clave}
              href={e.href}
              aria-current={actual ? "page" : undefined}
              aria-label={compacto ? e.nombre : undefined}
              className={cx(
                "group relative flex items-center justify-center rounded text-[12px] font-medium transition-colors",
                compacto ? "size-9" : "gap-1.5 py-1.5",
                actual
                  ? compacto ? "bg-os-text text-white" : "bg-os-surface text-os-text shadow-sm"
                  : "text-os-muted hover:text-os-text",
              )}
            >
              <Icono className="size-3.5 shrink-0" aria-hidden />
              {compacto ? null : e.nombre}
            </Link>
          );
        })}
      </nav>

      {area.espacio === "clientes" ? (
        <SelectorCliente
          clientes={clientes}
          activo={cliente}
          plegado={compacto}
          puedeCrear={user.isAdmin}
          ocupado={ocupado}
          onElegir={elegir}
        />
      ) : null}

      <nav aria-label="Áreas" className={cx("min-h-0 flex-1 space-y-0.5", !compacto && "overflow-y-auto")}>
        {arriba.map((a) => entrada(a, compacto))}
      </nav>

      {abajo.length ? <div className="space-y-0.5">{abajo.map((a) => entrada(a, compacto))}</div> : null}

      {area.conMenu && !compacto ? (
        <button
          type="button"
          onClick={() => {
            setDesplegado((v) => !v);
            setAsomado(false);
          }}
          className="hidden items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] text-os-muted hover:bg-os-sunken hover:text-os-text md:flex"
        >
          {desplegado ? <PanelLeftClose className="size-4" aria-hidden /> : <Pin className="size-4" aria-hidden />}
          {desplegado ? "Plegar el menú" : "Dejar abierto"}
        </button>
      ) : null}

      <div className="border-t border-os-border pt-2">
        <UserMenu name={user.name} email={user.email} role={user.role} plegado={compacto} />
      </div>
    </>
  );

  return (
    <>
      {/* Pantallas estrechas: barra arriba y el menú como cajón. */}
      <header className="sticky top-0 z-40 flex h-12 items-center gap-3 border-b border-os-border bg-os-surface px-4 md:hidden">
        <button
          type="button"
          onClick={() => setCajon(true)}
          aria-label="Abrir el menú"
          aria-expanded={cajon}
          className="-ml-1.5 rounded-md p-1.5 text-os-muted hover:bg-os-sunken hover:text-os-text"
        >
          <Menu className="size-5" aria-hidden />
        </button>
        <span className="min-w-0 truncate text-[13px]">
          <span className="font-medium text-os-text">{area.nombre}</span>
          {area.espacio === "clientes" ? (
            <span className="text-os-faint"> · {cliente?.name ?? "Todos los clientes"}</span>
          ) : null}
        </span>
      </header>

      {cajon ? (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal aria-label="Menú">
          <button
            type="button"
            aria-label="Cerrar el menú"
            onClick={() => setCajon(false)}
            className="absolute inset-0 bg-black/20"
          />
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col gap-4 border-r border-os-border bg-os-surface px-3 py-4 shadow-xl">
            <button
              type="button"
              onClick={() => setCajon(false)}
              aria-label="Cerrar el menú"
              className="absolute right-3 top-3 rounded-md p-1 text-os-muted hover:bg-os-sunken"
            >
              <X className="size-4" aria-hidden />
            </button>
            {cuerpo(false)}
          </aside>
        </div>
      ) : null}

      {/* El hueco reserva solo el ancho plegado; el menú se despliega por encima. */}
      <div className={cx("sticky top-0 z-30 hidden h-dvh shrink-0 md:block", plegado ? "w-14" : "w-60")}>
        <aside
          onMouseEnter={plegado ? () => asomar(true, 120) : undefined}
          onMouseLeave={plegado ? () => asomar(false, 180) : undefined}
          onFocus={plegado ? () => asomar(true, 0) : undefined}
          onBlur={plegado ? alSalirFoco : undefined}
          className={cx(
            "absolute inset-y-0 left-0 flex flex-col gap-4 border-r border-os-border bg-os-surface py-4 transition-[width,box-shadow] duration-150",
            compacto ? "w-14 px-2.5" : "w-60 px-3",
            plegado && !compacto && "shadow-xl",
          )}
        >
          {cuerpo(compacto)}
        </aside>
      </div>
    </>
  );
}
