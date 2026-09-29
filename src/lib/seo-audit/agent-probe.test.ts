import assert from "node:assert/strict";
import { test } from "node:test";
import { pilotUrl, publicIpv4 } from "./agent-probe.server";

test("pilot accepts only the exact public VALME HTTPS homepage", () => {
  assert.equal(pilotUrl("www.valmesolutions.com").href, "https://www.valmesolutions.com/");
  for (const value of [
    "http://valmesolutions.com",
    "https://valmesolutions.com:444",
    "https://user:pass@valmesolutions.com",
    "valmesolutions.com.evil.example",
    "https://valmesolutions.com/private",
    "https://valmesolutions.com/?secret=x",
    "https://valmesolutions.com/#x",
    "localhost",
    "127.0.0.1",
    "[::1]",
  ]) {
    assert.throws(() => pilotUrl(value), value);
  }
});

test("network policy rejects private, loopback, link-local and reserved IPv4", () => {
  for (const ip of [
    "0.1.2.3",
    "10.0.0.1",
    "127.0.0.1",
    "169.254.169.254",
    "172.16.0.1",
    "192.168.1.1",
    "100.64.0.1",
    "198.18.0.1",
    "192.0.2.1",
    "224.0.0.1",
    "255.255.255.255",
    "::1",
    "999.1.1.1",
  ])
    assert.equal(publicIpv4(ip), false, ip);
  assert.equal(publicIpv4("8.8.8.8"), true);
});
