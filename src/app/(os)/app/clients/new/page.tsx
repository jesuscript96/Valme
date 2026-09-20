import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireMember } from "@/os/auth/dal";
import { PageHeader } from "@/os/ui/primitives";
import { NewClientWizard } from "./NewClientWizard";

export const metadata: Metadata = { title: "Nuevo cliente · Valme OS" };

/** Pantalla 2 del MD: URL → extracción en vivo → revisar → conectar. */
export default async function NewClientPage() {
  const { member } = await requireMember();
  // Comprobación en la página, no sólo escondiendo el botón: un layout no protege.
  if (member.role !== "admin") notFound();

  return (
    <>
      <PageHeader
        title="Nuevo cliente"
        description="Pega la web del cliente. Extraemos identidad visual y mensaje, y tú revisas. En menos de un minuto tienes un Brand Kit para corregir."
      />
      <NewClientWizard />
    </>
  );
}
