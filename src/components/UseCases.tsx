const cases = [
  {
    id: "01",
    title: "Marketing",
    description: "Modelos predictivos para segmentación, generación automática de copys y análisis de sentimiento a escala.",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2970&auto=format&fit=crop"
  },
  {
    id: "02",
    title: "Ventas",
    description: "Scoring de leads autónomo, agentes conversacionales para prospección 24/7 y previsión de demanda inteligente.",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2970&auto=format&fit=crop"
  },
  {
    id: "03",
    title: "Finanzas",
    description: "Reconciliación contable automatizada, detección de anomalías en tiempo real y proyecciones de flujo de caja.",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop"
  },
  {
    id: "04",
    title: "Operaciones",
    description: "Optimización de cadenas de suministro, logística predictiva y automatización de procesos de back-office.",
    image: "https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?q=80&w=2600&auto=format&fit=crop"
  },
  {
    id: "05",
    title: "Producto & Tecnología",
    description: "Análisis masivo de feedback de usuarios, QA automatizado y despliegue continuo de infraestructuras.",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2970&auto=format&fit=crop"
  },
  {
    id: "06",
    title: "Administración",
    description: "Extracción de datos de documentos, gestión de contratos mediante NLP y flujos de aprobación inteligentes.",
    image: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2970&auto=format&fit=crop"
  }
];

export function UseCases() {
  return (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-6 py-24">
        <h2 className="text-3xl md:text-5xl font-normal tracking-tight mb-20 text-brand-black">
          Casos de Uso
        </h2>
        
        <div className="flex flex-col gap-32">
          {cases.map((useCase, index) => (
            <div 
              key={useCase.id} 
              className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-16 lg:gap-24`}
            >
              {/* Text Content */}
              <div className="w-full lg:w-1/2 flex flex-col items-start">
                <span className="text-sm font-mono text-gray-400 mb-6 border-b border-gray-200 pb-2 w-12">
                  /{useCase.id}
                </span>
                <h3 className="text-5xl md:text-7xl font-normal tracking-tight mb-6 text-brand-black">
                  {useCase.title}
                </h3>
                <p className="text-lg md:text-xl text-gray-500 leading-relaxed max-w-md">
                  {useCase.description}
                </p>
              </div>

              {/* Media Content */}
              <div className="w-full lg:w-1/2 aspect-[4/3] bg-gray-100 relative overflow-hidden group">
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105 filter grayscale hover:grayscale-0"
                  style={{ backgroundImage: `url(${useCase.image})` }}
                />
                <div className="absolute inset-0 border border-black/5 pointer-events-none" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
