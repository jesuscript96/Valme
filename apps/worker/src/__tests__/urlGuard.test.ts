import { strict as assert } from "node:assert";
import { test } from "node:test";
import { crearGuarda, ipPrivada } from "../urlGuard";

const dns = (tabla: Record<string, string[]>) => async (host: string) => {
  if (!(host in tabla)) throw new Error("NXDOMAIN");
  return tabla[host];
};

test("las direcciones privadas, locales y de metadatos se reconocen", () => {
  for (const ip of ["10.0.0.5", "127.0.0.1", "172.20.1.1", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "192.0.2.10", "192.0.0.8", "::1", "fd00::1", "fe80::1", "::ffff:10.0.0.1"]) {
    assert.equal(ipPrivada(ip), true, ip);
  }
  // 192.0.43.8 es iana.org: público aunque empiece por 192.0.
  for (const ip of ["8.8.8.8", "176.9.117.155", "192.0.43.8", "172.66.147.243", "2a01:4f8::1"]) {
    assert.equal(ipPrivada(ip), false, ip);
  }
});

test("bloquea esquemas que no son http(s) y URLs con credenciales", async () => {
  const g = crearGuarda(dns({}));
  await assert.rejects(g.comprobar("file:///etc/passwd"), /sólo se permite http/);
  await assert.rejects(g.comprobar("https://user:pass@ejemplo.es"), /credenciales/);
  await assert.rejects(g.comprobar("no es una url"), /no es una URL/);
});

test("bloquea localhost y las IPs privadas escritas a mano", async () => {
  const g = crearGuarda(dns({}));
  await assert.rejects(g.comprobar("http://localhost:3000"), /nombre local/);
  await assert.rejects(g.comprobar("http://10.0.0.5:8000/admin"), /privada/);
  await assert.rejects(g.comprobar("http://[::1]/"), /privada/);
});

test("bloquea un dominio que resuelve a la red interna", async () => {
  const g = crearGuarda(dns({ "interno.ejemplo.es": ["8.8.8.8", "10.1.2.3"] }));
  await assert.rejects(g.comprobar("https://interno.ejemplo.es"), /dirección privada \(10\.1\.2\.3\)/);
});

test("deja pasar un dominio público y cachea la resolución", async () => {
  let consultas = 0;
  const g = crearGuarda(async () => { consultas++; return ["93.184.216.34"]; });
  await g.comprobar("https://ejemplo.es/a");
  await g.comprobar("https://ejemplo.es/b");
  assert.equal(consultas, 1);
});
