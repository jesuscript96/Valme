import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { MessageCircle, ArrowUpRight } from "lucide-react";

const WA_NUMBER = "34600412492";
const WA_MESSAGE =
  "Hola, me gustaría solicitar una revisión privada con Valme Solutions.";
export const WA_LINK = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
  WA_MESSAGE
)}`;

const WhatsAppContext = createContext<{ open: () => void }>({ open: () => {} });

export const useWhatsApp = () => useContext(WhatsAppContext);

export function WhatsAppProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const show = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);
  const confirm = useCallback(() => {
    window.open(WA_LINK, "_blank", "noopener,noreferrer");
    setOpen(false);
  }, []);

  // Lock background scroll + allow Escape to dismiss while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  return (
    <WhatsAppContext.Provider value={{ open: show }}>
      {children}

      {/* Confirmation modal — sits below the custom cursor (z-90). */}
      <div
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
        className={`fixed inset-0 z-[88] flex items-center justify-center px-6 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          onClick={close}
          className="absolute inset-0 bg-brand-black/70 backdrop-blur-sm"
        />
        <div
          className={`relative z-10 w-full max-w-md bg-white rounded-2xl p-8 md:p-10 shadow-[0_24px_80px_rgba(0,0,0,0.35)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            open ? "translate-y-0 scale-100" : "translate-y-4 scale-95"
          }`}
        >
          <div className="flex items-center gap-2 mb-6">
            <MessageCircle className="w-5 h-5 text-brand-accent" strokeWidth={1.75} />
            <span className="font-mono text-xs tracking-[0.3em] uppercase text-gray-400">
              WhatsApp
            </span>
          </div>

          <h3 className="font-display text-2xl md:text-3xl font-medium tracking-tight mb-4">
            Solicitar una revisión privada
          </h3>
          <p className="text-gray-600 leading-relaxed mb-8">
            Va a hablar con Jesús, que dirige Valme Solutions y responde
            personalmente por cada mandato admitido. Será dirigido a WhatsApp
            para concretar la revisión.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={confirm}
              data-cursor="hover"
              className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-black text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors"
            >
              Sí, abrir WhatsApp
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
            <button
              onClick={close}
              data-cursor="hover"
              className="px-6 py-3.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-full hover:bg-gray-50 hover:text-black transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </WhatsAppContext.Provider>
  );
}
