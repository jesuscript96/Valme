import { notFound } from "next/navigation";
import { forClient } from "@/os/repo";
import { isConfigured, missingEnv, PROVIDER_LABEL, type ProviderKey } from "@/os/providers/config";
import { API_VERSION } from "@/os/domain/meta";
import { Badge, Button, Card, CardHeader, PageHeader } from "@/os/ui/primitives";

export const metadata = { title: "Integraciones · Valme OS" };

const PROVIDERS: { key: ProviderKey; what: string }[] = [
  { key: "firecrawl", what: "Extrae identidad visual y contenido de la web del cliente." },
  { key: "anthropic", what: "Genera copys, personas y textos de landing con Claude Opus 5." },
  { key: "higgsfield", what: "Genera las imágenes de los anuncios." },
  { key: "resend", what: "Envía el correo de confirmación desde el dominio del cliente." },
  { key: "meta", what: `Crea campañas en pausa. Marketing API ${API_VERSION}.` },
];

export default async function SettingsPage({ params }: { params: Promise<{ client: string }> }) {
  const { client: slug } = await params;
  const scope = await forClient(slug);
  if (scope.role !== "admin") notFound();

  const [kit, integrations] = await Promise.all([scope.brandKit(), scope.integrations()]);
  const meta = integrations.find((i) => i.provider === "meta");
  const resend = integrations.find((i) => i.provider === "resend");

  return (
    <>
      <PageHeader
        title="Integraciones"
        description="Credenciales de plataforma y conexiones por cliente. Las de plataforma van en variables de entorno; las del cliente, cifradas en la base de datos."
      />

      <div className="space-y-6">
        <Card>
          <CardHeader title="Credenciales de plataforma" />
          <ul className="divide-y divide-os-border">
            {PROVIDERS.map((p) => {
              const ok = isConfigured(p.key);
              return (
                <li key={p.key} className="flex items-start gap-4 px-4 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium text-os-text">
                      {PROVIDER_LABEL[p.key]}
                    </span>
                    <span className="block text-[12px] leading-relaxed text-os-muted">{p.what}</span>
                    {!ok ? (
                      <span className="mt-1 block font-mono text-[11px] text-os-warn">
                        Faltan: {missingEnv(p.key).join(", ")}
                      </span>
                    ) : null}
                  </span>
                  <Badge tone={ok ? "ok" : "warn"}>{ok ? "Configurado" : "Sin configurar"}</Badge>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card>
          <CardHeader title={`Conexiones de ${scope.client.name}`} />
          <ul className="divide-y divide-os-border">
            <li className="flex items-center gap-4 px-4 py-3">
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-medium text-os-text">Cuenta publicitaria de Meta</span>
                <span className="os-num block text-[12px] text-os-muted">
                  {meta?.connected
                    ? `${meta.meta.adAccountId} · página ${meta.meta.pageId} · píxel ${meta.meta.pixelId}`
                    : "Sin conectar"}
                </span>
              </span>
              <Button size="sm" disabled={!isConfigured("meta")}>
                {meta?.connected ? "Reconectar" : "Conectar"}
              </Button>
            </li>
            <li className="flex items-center gap-4 px-4 py-3">
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-medium text-os-text">Dominio de envío</span>
                <span className="block text-[12px] text-os-muted">
                  {resend?.connected
                    ? `${resend.meta.sendingDomain} · SPF, DKIM y DMARC verificados`
                    : "Sin verificar"}
                </span>
              </span>
              <Button size="sm" disabled={!isConfigured("resend")}>Verificar</Button>
            </li>
          </ul>
        </Card>

        <Card>
          <CardHeader title="Base legal de la Conversions API" />
          <div className="space-y-3 p-4">
            <Badge tone={kit.legal.capiLegalBasis === "consent" ? "ok" : "warn"}>
              {kit.legal.capiLegalBasis === "consent" ? "Sólo con consentimiento" : "Interés legítimo"}
            </Badge>
            <p className="text-[13px] leading-relaxed text-os-muted">
              El píxel de navegador nunca se carga sin consentimiento. Enviar además el evento
              por servidor cuando la persona ha rechazado cookies es una decisión que firma el
              cliente, no un ajuste por defecto. Por eso el valor por defecto es el
              restrictivo y cambiarlo exige marcarlo aquí a propósito.
            </p>
            <Button size="sm" variant="secondary">Cambiar base legal</Button>
          </div>
        </Card>
      </div>
    </>
  );
}
