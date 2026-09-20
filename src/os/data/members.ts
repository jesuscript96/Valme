import type { Role } from "@/os/auth/session";

/**
 * El equipo, a mano. En el Sprint 1 esto lo sustituye `auth.users` + `memberships`
 * en Supabase; la forma del objeto es la misma para que el cambio sea de origen de
 * datos y no de modelo.
 */
export type Member = {
  id: string;
  email: string;
  name: string;
  role: Role;
  /** Clientes a los que tiene acceso. `"*"` = todos (sólo admin). */
  clients: string[] | "*";
};

export const MEMBERS: Member[] = [
  {
    id: "u_juan",
    email: "juan@valmesolutions.com",
    name: "Juan",
    role: "admin",
    clients: "*",
  },
  {
    id: "u_jesus",
    email: "jesus@valmesolutions.com",
    name: "Jesús",
    role: "admin",
    clients: "*",
  },
  {
    id: "u_estratega",
    email: "estrategia@valmesolutions.com",
    name: "Estrategia",
    role: "strategist",
    clients: ["nordic-clinic", "taller-rivas"],
  },
  {
    id: "u_ejecutor",
    email: "operaciones@valmesolutions.com",
    name: "Operaciones",
    role: "operator",
    clients: ["nordic-clinic"],
  },
];

export function findMemberByEmail(email: string): Member | undefined {
  const e = email.trim().toLowerCase();
  return MEMBERS.find((m) => m.email.toLowerCase() === e);
}

export function memberById(id: string): Member | undefined {
  return MEMBERS.find((m) => m.id === id);
}

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin",
  strategist: "Estratega",
  operator: "Ejecutor",
};
