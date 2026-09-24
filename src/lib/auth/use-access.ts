import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyAccess, logSessionEvent } from "@/lib/access.functions";
import { supabase } from "@/integrations/supabase/client";

export function useMyAccess() {
  const fn = useServerFn(getMyAccess);
  return useQuery({ queryKey: ["my-access"], queryFn: () => fn(), staleTime: 60_000, retry: false });
}

export const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super Admin",
  project_manager: "Project Manager",
  equipo: "Equipo",
  cliente: "Cliente",
};

export async function signOutValme(log: ReturnType<typeof useServerFn<typeof logSessionEvent>>, clear: () => void) {
  try {
    await log({ data: { action: "logout" } });
  } catch {
    /* el cierre de sesión no depende del registro */
  }
  clear();
  await supabase.auth.signOut();
}
