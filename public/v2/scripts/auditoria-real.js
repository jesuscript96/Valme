// Ejecución real de auditorías: llama al servidor con la sesión del usuario.
// El servidor comprueba el rol; el navegador nunca decide el permiso.
window.valmeRunRealAudit = async function (domain, services) {
  let token = "";
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("sb-") && k.endsWith("-auth-token")) {
        const s = JSON.parse(localStorage.getItem(k) || "{}");
        token = s.access_token || (s.currentSession && s.currentSession.access_token) || "";
        if (token) break;
      }
    }
  } catch {}
  if (!token) throw new Error("Inicia sesión para ejecutar una auditoría real.");
  const res = await fetch("/api/audit-run", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer " + token },
    body: JSON.stringify({ domain, services }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.ok) throw new Error(body.error || "No se pudo completar la auditoría.");
  return body.result;
};
