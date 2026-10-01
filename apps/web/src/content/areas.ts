import {
  TrendingUp,
  Workflow,
  FileStack,
  Activity,
  type LucideIcon,
} from "lucide-react";

export interface AreaCase {
  title: string;
  description: string;
}

export interface AreaBenefit {
  label: string;
  detail: string;
}

export interface Area {
  slug: string;
  index: string;
  name: string;
  eyebrow: string;
  tagline: string;
  intro: string;
  Icon: LucideIcon;
  image: string;
  cases: AreaCase[];
  benefits: AreaBenefit[];
}

export const AREAS: Area[] = [
  {
    slug: "revenue-operations",
    index: "01",
    name: "Revenue Operations",
    eyebrow: "Ingresos",
    tagline: "Desde la entrada de una oportunidad hasta el cierre y la facturación.",
    intro:
      "Intervenimos el sistema completo por el que una organización convierte una oportunidad en un ingreso cobrado. Donde el pipeline vive en correos, en hojas o en la cabeza de un comercial, restauramos control sobre el proceso de generación de ingresos.",
    Icon: TrendingUp,
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2970&auto=format&fit=crop",
    cases: [
      {
        title: "Pipeline fuera de control",
        description:
          "El estado real de cada oportunidad no está disponible para dirección sin pedirlo. Nadie opera sobre una visión completa del pipeline.",
      },
      {
        title: "Propuestas y presupuestos manuales",
        description:
          "Cada oferta se construye desde cero, se copia de otra, se envía por correo y se persigue para firmar. El ciclo depende del recuerdo.",
      },
      {
        title: "Comercial gestiona su propia administración",
        description:
          "El tiempo del equipo comercial se consume en rellenar sistemas, no en relación con el cliente. La estructura crece al ritmo de los ingresos.",
      },
      {
        title: "Ingresos sin visibilidad",
        description:
          "No se puede responder con criterio a cuánto se facturará, qué está parado ni dónde se pierde margen entre oportunidad y cobro.",
      },
      {
        title: "Handoff roto entre ventas y entrega",
        description:
          "Lo vendido y lo entregado no coinciden porque el traspaso depende de mensajes sueltos y de personas concretas.",
      },
      {
        title: "Cobro dependiente del recordatorio",
        description:
          "El ingreso no se cierra al firmar, sino cuando alguien recuerda perseguirlo. La tesorería se gestiona reactivamente.",
      },
    ],
    benefits: [
      {
        label: "Control sobre el ingreso",
        detail: "Dirección opera con visibilidad real del pipeline sin pedir informes.",
      },
      {
        label: "Ciclos más cortos",
        detail: "La fricción administrativa deja de estar dentro del ciclo comercial.",
      },
      {
        label: "Estructura sin depender de personas",
        detail: "El proceso sigue funcionando aunque cambie un comercial o un gestor.",
      },
    ],
  },
  {
    slug: "internal-operations",
    index: "02",
    name: "Internal Operations",
    eyebrow: "Operación",
    tagline: "Coordinación, asignación de trabajo, entregas, documentación y control.",
    intro:
      "Intervenimos la operativa interna por la que el trabajo se asigna, se ejecuta, se entrega y se controla. Donde cada nuevo encargo exige reunión, correo y recordatorio, construimos el sistema que sostiene la operación sin depender de la improvisación.",
    Icon: Workflow,
    image:
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2970&auto=format&fit=crop",
    cases: [
      {
        title: "El trabajo se asigna en reuniones",
        description:
          "Cada encargo requiere coordinación presencial para repartirlo. No existe un sistema de asignación: existe una conversación.",
      },
      {
        title: "Dependencia de una sola persona",
        description:
          "Una operación crítica descansa sobre el conocimiento de alguien concreto. Si esa persona falla, la operación se detiene.",
      },
      {
        title: "Información duplicada en varios sistemas",
        description:
          "El mismo dato se introduce en tres herramientas distintas. La versión correcta no es evidente y los errores se acumulan.",
      },
      {
        title: "Entregas sin trazabilidad",
        description:
          "No se puede reconstruir el estado real de un encargo sin preguntar. Lo entregado y lo comprometido no siempre coinciden.",
      },
      {
        title: "Documentación dispersa",
        description:
          "Los documentos viven en correos, en carpetas locales y en mensajería. El conocimiento de la operación no está documentado.",
      },
      {
        title: "Crecimiento sin sistema",
        description:
          "Cada nuevo cliente obliga a aumentar estructura casi al mismo ritmo. La operación no escala porque no está sistematizada.",
      },
    ],
    benefits: [
      {
        label: "Operación que no depende de personas",
        detail: "El sistema sigue ejecutándose aunque cambien los responsables.",
      },
      {
        label: "Visibilidad de la ejecución",
        detail: "El estado del trabajo está disponible sin perseguirlo por correo.",
      },
      {
        label: "Crecimiento sin proporcionalidad",
        detail: "Atender más volumen no exige sumar estructura al mismo ritmo.",
      },
    ],
  },
  {
    slug: "administrative-operations",
    index: "03",
    name: "Administrative Operations",
    eyebrow: "Administración",
    tagline: "Facturación, cobros, conciliación, aprobaciones y gestión documental.",
    intro:
      "Intervenimos la capa administrativa que sostiene el cumplimiento de la compañía. Donde el cierre, la facturación y los cobros se gestionan con hojas y recordatorios, restauramos gobierno sobre el flujo documental y financiero.",
    Icon: FileStack,
    image:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2970&auto=format&fit=crop",
    cases: [
      {
        title: "Cierre contable manual",
        description:
          "El cierre de periodo consume semanas de trabajo intensivo porque se reconstruye a mano cada vez, no porque sea complejo.",
      },
      {
        title: "Facturas procesadas una a una",
        description:
          "La entrada de facturas, albaranes y abonos depende de transcripción manual. El error no es excepción: es consecuencia del método.",
      },
      {
        title: "Aprobaciones por correo",
        description:
          "Las solicitudes se persiguen, se aprueban en cadena de mensajes y se registran después. La traza no existe mientras se ejecuta.",
      },
      {
        title: "Conciliación reactiva",
        description:
          "Los movimientos se cuadran tarde, cuando ya hay un problema. La detección de desviaciones llega después del impacto.",
      },
      {
        title: "Cobros gestionados por la memoria",
        description:
          "El seguimiento de impagados depende de quien recuerda insistir. La tesorería no está bajo control, está bajo costumbre.",
      },
      {
        title: "Cumplimiento documental costoso",
        description:
          "La preparación de auditorías, certificaciones y archivos consume un coste desproporcionado respecto al valor que aporta.",
      },
    ],
    benefits: [
      {
        label: "Cierre más rápido",
        detail: "El cierre deja de ser un evento intensivo y pasa a ser un estado del sistema.",
      },
      {
        label: "Trazabilidad total",
        detail: "Cada aprobación, factura y movimiento queda registrado en el momento.",
      },
      {
        label: "Detección temprana",
        detail: "Las desviaciones se ven antes de que se conviertan en un incidente.",
      },
    ],
  },
  {
    slug: "executive-intelligence",
    index: "04",
    name: "Executive Intelligence",
    eyebrow: "Dirección",
    tagline: "Información, alertas, desviaciones, previsiones y control para dirección.",
    intro:
      "Intervenimos el sistema por el que la dirección conoce qué ocurre en la organización. Donde entender el estado real del negocio exige varias reuniones, construimos el gobierno de información que permite decidir con criterio.",
    Icon: Activity,
    image:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2970&auto=format&fit=crop",
    cases: [
      {
        title: "Varias reuniones para entender el estado",
        description:
          "Comprender qué ocurre exige convocar, preguntar y reconstruir. La información no está disponible: se solicita.",
      },
      {
        title: "Decisiones con datos antiguos",
        description:
          "Los informes llegan con días o semanas de retraso. La decisión se toma sobre el pasado, no sobre la situación actual.",
      },
      {
        title: "Sin alertas sobre desviaciones",
        description:
          "La organización reacciona cuando el impacto ya se ha producido. No existen avisos sobre lo que se sale de patrón.",
      },
      {
        title: "Previsiones basadas en intuición",
        description:
          "Las previsiones se construyen sobre suposiciones optimistas, no sobre el comportamiento real del negocio.",
      },
      {
        title: "Dirección sin visibilidad de capacidad",
        description:
          "No se sabe con criterio cuánta carga soporta la operación, dónde está el cuello ni cuándo se romperá.",
      },
      {
        title: "Información fragmentada por departamento",
        description:
          "Cada área mantiene su versión de la realidad. La dirección integra manualmente lo que el sistema debería integrar.",
      },
    ],
    benefits: [
      {
        label: "Decisión con criterio",
        detail: "La dirección opera sobre la situación actual, no sobre reconstrucciones tardías.",
      },
      {
        label: "Alerta antes que reacción",
        detail: "Las desviaciones se detectan cuando aún se pueden corregir.",
      },
      {
        label: "Una sola versión de la operación",
        detail: "La información deja de ser territorio de cada departamento.",
      },
    ],
  },
];

export const getArea = (slug: string | undefined) =>
  AREAS.find((a) => a.slug === slug);
