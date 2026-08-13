/**
 * Seed the Valme content into Sanity, mirroring the current hardcoded site
 * exactly. Run with:  npx sanity exec seed.ts --with-user-token
 *
 * Idempotent: uses createOrReplace with fixed IDs for the singletons and areas.
 */
import {getCliClient} from 'sanity/cli'
import {readFileSync} from 'node:fs'
import {resolve} from 'node:path'

const client = getCliClient({apiVersion: '2026-02-01'})

const PUBLIC = resolve(__dirname, '../web/public/assets')

async function imgFromUrl(url: string, filename: string) {
  try {
    const res = await fetch(url)
    const buf = Buffer.from(await res.arrayBuffer())
    const asset = await client.assets.upload('image', buf, {filename})
    return {_type: 'image', asset: {_type: 'reference', _ref: asset._id}}
  } catch (e) {
    console.warn('  ! no se pudo subir', filename, (e as Error).message)
    return undefined
  }
}
async function imgFromFile(file: string, filename: string) {
  try {
    const buf = readFileSync(resolve(PUBLIC, file))
    const asset = await client.assets.upload('image', buf, {filename})
    return {_type: 'image', asset: {_type: 'reference', _ref: asset._id}}
  } catch (e) {
    console.warn('  ! no se pudo subir', filename, (e as Error).message)
    return undefined
  }
}

