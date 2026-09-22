/**
 * LOCAL CONTENT SEED — new strategic direction (briefing: "Evolución Web Valme").
 *
 * The live site normally reads every string from Sanity. This file mirrors the
 * exact shape of the Sanity `homePage` / `siteSettings` / `area` documents so the
 * whole site renders locally WITHOUT Sanity credentials. When
 * `NEXT_PUBLIC_SANITY_PROJECT_ID` + `_DATASET` are present, Sanity wins and this
 * file is ignored (see `sanity/env.ts` → `hasSanityConfig`).
 *
 * Posicionamiento (v3): Valme es TU DEPARTAMENTO DE MARKETING, sin necesidad de
 * montarlo. Ocho funciones siempre activas (se ajusta el peso, no la cobertura),
 * expertise por función y una operativa con datos y control encima. El tono es
 * premium pero llano: hacer buen marketing es difícil; tenerlo, no.
 *
 * Las cuatro áreas de operaciones (revenue / internal / administrative /
 * executive) SIGUEN publicadas en /areas/* y enlazadas desde el footer, pero ya
 * no aparecen en la home: la home vende una sola cosa.
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
    eyebrow: 'Departamento de marketing · Pymes B2B',
    titleLine1: 'Hacer buen marketing es difícil.',
    titleLine2: 'Tenerlo, no.',
    subtitle: 'Tu departamento de marketing 360, montado y operando dentro de tu empresa.',
    paragraph:
      'Son ocho funciones las que tienen que estar activas para que el marketing funcione. Montarlas por tu cuenta son ocho procesos de selección, ocho nóminas y meses de prueba y error. Con nosotros es un contrato de servicios, un solo interlocutor y un equipo que ya está montado y ya ha trabajado junto. Operativo en tres semanas.',
    primaryCta: {label: 'Hablemos 30 minutos', kind: 'whatsapp'},
    secondaryCta: {label: 'Ver las ocho funciones', kind: 'section', href: 'intervencion'},
    mediaUrl: '/assets/ValmeSolutionsVideo.webm',
  },

  mission: {
    eyebrow: '/ Qué somos',
    heading: {
      lead: 'No es una agencia.',
      dim: 'Es tu departamento de marketing.',
    },
    lead:
      'Una agencia te entrega campañas y un informe. Un departamento opera: decide, ejecuta, mide y corrige cada semana, con las mismas personas, con nombre y cara, en tus reuniones y en tu chat. Eso es lo que montamos dentro de tu empresa, sin la maquinaria de montarlo ni de sostenerlo.',
    principlesEyebrow: '/ Cuatro principios',
    principles: [
      {
        id: '01',
        title: 'Holístico',
        body: 'Las ocho funciones activas desde el primer mes. No elegimos tres y dejamos el resto para más adelante: el marketing solo funciona completo.',
      },
      {
        id: '02',
        title: 'Expertise por función',
        body: 'Cada función la lleva quien sabe de esa función. No un generalista que hace de todo a medias ni alguien aprendiendo con tu presupuesto.',
      },
      {
        id: '03',
        title: 'Operativa, no campañas',
        body: 'Un calendario, un proceso y un ritmo. Lo que hoy se decide en un grupo de WhatsApp pasa a ser un sistema que funciona sin ti.',
      },
      {
        id: '04',
        title: 'Control y datos',
        body: 'Un panel con lo que se ha gastado, lo que ha entrado y cuánto te cuesta cada lead. Decides con números, no con la sensación de que algo se mueve.',
      },
    ],
  },

  // CASOS DE ÉXITO — sección destacada, alta en la página. (Ver `casesSection`
  // + `caseDocs`; se renderiza con el componente <Cases/>.)
  casesSection: {
    eyebrow: '/ Casos',
    heading: {lead: 'Tres empresas,', dim: 'tres problemas distintos de marketing.'},
    intro:
      'Un gerente que no sabía en qué se le iba la inversión, una empresa que llevaba un año optimizando el canal equivocado y un arranque desde cero. Qué había, qué montamos y en qué se tradujo.',
    cta: {label: 'Hablemos 30 minutos', kind: 'whatsapp'},
  },

  symptoms: {
    eyebrow: '/ ¿Te suena esto?',
    heading: {
      lead: 'Señales de que tu marketing',
      dim: 'no es un departamento todavía.',
    },
    items: [
      {
        label: 'Marketing sin dueño',
        statement: 'Nadie lleva el marketing. Lo lleváis todos un rato.',
        detail:
          'Una parte la hace el comercial, otra un diseñador freelance, otra tú un domingo. Nadie tiene la foto completa ni responde de los resultados.',
        solution:
          'Pasa a haber un responsable y un equipo detrás, con un plan mensual y un número al que rendir cuentas. Tú dejas de ser el director de marketing por defecto.',
      },
      {
        label: 'Campañas sueltas',
        statement: 'Haces cosas de marketing, pero no tienes marketing.',
        detail:
          'Un mes anuncios, otro un vídeo, otro rehacer la web. Cada acción empieza de cero y ninguna se apoya en la anterior, así que nada compone.',
        solution:
          'Montamos una operativa con las ocho funciones activas y un calendario que se cumple. Cada mes construye sobre el anterior en lugar de sustituirlo.',
      },
      {
        label: 'Presupuesto a ciegas',
        statement: 'Inviertes cada mes y no sabes qué te devuelve.',
        detail:
          'El informe habla de impresiones y alcance. Lo que no aparece por ningún sitio es cuántas oportunidades reales entraron y a qué coste.',
        solution:
          'Conectamos campañas, web y CRM en un panel único: gasto, leads, coste por lead y qué canal trae los que acaban comprando.',
      },
      {
        label: 'Leads que se enfrían',
        statement: 'Entran contactos, pero nadie los atiende a tiempo.',
        detail:
          'El formulario llega a un correo que se mira cuando se puede. Para cuando alguien responde, el cliente ya está hablando con otro.',
        solution:
          'Montamos el circuito completo: el lead entra, se cualifica, se asigna y se persigue solo. Y se mide qué pasa con cada uno.',
      },
      {
        label: 'Contratar da vértigo',
        statement: 'Montar el equipo en fijo son ocho contratos y meses de riesgo.',
        detail:
          'Ocho funciones son ocho procesos de selección: redactar, filtrar, entrevistar y decidir. Normalmente, tú. Y si un perfil no encaja, has perdido meses de salario.',
        solution:
          'El equipo ya está montado y ya ha trabajado junto. Si un perfil no encaja, lo cambiamos nosotros. Subes o bajas el equipo con un mes de aviso.',
      },
    ],
  },

  // LAS OCHO FUNCIONES — sustituye a la antigua sección de áreas en la home.
  // Son tarjetas, NO documentos: no tienen slug ni página propia. Se renderizan
  // con <Areas/>, que pinta un div en lugar de un enlace cuando falta el slug.
  functions: {
    eyebrow: '/ Qué cubre',
    heading: {
      lead: 'Ocho funciones.',
      dim: 'Ninguna es opcional.',
    },
    intro:
      'El marketing no falla por hacer una cosa mal: falla por dejar siete sin hacer. Estas ocho están siempre activas en tu cuenta. Lo que se ajusta cada mes es el peso de cada una, no la cobertura.',
    items: [
      {
        _id: 'direccion-y-estrategia',
        index: '01',
        name: 'Dirección y estrategia',
        icon: 'compass',
        tagline: 'Sin un plan con números, cada mes se decide por intuición y no se aprende nada.',
      },
      {
        _id: 'paid-media',
        index: '02',
        name: 'Paid media',
        icon: 'megaphone',
        tagline: 'Una cuenta mal montada quema presupuesto rápido y en silencio.',
      },
      {
        _id: 'seo-contenido-geo',
        index: '03',
        name: 'SEO, contenido y GEO',
        icon: 'search',
        tagline: 'Es lo único que sigue trayendo clientes cuando dejas de pagar. Tarda meses: empieza ya.',
      },
      {
        _id: 'social-organico',
        index: '04',
        name: 'Social orgánico',
        icon: 'users',
        tagline: 'Casi todos te investigan antes de escribirte. Un perfil muerto cuesta oportunidades.',
      },
      {
        _id: 'creatividad-diseno-video',
        index: '05',
        name: 'Creatividad, diseño y vídeo',
        icon: 'palette',
        tagline: 'La creatividad decide más el resultado de una campaña que la segmentación.',
      },
      {
        _id: 'mensaje-y-copy',
        index: '06',
        name: 'Mensaje y copy',
        icon: 'pen-tool',
        tagline: 'Si no dices por qué tú y no otro, da igual cuánto tráfico traigas.',
      },
      {
        _id: 'web-landings-cro',
        index: '07',
        name: 'Web, landings y CRO',
        icon: 'mouse-pointer-click',
        tagline: 'Duplicar la conversión vale lo mismo que duplicar el presupuesto, y cuesta mucho menos.',
      },
      {
        _id: 'datos-crm-leads',
        index: '08',
        name: 'Datos, CRM y leads',
        icon: 'database',
        tagline: 'Se pierde más dinero tratando mal los leads que optimizando campañas. Responder tarde mata la venta.',
      },
    ],
    weightsTitle: 'Las ocho están siempre activas. Se ajusta el peso, no la cobertura.',
    weightsNote: 'Reparto por defecto · se revisa cada mes',
    weights: [
      {label: 'Dirección y estrategia', value: 9},
      {label: 'Paid media', value: 15},
      {label: 'SEO, contenido y GEO', value: 16},
      {label: 'Social orgánico', value: 15},
      {label: 'Creatividad y vídeo', value: 15},
      {label: 'Mensaje y copy', value: 5},
      {label: 'Web, landings y CRO', value: 13},
      {label: 'Datos, CRM y leads', value: 12},
    ],
    closingEyebrow: '/ Y lo ves',
    closingHeading:
      'Cada mes ves qué se hizo, qué costó y qué entró. En un panel, no en un PDF de 40 páginas.',
    closingCta: {label: 'Hablemos 30 minutos', kind: 'whatsapp'},
  },

  methodology: {
    eyebrow: '/ Cómo trabajamos',
    heading: {
      lead: 'De la primera llamada',
      dim: 'a un departamento operando.',
    },
    lead:
      'Cuatro fases que van del diagnóstico a una operativa que se revisa con datos cada mes. Lo llamamos',
    leadMono: 'The Valme Mandate',
    steps: [
      {
        id: '01',
        name: 'Diagnóstico',
        description:
          'Auditamos lo que ya tienes: cuentas de paid, web, medición, CRM y contenido. Sale un mapa de qué está montado, qué está roto y qué no existe.',
      },
      {
        id: '02',
        name: 'Estrategia',
        description:
          'De ahí sale el plan a 90 días: mensaje, canales, reparto de peso entre las ocho funciones y los números a los que vamos. Con fechas.',
      },
      {
        id: '03',
        name: 'Construcción y adopción',
        description:
          'Montamos lo que falte —web, medición, circuito de leads— y el equipo entra en tus reuniones y en tu chat hasta que operar así es lo normal.',
      },
      {
        id: '04',
        name: 'Medición',
        description:
          'Revisión mensual con los datos delante: qué funcionó, qué no y cómo se reparte el peso el mes siguiente. El marketing deja de decidirse por intuición.',
      },
    ],
  },

  mandates: {
    eyebrow: '/ Por dónde empezar',
    heading: {lead: 'Dos puntos de partida.', dim: 'Según lo que ya tengas montado.'},
    lead:
      'El primer paso no es el mismo si ya tienes cuentas y web funcionando que si empiezas de cero. En los dos casos sales de la primera conversación sabiendo qué se hace y cuándo.',
    footnote:
      'Un contrato de servicios, no una relación laboral: sin nóminas, sin gestión de personal y con un mes de aviso para subir o bajar el equipo. Encajamos mejor con empresas B2B de 10 a 50 personas y ticket por encima de 1.500 €.',
    plans: [
      {
        index: 'M/01',
        name: 'Si ya tienes operativa',
        variant: 'light',
        pitch:
          'Ya inviertes en marketing: tienes cuentas montadas, web y algo de medición. El problema no es empezar, es que nadie lo está dirigiendo entero.',
        includes: [
          'Auditoría de cuentas, web, medición y CRM',
          'Mapa de qué está montado, roto o sin hacer',
          'Plan a 90 días con números y fechas',
          'En tres semanas tienes el plan y el equipo dentro',
        ],
        ctaLabel: 'Quiero la auditoría',
      },
      {
        index: 'M/02',
        name: 'Si empiezas de cero',
        variant: 'dark',
        pitch:
          'No hay nada montado, o lo que hay no sirve. Construimos la base entera —mensaje, web, medición y circuito de leads— y a partir de ahí se capta.',
        includes: [
          'Mensaje y propuesta de valor',
          'Web y landings que convierten',
          'Medición y CRM desde el primer día',
          'Circuito de leads completo',
          'Captando en ocho semanas',
        ],
        ctaLabel: 'Quiero empezar',
      },
    ],
  },

  // Comparativa montarlo-tú / con-nosotros. Reutiliza <CareersCallout/>: el panel
  // de la izquierda es el enunciado y las dos columnas de la derecha son las
  // listas con X (montarlo tú) y con check (con nosotros).
  admission: {
    eyebrow: '/ Por qué así',
    heading: 'Hacer buen marketing es difícil. Y montar el equipo que lo ejecute, también.',
    intro:
      'No es que no sepas lo que hay que hacer. Es que montarlo por dentro son ocho contrataciones, ocho relaciones laborales y todo el riesgo de acertar a la primera. Esa parte ya la hicimos nosotros.',
    notAcceptedTitle: 'Si lo montas tú',
    notAccepted: [
      'Ocho funciones son ocho procesos de selección: redactar, filtrar, entrevistar y decidir. Normalmente, tú.',
      'Cada contratación es una relación laboral: nóminas, periodo de prueba, formación, vacaciones, bajas y rotación.',
      'Y no se acierta a la primera: un perfil que no encaja cuesta meses de salario y volver a empezar.',
      'Y el día que haya que reducir el equipo, es un despido.',
    ],
    acceptedTitle: 'Con nosotros',
    accepted: [
      'Esa parte ya la hicimos: el equipo está montado, ya ha trabajado junto y es operativo en tres semanas.',
      'Un contrato de servicios y un solo interlocutor. Sin nóminas y sin gestión de personal.',
      'Si un perfil no encaja, lo cambiamos nosotros. El riesgo de acertar es nuestro, no tuyo.',
      'Subes o bajas el equipo cuando lo necesites, con un mes de aviso.',
    ],
  },

  contact: {
    eyebrow: '/ El primer paso',
    heading: 'Hablemos 30 minutos.',
    paragraph:
      'Nos cuentas cómo está tu marketing hoy y te decimos qué falta, qué sobra y por dónde empezaríamos. Sin presentación de agencia y sin compromiso.',
    cta: {label: 'Hablemos 30 minutos', kind: 'whatsapp'},
    footnote: 'Respondemos en menos de 24 horas laborables.',
  },

  seo: {
    title: 'Valme Solutions | Tu departamento de marketing, sin montarlo',
    description:
      'Un equipo de marketing 360 que se integra en tu pyme B2B: estrategia, paid, SEO, contenido, creatividad, web y datos. Las ocho funciones activas, un solo contrato y un solo interlocutor. Operativo en tres semanas.',
  },

}

// ---------------------------------------------------------------------------
// CASOS DE ÉXITO
// ---------------------------------------------------------------------------
export const caseDocs: any[] = [
  {
    _id: 'ceo-sin-visibilidad-marketing',
    slug: 'ceo-sin-visibilidad-marketing',
    index: '01',
    image: '/assets/stock/working.jpg',
    title: 'El CEO que dejó de preguntar en qué se iba el dinero de marketing',
    sector: 'Servicios B2B · 35 personas · Dirección general',
    summary:
      'Invertía todos los meses y solo recibía un informe con impresiones y alcance. Montamos la medición y el panel que le dicen qué entra, por dónde y a qué coste.',
    challenge:
      'El gerente llevaba dos años invirtiendo en marketing y no sabía decir si funcionaba. Cada mes recibía un informe lleno de impresiones, alcance y crecimiento de seguidores, y ni una sola línea sobre lo único que le importaba: cuántas oportunidades reales habían entrado y cuánto le había costado cada una. Los formularios de la web caían en un correo compartido, los de LinkedIn los descargaba alguien a mano y las llamadas no se registraban en ningún sitio. Cuando su socio le preguntaba cuánto de la facturación venía de marketing, la respuesta honesta era que no lo sabía. Así que decidía por sensación: recortaba donde le parecía caro y subía donde le habían dicho que había que estar.',
    intervention: [
      'Auditamos qué se estaba midiendo y encontramos que casi nada llegaba al CRM',
      'Montamos el seguimiento de punta a punta: anuncio, web, formulario, llamada y oportunidad',
      'Unificamos los leads de todos los canales en una sola entrada, sin descargas manuales',
      'Conectamos el CRM para que cada oportunidad arrastre de dónde vino',
      'Construimos un panel de dirección con gasto, leads, coste por lead y cierres',
      'Fijamos una revisión mensual de 45 minutos con los datos delante',
    ],
    result: [
      'Sabe cada semana cuánto ha invertido y cuántas oportunidades ha traído',
      'El coste por oportunidad dejó de ser una incógnita y pasó a ser un objetivo',
      'Las decisiones de presupuesto se toman sobre la tabla, no sobre la sensación',
      'Puede responder a su socio cuánta facturación viene de marketing, con el dato',
      'Dejó de pagar dos canales que no habían traído ni una sola oportunidad',
    ],
  },
  {
    _id: 'atribucion-canal-rentable',
    slug: 'atribucion-canal-rentable',
    index: '02',
    image: '/assets/stock/case-ia.jpg',
    title: 'Su mejor canal era el que menos leads traía',
    sector: 'Industrial B2B · Ticket alto · Ciclo de venta largo',
    summary:
      'Optimizaban el canal que más volumen daba. Al medir hasta el cierre resultó ser el que menos vendía, y el presupuesto se movió al que sí.',
    challenge:
      'Repartían el presupuesto por intuición y por volumen: el canal que más formularios traía se llevaba la mayor parte, porque parecía el que funcionaba. El problema es que nadie había mirado nunca qué pasaba con esos contactos después. El equipo comercial se quejaba de que la mayoría no tenían ni presupuesto ni proyecto, pero esa queja no llegaba nunca a la decisión de inversión. Mientras tanto, otro canal traía bastantes menos contactos, no llamaba la atención de nadie en el informe mensual y llevaba meses infrafinanciado. Estaban optimizando para conseguir más de lo que no vendía.',
    intervention: [
      'Medimos cada canal hasta el final: no hasta el lead, sino hasta el contrato firmado',
      'Cruzamos seis meses de histórico entre campañas y oportunidades cerradas del CRM',
      'Calculamos coste por oportunidad cualificada y por cliente, canal a canal',
      'Salió a la luz que el canal de más volumen tenía la peor tasa de cierre con diferencia',
      'Movimos el peso del presupuesto al canal que sí traía clientes',
      'Rehicimos los anuncios y la landing del canal bueno, que llevaba meses sin tocarse',
      'Cambiamos el informe mensual: de volumen de leads a coste por cliente',
    ],
    result: [
      'El presupuesto dejó de premiar el volumen y pasó a premiar el cierre',
      'El equipo comercial recibe menos contactos y bastantes más aprovechables',
      'El coste por cliente bajó sin subir ni un euro la inversión total',
      'Las campañas se juzgan por lo que facturan, no por lo que aparentan',
      'Se dejó de invertir en un canal que llevaba un año pareciendo el mejor',
    ],
  },
  {
    _id: 'paid-con-seo-desde-cero',
    slug: 'paid-con-seo-desde-cero',
    index: '03',
    image: '/assets/stock/case-publicidad.jpg',
    title: 'Empezaron de cero: paid para vender ya, SEO para dejar de depender de él',
    sector: 'B2B de servicios · Sin presencia previa · Arranque',
    summary:
      'No tenían nada montado. Paid para que entraran oportunidades desde el primer mes y SEO en paralelo para que sigan entrando el día que se apague la inversión.',
    challenge:
      'Vendían bien por recomendación y por la agenda de los socios, pero esa vía tenía techo y ellos lo sabían. No había web que convirtiera, ni medición, ni un sitio donde aterrizaran los contactos. El riesgo de arrancar solo con paid era evidente: funciona desde el primer día, pero el día que dejas de pagar se acaba, y cuanto más creces con él más caro se vuelve depender de él. El riesgo de arrancar solo con SEO era el contrario: es lo único que sigue trayendo clientes cuando cierras el grifo, pero tarda meses en dar señales y no aguantaban ese silencio.',
    intervention: [
      'Definimos el mensaje y la propuesta de valor antes de gastar un euro en tráfico',
      'Montamos web y landings pensadas para convertir, no para lucir',
      'Instalamos medición y CRM desde el primer día, antes de encender campañas',
      'Arrancamos paid acotado a las búsquedas de intención clara de compra',
      'En paralelo, atacamos con contenido y SEO las mismas búsquedas que compraba el paid',
      'Usamos los datos del paid para saber qué palabras merecían contenido propio',
      'Montamos el circuito de leads: entra, se cualifica, se asigna y se persigue solo',
    ],
    result: [
      'Oportunidades entrando desde el primer mes gracias al paid',
      'El contenido empezó a traer tráfico propio antes de acabar el arranque',
      'El paid se usó también como laboratorio: qué mensaje funciona antes de escribirlo',
      'A medida que el SEO sube, el coste de captación deja de depender de la inversión',
      'Dejaron de crecer solo por recomendación y por la agenda de los socios',
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
  descriptor: 'Tu departamento de marketing',
  logo: null,
  whatsappNumber: '34600412492',
  whatsappMessage: 'Hola, me gustaría hablar 30 minutos sobre el marketing de mi empresa.',
  email: 'hola@valmesolutions.com',
  linkedinUrl: 'https://www.linkedin.com/company/valme-solutions',
  siteUrl: 'https://valmesolutions.com',
  navLinks: [
    {label: 'Qué cubre', sectionId: 'intervencion'},
    {label: 'Qué somos', sectionId: 'tesis'},
    {label: 'Casos', sectionId: 'casos'},
    {label: 'Cómo trabajamos', sectionId: 'mandato'},
    {label: 'Contacto', sectionId: 'contacto'},
  ],
  navCtaLabel: 'Hablemos 30 minutos',
  footerLegal:
    'Valme Solutions — Tu departamento de marketing, sin necesidad de montarlo.\nOcho funciones siempre activas, un solo contrato y un solo interlocutor.',
  footerColumns: [
    {
      title: 'Casos',
      links: [
        {label: 'Un CEO sin visibilidad', href: '/casos/ceo-sin-visibilidad-marketing'},
        {label: 'El canal que sí vendía', href: '/casos/atribucion-canal-rentable'},
        {label: 'Paid con SEO desde cero', href: '/casos/paid-con-seo-desde-cero'},
      ],
    },
    {
      title: 'También hacemos',
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
        {label: 'Qué cubre', href: '/#intervencion'},
        {label: 'Cómo trabajamos', href: '/#mandato'},
        {label: 'Hablemos 30 minutos', href: '/#contacto'},
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
    title: 'Valme Solutions | Tu departamento de marketing, sin montarlo',
    description:
      'Un equipo de marketing 360 que se integra en tu pyme B2B. Las ocho funciones activas, un solo contrato y un solo interlocutor.',
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
