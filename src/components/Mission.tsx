import { SplitReveal, Reveal } from "./Reveal";

const PRINCIPLES = [
  {
    id: "01",
    title: "La tecnología es medio, no razón",
    body: "No llegamos con una herramienta buscando dónde instalarla. La intervención puede combinar rediseño de procesos, automatización, integración de sistemas, control de datos y cambios en la forma de operar. La decisión la toma el resultado, no la herramienta.",
  },
  {
    id: "02",
    title: "El criterio precede a la ejecución",
    body: "No aceptamos un mandato sin haber cuantificado la exposición operativa y localizado las dependencias críticas. Intervenir sin diagnóstico es improvisar con recursos ajenos.",
  },
  {
    id: "03",
    title: "El sistema supera a la persona",
    body: "Eliminamos procesos que una compañía madura no debería seguir ejecutando manualmente. Una operación crítica no puede depender del recuerdo, el correo o el conocimiento no documentado de una sola persona.",
  },
  {
    id: "04",
    title: "Intervenir sin encerrarse",
    body: "Podemos intervenir revenue, administración, operaciones o dirección sin que la firma quede atrapada en un sector ni en un tipo de solución. Lo que no cambia es el mandato.",
  },
];

export function Mission() {
  return (
    <section id="tesis" className="py-24 md:py-40 px-6 bg-brand-gray-50">
      <div className="max-w-7xl mx-auto">
        <Reveal as="span" className="block font-mono text-xs tracking-[0.35em] uppercase text-gray-400 mb-8">
          / Tesis
        </Reveal>

        <div className="max-w-5xl">
          <SplitReveal
            as="h2"
            className="text-4xl md:text-6xl lg:text-7xl font-normal text-brand-black tracking-tight leading-[1.1] text-balance"
          >
            El crecimiento no solo suma ingresos. Suma complejidad, dependencias y <span className="text-gray-400">pérdida de control.</span>
          </SplitReveal>
        </div>

        <Reveal
          as="p"
          delay={0.1}
          className="mt-10 max-w-3xl text-lg md:text-xl text-gray-600 leading-relaxed font-light"
        >
          Cuando una compañía crece más rápido que su capacidad de sistematizar
          la operación, el control se pierde silenciosamente. El software existe,
          pero la organización sigue funcionando mediante correos, hojas de cálculo
          y recordatorios. Eso no es falta de tecnología: es deuda operativa.
        </Reveal>

        <Reveal
          as="span"
          delay={0.15}
          className="block mt-16 md:mt-20 font-mono text-xs tracking-[0.35em] uppercase text-gray-400 mb-8"
        >
          / Principios
        </Reveal>

        <Reveal
          stagger={0.12}
          y={50}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-gray-200 border-y border-gray-200"
        >
          {PRINCIPLES.map((p) => (
            <div
              key={p.id}
              data-cursor="hover"
              className="group relative bg-brand-gray-50 p-8 pt-10 transition-colors duration-500 hover:bg-white"
            >
              <span className="absolute top-0 left-0 h-px w-0 bg-brand-accent transition-[width] duration-500 ease-out group-hover:w-full" />
              <span className="block text-sm text-gray-400 mb-5 font-mono">/{p.id}</span>
              <h3 className="text-xl font-medium tracking-tight mb-3">{p.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{p.body}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
