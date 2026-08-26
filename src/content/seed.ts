/**
 * LOCAL CONTENT SEED — new strategic direction (briefing: "Evolución Web Valme").
 *
 * The live site normally reads every string from Sanity. This file mirrors the
 * exact shape of the Sanity `homePage` / `siteSettings` / `area` documents so the
 * whole site renders locally WITHOUT Sanity credentials. When
 * `NEXT_PUBLIC_SANITY_PROJECT_ID` + `_DATASET` are present, Sanity wins and this
 * file is ignored (see `sanity/env.ts` → `hasSanityConfig`).
 *
 * Tone (v2): NO "firma privada exclusiva / gatekeeper". SÍ acompañamiento a una
 * transformación operativa: adaptar la pyme a los tiempos, a la tecnología y a la
 * IA actuales, quitando procesos manuales, desordenados e ineficientes para que
 * compita de verdad. La dualidad Juan (GTM) / Jesús (tech) es el método.
 *
 * Casos de éxito (`caseDocs`): client-facing, prominentes y con página propia
 * (/casos/[slug]). Se describen por sector + tamaño, sin nombres reales y sin
 * afirmar por escrito que son "reales" (hoy son ilustrativos; se sustituyen por
 * clientes reales cuando los haya).
 */

import {AREAS} from './areas'

const ICON_BY_SLUG: Record<string, string> = {
  'revenue-operations': 'trending-up',
  'internal-operations': 'workflow',
  'administrative-operations': 'file-stack',
  'executive-intelligence': 'activity',
}

/* eslint-disable @typescript-eslint/no-explicit-any */

