# Piloto del agente HTTP (staging)

Primera comprobacion determinista, no un agente LLM ni una auditoria SEO completa.
Solo hace un GET HTTPS de la portada de VALME, sin seguir redirecciones. Registra
estado HTTP, Content-Type, X-Robots-Tag, bytes y fecha como evidencia del hallazgo.
No analiza HTML, rankings, demanda, conversiones ni responde automaticamente a H-01.

En Seguimiento de una investigacion pendiente, usar `Probar agente HTTP VALME`.
Requiere PM activo, permisos RLS de escritura, auditoria autorizada en ejecucion y
portada incluida en el alcance con `fetch_public_html`. El destino se deriva del
registro de auditoria, nunca del navegador. Solo funciona con el modo remoto staging.

La tarea pasa a en curso mediante una actualizacion condicional antes de navegar.
Se conserva abierta para revision humana. El ejecutor real es `VALME HTTP probe v1`,
independientemente del agente nominal asignado a la tarea. No cierra investigaciones
ni cambia decisiones del PM. Una segunda solicitud sobre la misma tarea no ejecuta.

Limites: DNS 2 segundos, lectura 4 segundos, 512 KB, sin redirecciones. DNS validado
y fijado a IPv4 publica para la conexion TLS. No se envian cookies ni credenciales.

Si falla o se interrumpe, la tarea queda en curso; revisar Evidencias antes de cerrarla.
El guardado de evidencia, enlace y nota no es una transaccion: pueden quedar resultados
parciales si falla una escritura. No hay reintentos automaticos ni recuperacion de jobs.
No habilitar en produccion. Pendiente de prueba autenticada end-to-end en staging.
