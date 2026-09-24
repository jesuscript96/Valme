import type { ReactNode } from "react";

export function AuthShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <section className="w-full max-w-sm border border-border bg-card p-8">
        <img src="/v2/assets/valme-wordmark.svg" alt="VALME" className="h-5 w-auto invert" />
        <p className="mt-2 font-mono text-xs tracking-widest text-muted-foreground">SEARCH OS</p>
        <h1 className="mt-8 text-xl font-semibold">{title}</h1>
        <div className="mt-6">{children}</div>
      </section>
    </main>
  );
}

export const inputCls =
  "w-full border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring";
export const primaryBtn =
  "w-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50";
export const secondaryBtn =
  "w-full border border-border bg-transparent px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-50";

export function Notice({ kind, children }: { kind: "error" | "info"; children: ReactNode }) {
  return (
    <p role={kind === "error" ? "alert" : "status"} className="mt-4 border border-border p-3 text-sm">
      <span className="font-mono text-xs">{kind === "error" ? "ERROR · " : "AVISO · "}</span>
      {children}
    </p>
  );
}
