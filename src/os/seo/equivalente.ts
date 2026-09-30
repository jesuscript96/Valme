import "server-only";
import { redirect } from "next/navigation";
import type { seoModulo } from "./index";

type Modulo = Awaited<ReturnType<typeof seoModulo>>;

const masReciente = <T,>(xs: T[], fecha: (x: T) => string) =>
  [...xs].sort((a, b) => fecha(b).localeCompare(fecha(a)))[0];

/**
 * LA MISMA PANTALLA, DEL CLIENTE ACTIVO.
 *
 * El cliente solo se elige arriba, en el menú principal. Si hay uno activo y la pantalla
 * de detalle que se está viendo es de otro (porque se acaba de cambiar), se va a la misma
 * pantalla del activo: su ficha, su plan, su último informe… y, si no tiene, a la lista.
 * Con «Todos los clientes» no hace nada. Solo navega: el acceso lo sigue comprobando cada
 * página con `seoModulo()`.
 */
export const alClienteActivo = {
  ficha(seo: Modulo, clientId: string, tab?: string) {
    if (seo.filtro && seo.filtro.id !== clientId) {
      redirect(`/app/seo/clientes/${seo.filtro.id}${tab ? `?tab=${encodeURIComponent(tab)}` : ""}`);
    }
  },
  plan(seo: Modulo, clientId: string) {
    if (!seo.filtro || seo.filtro.id === clientId) return;
    const e = seo.encargos[0];
    redirect(e ? `/app/seo/plan/${e.id}` : "/app/seo/plan");
  },
  alta(seo: Modulo, clientId: string | null) {
    if (!seo.filtro || seo.filtro.id === clientId) return;
    const a = seo.altas.find((x) => x.clientId === seo.filtro!.id);
    redirect(a ? `/app/seo/onboarding/${a.id}` : "/app/seo/onboarding");
  },
  auditoria(seo: Modulo, clientId: string, tab?: string) {
    if (!seo.filtro || seo.filtro.id === clientId) return;
    const a = masReciente(seo.auditorias.filter((x) => !x.archivadaEn), (x) => x.creadaEn);
    redirect(a ? `/app/seo/auditorias/${a.id}${tab ? `?tab=${encodeURIComponent(tab)}` : ""}` : "/app/seo/auditorias");
  },
  informe(seo: Modulo, clientId: string) {
    if (!seo.filtro || seo.filtro.id === clientId) return;
    const i = masReciente(seo.informes, (x) => x.creadoEn);
    redirect(i ? `/app/seo/informes/${i.id}` : "/app/seo/informes");
  },
};