const AREA_DATA = [
  {
    slug: 'revenue-operations', index: '01', orderRank: 1, name: 'Revenue Operations', eyebrow: 'Ingresos', icon: 'trending-up',
    tagline: 'Desde la entrada de una oportunidad hasta el cierre y la facturación.',
    intro: 'Intervenimos el sistema completo por el que una organización convierte una oportunidad en un ingreso cobrado. Donde el pipeline vive en correos, en hojas o en la cabeza de un comercial, restauramos control sobre el proceso de generación de ingresos.',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2970&auto=format&fit=crop',
    cases: [
      {title: 'Pipeline fuera de control', description: 'El estado real de cada oportunidad no está disponible para dirección sin pedirlo. Nadie opera sobre una visión completa del pipeline.'},
      {title: 'Propuestas y presupuestos manuales', description: 'Cada oferta se construye desde cero, se copia de otra, se envía por correo y se persigue para firmar. El ciclo depende del recuerdo.'},
      {title: 'Comercial gestiona su propia administración', description: 'El tiempo del equipo comercial se consume en rellenar sistemas, no en relación con el cliente. La estructura crece al ritmo de los ingresos.'},
      {title: 'Ingresos sin visibilidad', description: 'No se puede responder con criterio a cuánto se facturará, qué está parado ni dónde se pierde margen entre oportunidad y cobro.'},
      {title: 'Handoff roto entre ventas y entrega', description: 'Lo vendido y lo entregado no coinciden porque el traspaso depende de mensajes sueltos y de personas concretas.'},
      {title: 'Cobro dependiente del recordatorio', description: 'El ingreso no se cierra al firmar, sino cuando alguien recuerda perseguirlo. La tesorería se gestiona reactivamente.'},
    ],
    benefits: [
      {label: 'Control sobre el ingreso', detail: 'Dirección opera con visibilidad real del pipeline sin pedir informes.'},
      {label: 'Ciclos más cortos', detail: 'La fricción administrativa deja de estar dentro del ciclo comercial.'},
      {label: 'Estructura sin depender de personas', detail: 'El proceso sigue funcionando aunque cambie un comercial o un gestor.'},
    ],
  },
  {
    slug: 'internal-operations', index: '02', orderRank: 2, name: 'Internal Operations', eyebrow: 'Operación', icon: 'workflow',
    tagline: 'Coordinación, asignación de trabajo, entregas, documentación y control.',
    intro: 'Intervenimos la operativa interna por la que el trabajo se asigna, se ejecuta, se entrega y se controla. Donde cada nuevo encargo exige reunión, correo y recordatorio, construimos el sistema que sostiene la operación sin depender de la improvisación.',
    imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2970&auto=format&fit=crop',
    cases: [
      {title: 'El trabajo se asigna en reuniones', description: 'Cada encargo requiere coordinación presencial para repartirlo. No existe un sistema de asignación: existe una conversación.'},
      {title: 'Dependencia de una sola persona', description: 'Una operación crítica descansa sobre el conocimiento de alguien concreto. Si esa persona falla, la operación se detiene.'},
      {title: 'Información duplicada en varios sistemas', description: 'El mismo dato se introduce en tres herramientas distintas. La versión correcta no es evidente y los errores se acumulan.'},
      {title: 'Entregas sin trazabilidad', description: 'No se puede reconstruir el estado real de un encargo sin preguntar. Lo entregado y lo comprometido no siempre coinciden.'},
      {title: 'Documentación dispersa', description: 'Los documentos viven en correos, en carpetas locales y en mensajería. El conocimiento de la operación no está documentado.'},
      {title: 'Crecimiento sin sistema', description: 'Cada nuevo cliente obliga a aumentar estructura casi al mismo ritmo. La operación no escala porque no está sistematizada.'},
    ],
    benefits: [
      {label: 'Operación que no depende de personas', detail: 'El sistema sigue ejecutándose aunque cambien los responsables.'},
      {label: 'Visibilidad de la ejecución', detail: 'El estado del trabajo está disponible sin perseguirlo por correo.'},
      {label: 'Crecimiento sin proporcionalidad', detail: 'Atender más volumen no exige sumar estructura al mismo ritmo.'},
    ],
  },
  {
    slug: 'administrative-operations', index: '03', orderRank: 3, name: 'Administrative Operations', eyebrow: 'Administración', icon: 'file-stack',
    tagline: 'Facturación, cobros, conciliación, aprobaciones y gestión documental.',
    intro: 'Intervenimos la capa administrativa que sostiene el cumplimiento de la compañía. Donde el cierre, la facturación y los cobros se gestionan con hojas y recordatorios, restauramos gobierno sobre el flujo documental y financiero.',
    imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2970&auto=format&fit=crop',
    cases: [
      {title: 'Cierre contable manual', description: 'El cierre de periodo consume semanas de trabajo intensivo porque se reconstruye a mano cada vez, no porque sea complejo.'},
      {title: 'Facturas procesadas una a una', description: 'La entrada de facturas, albaranes y abonos depende de transcripción manual. El error no es excepción: es consecuencia del método.'},
      {title: 'Aprobaciones por correo', description: 'Las solicitudes se persiguen, se aprueban en cadena de mensajes y se registran después. La traza no existe mientras se ejecuta.'},
      {title: 'Conciliación reactiva', description: 'Los movimientos se cuadran tarde, cuando ya hay un problema. La detección de desviaciones llega después del impacto.'},
      {title: 'Cobros gestionados por la memoria', description: 'El seguimiento de impagados depende de quien recuerda insistir. La tesorería no está bajo control, está bajo costumbre.'},
      {title: 'Cumplimiento documental costoso', description: 'La preparación de auditorías, certificaciones y archivos consume un coste desproporcionado respecto al valor que aporta.'},
    ],
    benefits: [
      {label: 'Cierre más rápido', detail: 'El cierre deja de ser un evento intensivo y pasa a ser un estado del sistema.'},
      {label: 'Trazabilidad total', detail: 'Cada aprobación, factura y movimiento queda registrado en el momento.'},
      {label: 'Detección temprana', detail: 'Las desviaciones se ven antes de que se conviertan en un incidente.'},
    ],
  },
  {
    slug: 'executive-intelligence', index: '04', orderRank: 4, name: 'Executive Intelligence', eyebrow: 'Dirección', icon: 'activity',
    tagline: 'Información, alertas, desviaciones, previsiones y control para dirección.',
    intro: 'Intervenimos el sistema por el que la dirección conoce qué ocurre en la organización. Donde entender el estado real del negocio exige varias reuniones, construimos el gobierno de información que permite decidir con criterio.',
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2970&auto=format&fit=crop',
    cases: [
      {title: 'Varias reuniones para entender el estado', description: 'Comprender qué ocurre exige convocar, preguntar y reconstruir. La información no está disponible: se solicita.'},
      {title: 'Decisiones con datos antiguos', description: 'Los informes llegan con días o semanas de retraso. La decisión se toma sobre el pasado, no sobre la situación actual.'},
      {title: 'Sin alertas sobre desviaciones', description: 'La organización reacciona cuando el impacto ya se ha producido. No existen avisos sobre lo que se sale de patrón.'},
      {title: 'Previsiones basadas en intuición', description: 'Las previsiones se construyen sobre suposiciones optimistas, no sobre el comportamiento real del negocio.'},
      {title: 'Dirección sin visibilidad de capacidad', description: 'No se sabe con criterio cuánta carga soporta la operación, dónde está el cuello ni cuándo se romperá.'},
      {title: 'Información fragmentada por departamento', description: 'Cada área mantiene su versión de la realidad. La dirección integra manualmente lo que el sistema debería integrar.'},
    ],
    benefits: [
      {label: 'Decisión con criterio', detail: 'La dirección opera sobre la situación actual, no sobre reconstrucciones tardías.'},
      {label: 'Alerta antes que reacción', detail: 'Las desviaciones se detectan cuando aún se pueden corregir.'},
      {label: 'Una sola versión de la operación', detail: 'La información deja de ser territorio de cada departamento.'},
    ],
  },
]