// ---------------------------------------------------------------------------
// HOME
// ---------------------------------------------------------------------------
export const homeSeed: any = {
  _id: 'homePage',

  hero: {
    eyebrow: 'Transformación operativa con IA · Pymes B2B',
    titleLine1: 'Analizamos tu problema.',
    titleLine2: 'Implementamos soluciones.',
    subtitle: 'Optimizamos procesos y acompañamos a tu equipo de principio a fin.',
    paragraph:
      'Has crecido a base de esfuerzo, y por el camino se han acumulado procesos manuales, desordenados y poco eficientes. No por falta de capacidad, sino de tiempo y de foco. Te acompañamos a transformar tu operativa en una más actual, automatizada y preparada para la IA, para que compitas de verdad.',
    primaryCta: {label: 'Solicitar diagnóstico', kind: 'whatsapp'},
    secondaryCta: {label: 'Ver casos de éxito', kind: 'section', href: 'casos'},
    mediaUrl: '/assets/ValmeSolutionsVideo.webm',
  },

  mission: {
    eyebrow: '/ Qué hacemos',
    heading: {
      lead: 'Adaptamos tu empresa',
      dim: 'a como se opera y se compite hoy.',
    },
    lead:
      'La tecnología para tener una operación ágil, ordenada y automatizada ya existe. Lo que suele faltar en una pyme que crece es tiempo y foco para implantarla. Ahí entramos: unimos estrategia comercial y tecnología (CRM, datos y automatización con IA) para que tu operativa deje de frenarte y empiece a impulsarte. No instalamos software: acompañamos una transformación.',
    // Mismos contenidos que la sección "Cómo trabajamos" (methodology.steps),
    // duplicados a propósito por decisión de negocio.
    principlesEyebrow: '/ Cómo lo hacemos',
    principles: [
      {
        id: '01',
        title: 'Diagnóstico',
        body: 'Auditamos cómo vendes, entregas y cobras hoy. Sacamos a la luz los procesos manuales, desordenados o ineficientes.',
      },
      {
        id: '02',
        title: 'Estrategia',
        body: 'Diseñamos el embudo comercial y el modelo operativo. Definimos qué debe hacer la tecnología para que vendas más.',
      },
      {
        id: '03',
        title: 'Construcción',
        body: 'Integramos CRM, bases de datos y automatización con IA. Convertimos la estrategia en una operación que funciona sola.',
      },
      {
        id: '04',
        title: 'Adopción',
        body: 'Formamos a tu equipo hasta que la nueva operativa es parte de su día a día. Sin resistencia y sin dependencia de nosotros.',
      },
    ],
  },

  // CASOS DE ÉXITO — sección destacada, alta en la página. (Ver `casesSection`
  // + `caseDocs`; se renderiza con el componente <Cases/>.)
  casesSection: {
    eyebrow: '/ Casos de éxito',
    heading: {lead: 'Empresas como la tuya,', dim: 'operando como se opera hoy.'},
    intro:
      'Tres transformaciones de operativa en pymes B2B: dónde estaban, qué cambiamos y en qué se tradujo. Puede que reconozcas la tuya.',
    cta: {label: 'Quiero una transformación así', kind: 'whatsapp'},
  },

  symptoms: {
    eyebrow: '/ ¿Te suena esto?',
    heading: {
      lead: 'Señales de que tu operativa',
      dim: 'se ha quedado atrás.',
    },
    items: [
      {
        label: 'El comercial imprescindible',
        statement: 'Si tu mejor comercial se va, se va también su cartera.',
        detail:
          'El pipeline vive en su cabeza y en su móvil. Nadie más sabe en qué punto está cada oportunidad y la empresa depende de una persona, no de un sistema.',
        solution:
          'Pasamos ese conocimiento a un CRM que el equipo usa de verdad: cada oportunidad queda registrada, visible y con seguimiento. El criterio deja de irse por la puerta.',
      },
      {
        label: 'Ventas a ciegas',
        statement: 'No sabes qué vas a facturar este mes hasta que ya ha pasado.',
        detail:
          'Las previsiones se basan en intuición. Los datos llegan tarde y repartidos en varios Excels, y decides mirando por el retrovisor.',
        solution:
          'Unificamos la información en un panel único y en tiempo real. Ves el mes según avanza, con alertas antes de que un desvío te cueste dinero.',
      },
      {
        label: 'Todo a mano',
        statement: 'Tu equipo dedica el día a tareas que un sistema haría solo.',
        detail:
          'Copiar datos de una herramienta a otra, perseguir aprobaciones por correo, rehacer el mismo informe cada semana. Horas que se van en trabajo que no aporta.',
        solution:
          'Automatizamos ese trasiego con integraciones e IA con criterio. Tu equipo suelta la tarea mecánica y recupera el tiempo para lo que sí importa.',
      },
      {
        label: 'El CEO sin visibilidad',
        statement: 'Para saber cómo va tu empresa tienes que convocar tres reuniones.',
        detail:
          'La información está fragmentada por departamento y por persona. No existe una única versión de la realidad y has perdido el control de tu propia operación.',
        solution:
          'Montamos un cuadro de mando para dirección con una sola fuente de datos. Abres el panel y sabes cómo va el negocio, sin convocar a nadie.',
      },
      {
        label: 'El miedo a contratar',
        statement: 'Creces, pero contratar estructura fija para apagar fuegos te aterra.',
        detail:
          'Cada nuevo cliente exige más gente para sostener el desorden. Sumar personas no arregla un problema de sistema: solo lo hace más caro.',
        solution:
          'Ordenamos y automatizamos la operativa para que absorba el crecimiento sin inflar la plantilla. Creces por sistema, no a base de contratar.',
      },
    ],
  },

  areasSection: {
    eyebrow: '/ Dónde intervenimos',
    heading: {
      lead: 'Cuatro frentes',
      dim: 'donde tu operación pierde tiempo y dinero.',
    },
    intro:
      'Son las cuatro capas por las que tu empresa vende, entrega, cobra y decide. En una pyme que ha crecido rápido casi siempre hay procesos manuales o desordenados escondidos en cada una. Ahí es donde la tecnología actual marca la diferencia.',
    closingEyebrow: '/ ¿Por dónde empezar?',
    closingHeading: 'Un diagnóstico de operación te dice qué arreglar primero.',
    closingCta: {label: 'Solicitar diagnóstico', kind: 'whatsapp'},
  },

  methodology: {
    eyebrow: '/ Cómo trabajamos',
    heading: {
      lead: 'Cómo transformamos',
      dim: 'tu operativa, paso a paso.',
    },
    lead: 'Un recorrido de cuatro fases que va del diagnóstico a que tu equipo lo use solo. Lo llamamos',
    leadMono: 'The Valme Mandate',
    steps: [
      {
        id: '01',
        name: 'Diagnóstico',
        description:
          'Auditamos cómo vendes, entregas y cobras hoy. Sacamos a la luz los procesos manuales, desordenados o ineficientes.',
      },
      {
        id: '02',
        name: 'Estrategia',
        description:
          'Diseñamos el embudo comercial y el modelo operativo. Definimos qué debe hacer la tecnología para que vendas más.',
      },
      {
        id: '03',
        name: 'Construcción',
        description:
          'Integramos CRM, bases de datos y automatización con IA. Convertimos la estrategia en una operación que funciona sola.',
      },
      {
        id: '04',
        name: 'Adopción',
        description:
          'Formamos a tu equipo hasta que la nueva operativa es parte de su día a día. Sin resistencia y sin dependencia de nosotros.',
      },
    ],
  },

  mandates: {
    eyebrow: '/ Modelos de colaboración',
    heading: {lead: 'Dos formas', dim: 'de trabajar con nosotros.'},
    lead: 'Empezamos acotado para demostrar valor. Escalamos cuando el sistema ya se sostiene solo.',
    footnote: 'No trabajamos por horas ni vendemos licencias.',
    plans: [
      {
        index: 'M/01',
        name: 'Intervención',
        variant: 'light',
        pitch:
          'Un proyecto acotado sobre el punto que más te frena hoy: pipeline, entregas, administración o control de dirección.',
        includes: [
          'Diagnóstico de operación',
          'Rediseño del proceso crítico',
          'Automatización e integración a medida',
          'Formación del equipo implicado',
        ],
        ctaLabel: 'Solicitar diagnóstico',
      },
      {
        index: 'M/02',
        name: 'Transformación continua',
        variant: 'dark',
        pitch:
          'Nos convertimos en el equipo de operaciones y tecnología que tu empresa no puede permitirse contratar en fijo. Evolucionamos tu operativa mes a mes.',
        includes: [
          'Todo lo de Intervención',
          'Evolución continua del sistema',
          'Panel de control para dirección',
          'Soporte y formación permanentes',
          'Sin ampliar tu plantilla',
        ],
        ctaLabel: 'Hablar con el equipo',
      },
    ],
  },

  admission: {
    eyebrow: '/ Con quién trabajamos',
    heading: 'Encajamos mejor con unas empresas que con otras.',
    intro:
      'No trabajamos con todo el mundo, y decirlo es lo justo. Con este perfil de empresa la transformación tiene mucho más impacto.',
    notAcceptedTitle: 'No encajamos si',
    notAccepted: [
      'Buscas la solución más barata',
      'Quieres a alguien que instale un software y desaparezca',
      'Tu empresa aún no tiene un modelo de negocio validado',
      'Esperas resultados sin implicar a tu equipo',
    ],
    acceptedTitle: 'Encajamos cuando',
    accepted: [
      'Eres B2B con más de 10 años y de 10 a 50 personas',
      'Vendes servicios o proyectos de ticket alto (>1.500 €)',
      'Has crecido y la operativa se te ha quedado pequeña',
      'Quieres competir con una operación actual, no otro parche',
    ],
  },

  contact: {
    eyebrow: '/ El primer paso',
    heading: 'Empieza por un diagnóstico de tu operación.',
    paragraph:
      'Una conversación para entender qué procesos te están frenando y qué se puede automatizar primero. Sin compromiso y sin tecnicismos.',
    cta: {label: 'Solicitar diagnóstico', kind: 'whatsapp'},
    footnote: 'Respondemos en menos de 24 horas laborables.',
  },

  seo: {
    title: 'Valme Solutions | Transformación operativa con IA para pymes B2B',
    description:
      'Te acompañamos a poner tu operativa al día: menos procesos manuales, más automatización e IA. Estrategia comercial y tecnología para pymes B2B, sin ampliar plantilla.',
  },
}

