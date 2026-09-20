"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signIn, type LoginState } from "@/os/auth/actions";
import { Button, Field, Input } from "@/os/ui/primitives";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" className="w-full" disabled={pending}>
      {pending ? "Entrando…" : "Entrar"}
    </Button>
  );
}

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState<LoginState, FormData>(signIn, { error: null });

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />

      <Field label="Email" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          autoFocus
          placeholder="tu@valmesolutions.com"
        />
      </Field>

      <Field label="Contraseña" htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>

      {state.error ? (
        <p role="alert" className="rounded-md bg-os-accent-soft px-3 py-2 text-[13px] text-os-accent">
          {state.error}
        </p>
      ) : null}

      <Submit />
    </form>
  );
}
