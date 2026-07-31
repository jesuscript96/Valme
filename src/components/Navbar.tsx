import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import logo from "../../assets/tomato_slice_logo.png";
import { gsap, EASE } from "../lib/gsap";
import { Magnetic } from "./Magnetic";
import { useSmoothScroll } from "./SmoothScroll";
import { useWhatsApp } from "./WhatsApp";

// [label, section id on the home page]
const LINKS: [string, string][] = [
  ["Tesis", "tesis"],
  ["Intervención", "intervencion"],
  ["Mandato", "mandato"],
  ["Admisión", "admision"],
  ["Contacto", "contacto"],
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrollTo, stop, start } = useSmoothScroll();
  const { open: openWhatsApp } = useWhatsApp();
  const menuRef = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();
  const isHome = pathname === "/";

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > window.innerHeight * 0.85);
      setHidden(y > lastY && y > window.innerHeight && !menuOpen);
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [menuOpen]);

  // Links start hidden so each open re-runs the stagger.
  useLayoutEffect(() => {
    const el = menuRef.current;
    if (el) gsap.set(el.querySelectorAll(".m-link"), { yPercent: 120, opacity: 0 });
  }, []);

  // Open/close: lock background scroll and stagger the links in.
  useEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const links = el.querySelectorAll(".m-link");
    if (menuOpen) {
      stop();
      document.body.style.overflow = "hidden";
      gsap.to(links, {
        yPercent: 0,
        opacity: 1,
        duration: 0.6,
        ease: EASE,
        stagger: 0.07,
        delay: 0.18,
      });
    } else {
      start();
      document.body.style.overflow = "";
      gsap.set(links, { yPercent: 120, opacity: 0 });
    }
  }, [menuOpen, stop, start]);

  const unlock = () => {
    setMenuOpen(false);
    start();
    document.body.style.overflow = "";
  };

  // Section link: smooth-scroll on home, otherwise let the Link navigate
  // to /#id and ScrollManager handles the scroll after Home mounts.
  // "Contacto" is special: it opens the WhatsApp confirmation instead.
  const onSection = (e: MouseEvent, id: string) => {
    if (id === "contacto") {
      e.preventDefault();
      unlock();
      openWhatsApp();
      return;
    }
    unlock();
    if (isHome) {
      e.preventDefault();
      const node = document.getElementById(id);
      if (node) scrollTo(node, -20);
    }
  };

  const onLogo = (e: MouseEvent) => {
    unlock();
    if (isHome) {
      e.preventDefault();
      scrollTo(0);
    }
  };

  // Over the dark hero (or with the menu open) use the white-on-dark treatment.
  const onDark = menuOpen || !scrolled;

  return (
    <>
      <div
        className={`fixed top-0 left-0 right-0 z-[78] flex justify-center px-4 md:px-8 pointer-events-none transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          hidden ? "-translate-y-[150%]" : "translate-y-6"
        }`}
      >
        <header
          className={`pointer-events-auto flex w-full max-w-7xl items-center justify-between px-5 py-2.5 rounded-2xl border transition-colors duration-500 ${
            !onDark
              ? "bg-white/70 backdrop-blur-xl border-black/5 shadow-[0_8px_32px_rgba(0,0,0,0.08)]"
              : "bg-white/5 backdrop-blur-md border-white/10"
          }`}
        >
          <Link to="/" onClick={onLogo} className="flex items-center gap-2.5">
            <span className="grid place-items-center w-7 h-7 rounded-md bg-white shrink-0">
              <img
                src={logo}
                alt="Valme"
                className="w-5 h-5 object-contain mix-blend-multiply"
              />
            </span>
            <span
              className={`text-lg font-semibold tracking-tight font-display transition-colors duration-500 ${
                onDark ? "text-white" : "text-black"
              }`}
            >
              Valme
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {LINKS.slice(0, 4).map(([label, id]) => (
              <Link
                key={id}
                to={`/#${id}`}
                onClick={(e) => onSection(e, id)}
                className={`text-sm tracking-tight transition-colors ${
                  onDark
                    ? "text-white/60 hover:text-white"
                    : "text-gray-500 hover:text-black"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Magnetic strength={0.4}>
              <Link
                to="/#contacto"
                onClick={(e) => onSection(e, "contacto")}
                className={`hidden md:inline-flex px-6 py-2 text-sm font-medium rounded-full transition-colors ${
                  onDark
                    ? "bg-white text-black hover:bg-white/90"
                    : "bg-black text-white hover:bg-gray-800"
                }`}
              >
                Revisión privada
              </Link>
            </Magnetic>
            <button
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className={`lg:hidden p-2 rounded-full border transition-colors ${
                onDark
                  ? "border-white/15 text-white hover:bg-white/10"
                  : "border-black/10 text-gray-800 hover:bg-black/5"
              }`}
            >
              {menuOpen ? (
                <X className="w-4 h-4" strokeWidth={1.5} />
              ) : (
                <Menu className="w-4 h-4" strokeWidth={1.5} />
              )}
            </button>
          </div>
        </header>
      </div>

      {/* Mobile full-screen menu */}
      <div
        ref={menuRef}
        className={`fixed inset-0 z-[76] flex flex-col justify-center bg-brand-black px-8 lg:hidden transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
          menuOpen ? "translate-y-0" : "-translate-y-full pointer-events-none"
        }`}
      >
        <nav className="flex flex-col gap-2">
          {LINKS.map(([label, id]) => (
            <div key={id} className="overflow-hidden">
              <Link
                to={`/#${id}`}
                onClick={(e) => onSection(e, id)}
                className="m-link block font-display text-white text-5xl sm:text-6xl font-medium tracking-tighter py-1.5"
              >
                {label}
              </Link>
            </div>
          ))}
        </nav>
        <div className="mt-16 overflow-hidden">
          <p className="m-link font-mono text-xs tracking-[0.3em] uppercase text-white/40">
            Valme Solutions — Private Operations Firm
          </p>
        </div>
      </div>
    </>
  );
}