// ---------------------------------------------------------------------------
// CASOS DE ÉXITO
// ---------------------------------------------------------------------------
export const caseDocs: any[] = [
  {
    _id: 'club-tenis-alto-rendimiento',
    slug: 'club-tenis-alto-rendimiento',
    index: '01',
    image: '/assets/stock/case-tenis.jpg',
    galleryEyebrow: '/ El producto',
    galleryHeading: 'La herramienta que usan cada día.',
    galleryFit: 'contain',
    gallery: [
      '/assets/cases/tenis-movil.png',
      '/assets/cases/tenis-1.png',
      '/assets/cases/tenis-2.png',
    ],
    title: 'El fin del caos en un centro de tenis que no paraba de crecer',
    sector: 'Club de tenis · Alto rendimiento · Cientos de alumnos',
    summary:
      'El director deportivo dirigía el club desde una hoja de Excel. Construimos las aplicaciones, móvil y de escritorio, que ordenan pistas y evaluaciones, y le devolvieron su papel de director.',
    challenge:
      'Un club de tenis de alto rendimiento en pleno crecimiento: cientos de niños, jóvenes y adultos entrenando cada semana y un centro de tecnificación con decenas de jugadores, cada uno con su casuística. Encajarlos a todos en las pistas era un rompecabezas diario —horarios, entrenador asignado, preferencias, salidas a torneos, una lesión que arrastrar, un jugador invitado— que el director deportivo resolvía a mano, en un Excel, entre dos y tres horas cada mañana. Y cuando por fin cerraba las pistas, empezaba a perseguir a los entrenadores para reunir las evaluaciones de cada jugador y presentárselas a las familias como podía: tarde y sin una imagen a la altura del club.',
    intervention: [
      'Escuchamos al director deportivo y a los entrenadores, pista a pista',
      'Localizamos el origen real del caos: un crecimiento que la gestión manual ya no aguantaba',
      'Diseñamos y construimos un producto a medida, con app móvil y de escritorio',
      'Un rol para cada figura del club: dirección deportiva, entrenador y jugador',
      'Un motor de cuadrantes que respeta horarios, entrenadores, lesiones, torneos e invitados',
      'Evaluaciones en un par de toques, con aviso automático a las familias',
      'Acompañamos al club hasta que las aplicaciones fueron su forma natural de trabajar',
    ],
    result: [
      'Cuadrar todas las pistas pasó de dos o tres horas a cinco o diez minutos al día',
      'Cada evaluación se actualiza y se notifica en apenas dos minutos por jugador',
      'Las familias siguen la evolución de sus hijos al instante y con la imagen que el club merece',
      'El director deportivo vuelve a dirigir: su tiempo va a lo deportivo y lo estratégico',
      'El club sigue creciendo sin que la operativa se vuelva a desbordar',
    ],
  },
  {
    _id: 'publicidad-exterior',
    slug: 'publicidad-exterior',
    index: '02',
    image: '/assets/stock/case-publicidad.jpg',
    galleryEyebrow: '/ El producto',
    galleryHeading: 'La aplicación interna, por dentro.',
    galleryFit: 'contain',
    gallery: ['/assets/cases/publi-1.png', '/assets/cases/publi-2.png'],
    title: 'El fin del caos en un departamento de ventas que no paraba de crecer',
    sector: 'Publicidad exterior · Empresa familiar · +40 años',
    summary:
      'El jefe de ventas hacía de administrador de sus comerciales. Construimos una aplicación interna a medida que puso orden y le devolvió su capacidad de vender.',
    challenge:
      'Una empresa familiar de publicidad exterior con más de 40 años, que no paraba de crecer en ventas, clientes y operativa, pero con un departamento comercial desbordado. El jefe de ventas, socio de la empresa, tenía que estar encima de cada comercial, casi haciendo de su administración. Los comerciales trabajaban sin material preparado, sin información fiable del stock de espacios, sin visibilidad de los solapes con ventas de compañeros y sin criterio claro para presupuestar ni para gestionar la documentación que exige cerrar un acuerdo.',
    intervention: [
      'Entrevistamos al socio jefe de ventas y al equipo comercial del día a día',
      'Identificamos el caos real del proceso, de la oportunidad al cierre',
      'Diseñamos y construimos una aplicación interna a medida, por módulos',
      'Módulo de gestión de disponibilidades y stock de espacios',
      'Módulo de reservas y de documentación presupuestaria',
      'Módulo de documentación financiera y contractual para cerrar acuerdos',
      'Formamos al equipo hasta que la aplicación fue su forma normal de trabajar',
    ],
    result: [
      'El jefe de ventas dejó de hacer de administrador de sus comerciales',
      'El equipo vende con material, stock y presupuestos siempre a mano',
      'Se acabaron los solapes entre ventas de distintos comerciales',
      'Mejor trato al cliente: menos tiempos y más calidad en los entregables',
      'Acogen más oportunidades y gestionan más clientes con el mismo proceso',
    ],
  },
  {
    _id: 'trabajador-clave-ia',
    slug: 'trabajador-clave-ia',
    index: '03',
    image: '/assets/stock/case-ia.jpg',
    galleryEyebrow: '/ En contexto',
    galleryHeading: 'El sistema de trabajo asistido.',
    galleryFit: 'cover',
    gallery: ['/assets/stock/soft-code.jpg', '/assets/stock/working.jpg'],
    title: 'El trabajador clave que la IA no sustituyó, sino que potenció',
    sector: 'Pyme B2B · Un rol crítico · Conocimiento interno',
    summary:
      'Su trabajador de más experiencia se estaba quedando atrás frente a la IA. En vez de prescindir de él, construimos un sistema de trabajo asistido que multiplicó su valor.',
    challenge:
      'Tenían a un trabajador que conocía la operación como nadie: años de contexto, criterio y decisiones que no estaban escritas en ningún sitio. El problema no era su valía, sino su forma de trabajar. Se movía entre herramientas dispersas, repetía las mismas tareas manuales cada día y usaba la IA con inseguridad, a tientas. La empresa lo veía venir: si esa manera de operar no evolucionaba, la persona más valiosa acababa siendo también un cuello de botella. No querían sustituirlo ni recortar equipo; querían que diera el salto sin perder lo que lo hacía imprescindible.',
    intervention: [
      'Analizamos sus tareas reales, una a una, sin partir de la teoría',
      'Detectamos dónde la IA aporta sin poner en riesgo la calidad',
      'Construimos un copiloto interno para su día a día',
      'Preparamos guías y prompts controlados para trabajar con criterio',
      'Añadimos revisión humana y checklist de calidad en cada entrega',
      'Montamos un seguimiento para que dirección viera el avance',
      'Le acompañamos hasta que la IA fue una herramienta suya, no una amenaza',
    ],
    result: [
      'El trabajador no perdió valor: lo multiplicó',
      'Menos tareas repetitivas y más foco en lo que de verdad aporta',
      'Aprendió a usar la IA con criterio y seguridad',
      'La empresa conserva su conocimiento interno, sin transiciones bruscas',
      'IA para hacer crecer a las personas, no para prescindir de ellas',
    ],
  },
]

