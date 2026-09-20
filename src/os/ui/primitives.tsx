import type { ComponentProps, ReactNode } from "react";

/**
 * Primitivas del área. A mano, con los tokens `--color-os-*`.
 *
 * Se descartó shadcn/ui: sus 10 primitivas equivalentes son una hora de trabajo, y
 * hacerlas aquí mantiene el área alineada con la estética de la marca en vez de con la
 * de un tema por defecto. Si más adelante hace falta un combobox o un diálogo modal de
 * verdad, se añade Radix sólo para esa pieza.
 */

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

// --- Button ----------------------------------------------------------------

type ButtonProps = ComponentProps<"button"> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
};

const BTN_BASE =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors " +
  "disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap";

const BTN_VARIANT = {
  primary: "bg-os-text text-white hover:bg-black",
  secondary: "bg-os-surface text-os-text border border-os-border hover:bg-os-sunken",
  ghost: "text-os-muted hover:bg-os-sunken hover:text-os-text",
  danger: "bg-os-accent text-white hover:brightness-95",
} as const;

const BTN_SIZE = { sm: "h-7 px-2.5 text-[13px]", md: "h-9 px-3.5 text-sm" } as const;

export function Button({ variant = "secondary", size = "md", className, ...rest }: ButtonProps) {
  return <button className={cx(BTN_BASE, BTN_VARIANT[variant], BTN_SIZE[size], className)} {...rest} />;
}

// --- Inputs ----------------------------------------------------------------

const FIELD =
  "w-full rounded-md border border-os-border bg-os-surface px-3 py-2 text-sm text-os-text " +
  "placeholder:text-os-faint focus:border-os-border-strong";

export function Input({ className, ...rest }: ComponentProps<"input">) {
  return <input className={cx(FIELD, "h-9", className)} {...rest} />;
}

export function Textarea({ className, ...rest }: ComponentProps<"textarea">) {
  return <textarea className={cx(FIELD, "min-h-20 resize-y leading-relaxed", className)} {...rest} />;
}

export function Select({ className, ...rest }: ComponentProps<"select">) {
  return <select className={cx(FIELD, "h-9 pr-8", className)} {...rest} />;
}

export function Field({
  label, hint, children, htmlFor,
}: { label: string; hint?: ReactNode; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-[13px] font-medium text-os-text">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-os-muted">{hint}</p> : null}
    </div>
  );
}

// --- Surfaces --------------------------------------------------------------

export function Card({ className, ...rest }: ComponentProps<"div">) {
  return <div className={cx("rounded-lg border border-os-border bg-os-surface", className)} {...rest} />;
}

export function CardHeader({ title, action }: { title: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-os-border px-4 py-3">
      <h2 className="text-[13px] font-semibold tracking-tight text-os-text">{title}</h2>
      {action}
    </div>
  );
}

// --- Badge -----------------------------------------------------------------

const TONE = {
  neutral: "bg-os-sunken text-os-muted",
  ok: "bg-os-ok-soft text-os-ok",
  warn: "bg-os-warn-soft text-os-warn",
  accent: "bg-os-accent-soft text-os-accent",
  info: "bg-os-info-soft text-[#2c4a8f]",
} as const;

export type Tone = keyof typeof TONE;

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={cx("inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium", TONE[tone])}>
      {children}
    </span>
  );
}

// --- Estados vacíos --------------------------------------------------------

export function EmptyState({
  title, body, action,
}: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-os-border bg-os-surface px-6 py-14 text-center">
      <p className="text-sm font-medium text-os-text">{title}</p>
      <p className="max-w-md text-[13px] leading-relaxed text-os-muted">{body}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

// --- Cabecera de pantalla --------------------------------------------------

export function PageHeader({
  title, description, action,
}: { title: string; description?: string; action?: ReactNode }) {
  return (
    <header className="mb-6 flex items-start justify-between gap-6">
      <div>
        <h1 className="font-display text-xl font-semibold tracking-tight text-os-text">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-os-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

// --- Tabla -----------------------------------------------------------------

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-os-border bg-os-surface">
      <table className="w-full border-collapse text-left text-[13px]">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <th className={cx("border-b border-os-border px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-os-faint", className)}>
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cx("border-b border-os-border px-3 py-2.5 align-middle text-os-text", className)}>{children}</td>;
}
