import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Entrar · Valme OS" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="flex min-h-dvh items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <p className="font-display text-lg font-semibold tracking-tight text-os-text">
            Valme <span className="text-os-accent">OS</span>
          </p>
          <p className="mt-1 text-[13px] text-os-muted">Área interna</p>
        </div>

        <LoginForm next={next ?? "/app"} />

        <p className="mt-8 text-xs leading-relaxed text-os-faint">
          Acceso restringido al equipo de Valme Solutions.
        </p>
      </div>
    </main>
  );
}