/** Card projection used by the home "Casos de éxito" section. */
export const caseCards: any[] = caseDocs.map((c) => ({
  _id: c._id,
  slug: c.slug,
  index: c.index,
  image: c.image,
  title: c.title,
  sector: c.sector,
  summary: c.summary,
  challenge: c.challenge,
  result: c.result,
}))

export const getCaseDoc = (slug?: string) => caseDocs.find((c) => c.slug === slug)

export const otherCases = (slug?: string) =>
  caseDocs
    .filter((c) => c.slug !== slug)
    .map((c) => ({_id: c._id, slug: c.slug, index: c.index, image: c.image, title: c.title, sector: c.sector}))

// ---------------------------------------------------------------------------
// SITE SETTINGS
// ---------------------------------------------------------------------------
export const settingsSeed: any = {
  _id: 'siteSettings',
  brandName: 'Valme',
  descriptor: 'Transformación operativa con IA',
  logo: null,
  whatsappNumber: '34600412492',
  whatsappMessage: 'Hola, me gustaría solicitar un diagnóstico de operación de mi empresa.',
  email: 'hola@valmesolutions.com',
  linkedinUrl: 'https://www.linkedin.com/company/valme-solutions',
  siteUrl: 'https://valmesolutions.com',
  navLinks: [
    {label: 'Qué hacemos', sectionId: 'tesis'},
    {label: 'Casos', sectionId: 'casos'},
    {label: 'Síntomas', sectionId: 'sintomas'},
    {label: 'Método', sectionId: 'mandato'},
    {label: 'Contacto', sectionId: 'contacto'},
  ],
  navCtaLabel: 'Solicitar diagnóstico',
  footerLegal:
    'Valme Solutions — Transformación operativa con IA para pymes B2B.\nEstrategia comercial, automatización e IA, y control para dirección.',
  footerColumns: [
    {
      title: 'Casos de éxito',
      links: [
        {label: 'Orden en un centro de tenis', href: '/casos/club-tenis-alto-rendimiento'},
        {label: 'Orden en publicidad exterior', href: '/casos/publicidad-exterior'},
        {label: 'Trabajador clave con IA', href: '/casos/trabajador-clave-ia'},
      ],
    },
    {
      title: 'Intervención',
      links: [
        {label: 'Revenue Operations', href: '/areas/revenue-operations'},
        {label: 'Internal Operations', href: '/areas/internal-operations'},
        {label: 'Administrative Operations', href: '/areas/administrative-operations'},
        {label: 'Executive Intelligence', href: '/areas/executive-intelligence'},
      ],
    },
    {
      title: 'Empresa',
      links: [
        {label: 'Qué hacemos', href: '/#tesis'},
        {label: 'Método', href: '/#mandato'},
        {label: 'Solicitar diagnóstico', href: '/#contacto'},
      ],
    },
  ],
  areaMandateEyebrow: '/ The Valme Mandate',
  areaMandateSteps: [
    {step: '01', title: 'Diagnóstico', body: 'Auditamos cómo funciona hoy esta capa de tu operación.'},
    {step: '02', title: 'Estrategia', body: 'Definimos qué debe hacer la tecnología para que vendas y entregues mejor.'},
    {step: '03', title: 'Construcción', body: 'Integramos herramientas y automatización a medida.'},
    {step: '04', title: 'Adopción', body: 'Formamos al equipo hasta que lo usa sin esfuerzo.'},
  ],
  areaScenariosNote:
    'Los siguientes escenarios son situaciones que encontramos habitualmente en empresas B2B como la tuya. Describen el tipo de problema en el que intervenimos.',
  defaultSeo: {
    title: 'Valme Solutions | Transformación operativa con IA para pymes B2B',
    description:
      'Te acompañamos a poner tu operativa al día: menos procesos manuales, más automatización e IA, sin ampliar plantilla.',
  },
}

// ---------------------------------------------------------------------------
// AREAS (reuse the existing concrete copy in ./areas.ts)
// ---------------------------------------------------------------------------
export const areaDocs: any[] = AREAS.map((a, i) => ({
  _id: a.slug,
  name: a.name,
  slug: a.slug,
  index: a.index,
  orderRank: i + 1,
  eyebrow: a.eyebrow,
  icon: ICON_BY_SLUG[a.slug] ?? 'activity',
  tagline: a.tagline,
  intro: a.intro,
  image: null,
  cases: a.cases,
  benefits: a.benefits,
}))

/** Card projection used by the home "Intervención" grid. */
export const areasSeed: any[] = areaDocs.map((a) => ({
  _id: a._id,
  name: a.name,
  slug: a.slug,
  index: a.index,
  eyebrow: a.eyebrow,
  icon: a.icon,
  tagline: a.tagline,
}))

export const getAreaDoc = (slug?: string) => areaDocs.find((a) => a.slug === slug)

export const otherAreas = (slug?: string) =>
  areaDocs
    .filter((a) => a.slug !== slug)
    .map((a) => ({_id: a._id, name: a.name, slug: a.slug, index: a.index}))