async function run() {
  console.log('› Subiendo imágenes…')
  const logo = await imgFromFile('tomato_slice_logo.png', 'valme-logo.png')
  const ogImage = await imgFromFile('airplane_pov_realistic_sunset.png', 'valme-og.png')

  const methodImgUrls = [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2940&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=2970&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=2970&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2970&auto=format&fit=crop',
  ]
  const methodImgs = []
  for (let i = 0; i < methodImgUrls.length; i++) methodImgs.push(await imgFromUrl(methodImgUrls[i], `method-0${i + 1}.jpg`))

  console.log('› Creando áreas…')
  for (const a of AREA_DATA) {
    const image = await imgFromUrl(a.imageUrl, `${a.slug}.jpg`)
    await client.createOrReplace({
      _id: `area.${a.slug}`,
      _type: 'area',
      name: a.name, slug: {_type: 'slug', current: a.slug}, index: a.index, orderRank: a.orderRank,
      eyebrow: a.eyebrow, icon: a.icon, tagline: a.tagline, intro: a.intro,
      ...(image ? {image} : {}),
      cases: a.cases.map((c) => ({_type: 'object', _key: c.title.slice(0, 12).replace(/\s/g, ''), ...c})),
      benefits: a.benefits.map((b) => ({_type: 'object', _key: b.label.slice(0, 12).replace(/\s/g, ''), ...b})),
    })
    console.log('  ✓', a.name)
  }

  console.log('› Ajustes del sitio…')
  await client.createOrReplace({
    _id: 'siteSettings', _type: 'siteSettings',
    brandName: 'Valme', descriptor: 'Private Operations Firm',
    ...(logo ? {logo} : {}),
    whatsappNumber: '34600412492',
    whatsappMessage: 'Hola, me gustaría solicitar una revisión privada con Valme Solutions.',
    siteUrl: 'https://valmesolutions.com',
    navLinks: [
      {_key: 'n1', label: 'Tesis', sectionId: 'tesis'},
      {_key: 'n2', label: 'Intervención', sectionId: 'intervencion'},
      {_key: 'n3', label: 'Mandato', sectionId: 'mandato'},
      {_key: 'n4', label: 'Admisión', sectionId: 'admision'},
      {_key: 'n5', label: 'Contacto', sectionId: 'contacto'},
    ],
    navCtaLabel: 'Revisión privada',
    footerLegal: '© 2026 Valme Solutions. Todos los derechos reservados.\nPrivate Operations Firm. Intervención operativa para compañías que han crecido más rápido que su operativa.',
    footerColumns: [
      {_key: 'c1', title: 'Intervención', links: AREA_DATA.map((a, i) => ({_key: 'l' + i, label: a.name, href: `/areas/${a.slug}`}))},
      {_key: 'c2', title: 'Cómo trabajamos', links: [
        {_key: 'a', label: 'Mandato', href: '/#mandato'},
        {_key: 'b', label: 'Mandatos', href: '/#mandatos'},
        {_key: 'c', label: 'Admisión', href: '/#admision'},
      ]},
      {_key: 'c3', title: 'Firma', links: [
        {_key: 'a', label: 'Tesis', href: '/#tesis'},
        {_key: 'b', label: 'Síntomas', href: '/#sintomas'},
        {_key: 'c', label: 'Revisión privada', href: '/#contacto'},
      ]},
    ],
    areaMandateEyebrow: '/ The Valme Mandate',
    areaMandateSteps: [
      {_key: 's1', step: '01', title: 'Exposure', body: 'Identificamos dónde la organización pierde control, capacidad o margen.'},
      {_key: 's2', step: '02', title: 'Diagnosis', body: 'Reconstruimos el proceso, cuantificamos su impacto y localizamos dependencias críticas.'},
      {_key: 's3', step: '03', title: 'Intervention', body: 'Rediseñamos el sistema e implantamos los cambios organizativos y tecnológicos.'},
      {_key: 's4', step: '04', title: 'Operation', body: 'Supervisamos, medimos y optimizamos el sistema hasta estabilizarlo.'},
    ],
    areaScenariosNote: 'Escenarios operativos. No son casos reales publicados: son situaciones reconocibles en las que intervenir.',
    defaultSeo: {
      _type: 'seo',
      title: 'Valme Solutions | Private Operations Firm',
      description: 'Valme Solutions identifica, rediseña y opera los sistemas críticos sobre los que funcionan las compañías. Intervenimos allí donde una organización pierde tiempo, margen, velocidad o control.',
      ...(ogImage ? {ogImage} : {}),
    },
  })
  console.log('  ✓ siteSettings')

  console.log('› Página de inicio…')
  await client.createOrReplace({
    _id: 'homePage', _type: 'homePage',
    hero: {
      eyebrow: 'Valme Solutions — Private Operations Firm',
      titleLine1: 'Growth creates', titleLine2: 'operational debt.',
      subtitle: 'We remove it.',
      paragraph: 'Valme Solutions identifica, rediseña y opera los sistemas críticos sobre los que funcionan las compañías. Intervenimos allí donde una organización pierde tiempo, margen, velocidad o control.',
      primaryCta: {_type: 'cta', label: 'Solicitar una revisión privada', kind: 'whatsapp'},
      secondaryCta: {_type: 'cta', label: 'Conocer cómo intervenimos', kind: 'section', href: '#mandato'},
      mediaUrl: '/assets/ValmeSolutionsVideo.webm',
    },
    mission: {
      eyebrow: '/ Tesis',
      heading: {lead: 'El crecimiento no solo suma ingresos. Suma complejidad, dependencias y ', dim: 'pérdida de control.'},
      lead: 'Cuando una compañía crece más rápido que su capacidad de sistematizar la operación, el control se pierde silenciosamente. El software existe, pero la organización sigue funcionando mediante correos, hojas de cálculo y recordatorios. Eso no es falta de tecnología: es deuda operativa.',
      principlesEyebrow: '/ Principios',
      principles: [
        {_key: 'p1', id: '01', title: 'La tecnología es medio, no razón', body: 'No llegamos con una herramienta buscando dónde instalarla. La intervención puede combinar rediseño de procesos, automatización, integración de sistemas, control de datos y cambios en la forma de operar. La decisión la toma el resultado, no la herramienta.'},
        {_key: 'p2', id: '02', title: 'El criterio precede a la ejecución', body: 'No aceptamos un mandato sin haber cuantificado la exposición operativa y localizado las dependencias críticas. Intervenir sin diagnóstico es improvisar con recursos ajenos.'},
        {_key: 'p3', id: '03', title: 'El sistema supera a la persona', body: 'Eliminamos procesos que una compañía madura no debería seguir ejecutando manualmente. Una operación crítica no puede depender del recuerdo, el correo o el conocimiento no documentado de una sola persona.'},
        {_key: 'p4', id: '04', title: 'Intervenir sin encerrarse', body: 'Podemos intervenir revenue, administración, operaciones o dirección sin que la firma quede atrapada en un sector ni en un tipo de solución. Lo que no cambia es el mandato.'},
      ],
    },
    symptoms: {
      eyebrow: '/ Síntomas',
      heading: {lead: 'Si esto le resulta familiar, existe ', dim: 'exposición operativa.'},
      items: [
        {_key: 'y1', label: 'Reuniones', statement: 'La dirección necesita varias reuniones para entender qué está ocurriendo.', detail: 'La información no está disponible: se solicita. Comprender el estado real del negocio exige convocar, preguntar y reconstruir.'},
        {_key: 'y2', label: 'Dependencia', statement: 'Una operación crítica depende de una única persona.', detail: 'Si esa persona falla, se ausenta o se marcha, la operación se detiene. El conocimiento que sostiene el negocio no está documentado.'},
        {_key: 'y3', label: 'Duplicación', statement: 'La misma información se introduce en tres herramientas diferentes.', detail: 'La versión correcta no es evidente. El error no es excepción: es consecuencia del método.'},
        {_key: 'y4', label: 'Invisibilidad', statement: 'Los equipos trabajan, pero nadie dispone de una visión completa.', detail: 'Cada área mantiene su versión de la realidad. La dirección integra manualmente lo que el sistema debería integrar.'},
        {_key: 'y5', label: 'Estructura', statement: 'Cada nuevo cliente exige aumentar estructura casi al mismo ritmo.', detail: 'La operación no escala porque no está sistematizada. El crecimiento se traduce directamente en coste y en fricción.'},
        {_key: 'y6', label: 'Software sin sistema', statement: 'La compañía tiene software, pero sigue funcionando mediante correos, Excel y recordatorios.', detail: 'No hay falta de tecnología. Hay un sistema que no existe. Eso es deuda operativa.'},
      ],
    },
    areasSection: {
      eyebrow: '/ Dónde intervenimos',
      heading: {lead: 'Cuatro lugares donde una compañía puede estar ', dim: 'perdiendo control.'},
      intro: 'No son servicios cerrados. Son cuatro dominios en los que intervenir. Una compañía puede estar perdiendo control en uno solo, o en varios a la vez. El diagnóstico lo determina.',
      closingEyebrow: '/ Diagnóstico',
      closingHeading: 'Su caso no encaja en un solo dominio. Lo diagnosticamos igual.',
      closingCta: {_type: 'cta', label: 'Solicitar una revisión privada', kind: 'whatsapp'},
    },
    methodology: {
      eyebrow: '/ Metodología',
      heading: {lead: 'No vendemos proyectos. Asumimos ', dim: 'mandatos.'},
      lead: 'Una intervención formal, no un encargo genérico. Esto es ',
      leadMono: 'The Valme Mandate',
      steps: [
        {_key: 'm1', id: '01', name: 'Exposure', description: 'Identificamos dónde la organización pierde control, capacidad o margen. Antes de proponer nada, cuantificamos la exposición operativa real.', ...(methodImgs[0] ? {image: methodImgs[0]} : {})},
        {_key: 'm2', id: '02', name: 'Diagnosis', description: 'Reconstruimos el proceso, cuantificamos su impacto y localizamos las dependencias críticas. El diagnóstico precede a cualquier intervención.', ...(methodImgs[1] ? {image: methodImgs[1]} : {})},
        {_key: 'm3', id: '03', name: 'Intervention', description: 'Rediseñamos el sistema e implantamos los cambios organizativos y tecnológicos necesarios. La herramienta queda subordinada al resultado.', ...(methodImgs[2] ? {image: methodImgs[2]} : {})},
        {_key: 'm4', id: '04', name: 'Operation', description: 'Supervisamos, medimos y optimizamos el sistema hasta estabilizarlo. Un mandato no termina con la entrega: termina cuando la operación gobierna.', ...(methodImgs[3] ? {image: methodImgs[3]} : {})},
      ],
    },
    mandates: {
      eyebrow: '/ Mandatos',
      heading: {lead: 'Dos formas de trabajar con ', dim: 'Valme Solutions.'},
      lead: 'No es lo mismo saber dónde se pierde control que asumir el mandato de corregirlo. Ambos comienzan con una revisión privada.',
      footnote: 'Valme Solutions trabaja con un número limitado de mandatos simultáneos.',
      plans: [
        {_key: 'pl1', index: 'M/01', name: 'Operational Review', variant: 'light', pitch: 'Un mandato de diagnóstico. Identificamos dónde la organización pierde control, cuantificamos su impacto y entregamos un plan de intervención.', includes: ['Mapeo de procesos críticos', 'Cuantificación de exposición operativa', 'Localización de dependencias críticas', 'Plan de intervención priorizado'], ctaLabel: 'Solicitar una revisión privada'},
        {_key: 'pl2', index: 'M/02', name: 'Transformation Mandate', variant: 'dark', pitch: 'Un mandato completo. Asumimos el rediseño del sistema y la operación hasta estabilizarlo. La tecnología queda subordinada al resultado.', includes: ['Todo lo incluido en Operational Review', 'Rediseño organizativo y tecnológico', 'Implantación y control del cambio', 'Supervisión hasta estabilizar la operación'], ctaLabel: 'Plantear un mandato completo'},
      ],
    },
    admission: {
      eyebrow: '/ Admisión',
      heading: 'Not every operation requires our intervention.',
      intro: 'Trabajamos con compañías en las que existe una exposición operativa identificable, acceso directo a dirección y capacidad real de modificar procesos. La exclusividad no se afirma: se establece con condiciones.',
      notAcceptedTitle: '/ No aceptamos',
      notAccepted: ['Automatizaciones aisladas', 'Implantaciones sin impacto medible', 'Proyectos experimentales de IA', 'Empresas que buscan únicamente reducir coste', 'Intervenciones sin responsable interno', 'Solicitudes centradas en una herramienta concreta'],
      acceptedTitle: '/ Trabajamos cuando',
      accepted: ['El crecimiento ha aumentado la complejidad', 'La operación depende excesivamente de personas concretas', 'Existen departamentos o sistemas desconectados', 'La dirección carece de visibilidad suficiente', 'La fricción tiene un impacto económico relevante'],
    },
    firm: {
      eyebrow: '/ Firma',
      heading: {lead: 'Puede que la firma sea nueva. ', dim: 'El criterio no lo es.'},
      proof: [
        {_key: 'f1', tag: '01', label: 'Experiencia real', body: 'El equipo que compone la firma trabajó en captación, CRM, ventas, datos, tecnología y procesos empresariales antes de que Valme Solutions existiera. No improvisamos en el dominio que intervenimos.'},
        {_key: 'f2', tag: '02', label: 'Escenarios operativos', body: 'Los ejemplos que describimos están etiquetados como escenarios, no como casos reales. Preferimos señalar con honestidad una situación reconocible que inflar un logro.'},
        {_key: 'f3', tag: '03', label: 'Profundidad metodológica', body: 'Diagnóstico cuantificado, documentación, seguridad, gobernanza y trazabilidad de la ejecución. El método se sostiene aunque todavía no exista un caso público que lo respalde.'},
      ],
      statement: 'Valme Solutions la dirige Jesús, que responde personalmente por cada mandato admitido.',
      statementSub: 'Si una operación no cumple los criterios de admisión, lo decimos. Preferimos no aceptar un mandato a aceptar uno que no podemos sostener con criterio.',
    },
    contact: {
      eyebrow: '/ Revisión privada',
      heading: 'A company should not depend on improvisation.',
      paragraph: 'Si una operación crítica depende de recordatorios, coordinación manual o conocimiento no documentado, no existe un sistema. Existe una dependencia.',
      cta: {_type: 'cta', label: 'Solicitar una revisión privada', kind: 'whatsapp'},
      footnote: 'Valme Solutions trabaja con un número limitado de mandatos simultáneos.',
    },
    seo: {
      _type: 'seo',
      title: 'Valme Solutions | Private Operations Firm',
      description: 'Growth creates operational debt. We remove it. Intervenimos procesos críticos en compañías que han crecido más rápido que su operativa.',
    },
  })
  console.log('  ✓ homePage')
  console.log('\n✅ Seed completado.')
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
