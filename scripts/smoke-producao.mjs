#!/usr/bin/env node
/**
 * Smoke de produção do Aura ID.
 *
 * Uso:
 *   node scripts/smoke-producao.mjs                         # testa a URL oficial
 *   node scripts/smoke-producao.mjs https://preview.vercel.app
 *
 * Verifica o que um visitante e um robô de compartilhamento veem: páginas
 * públicas, canonical/OG apontando para o domínio oficial, arte de
 * compartilhamento, robots, 404 e headers básicos de segurança.
 * Sai com código 1 se algum check obrigatório falhar.
 */

const BASE = (process.argv[2] ?? "https://auraid.app.br").replace(/\/$/, "");
const OFICIAL = "https://auraid.app.br";

const resultados = [];
const registrar = (nome, ok, detalhe = "", obrigatorio = true) => {
  resultados.push({ nome, ok, detalhe, obrigatorio });
};

async function pegar(caminho) {
  const url = `${BASE}${caminho}`;
  try {
    const res = await fetch(url, { redirect: "follow", headers: { "user-agent": "AuraID-Smoke/1.0" } });
    const texto = await res.text().catch(() => "");
    return { ok: true, url, status: res.status, texto, headers: res.headers };
  } catch (erro) {
    return { ok: false, url, erro: erro instanceof Error ? erro.message : String(erro), status: 0, texto: "", headers: new Headers() };
  }
}

async function main() {
  console.log(`\nAura ID · smoke de produção\nBase: ${BASE}\n${"=".repeat(58)}`);

  const raiz = await pegar("/");
  registrar("GET / responde 200", raiz.ok && raiz.status === 200, raiz.ok ? `status ${raiz.status}` : raiz.erro);

  if (raiz.ok) {
    const titulo = /<title>(.*?)<\/title>/is.exec(raiz.texto)?.[1]?.trim() ?? "";
    registrar("Título da página presente", titulo.length > 10, titulo);

    const canonical = /rel="canonical"\s+href="([^"]+)"/i.exec(raiz.texto)?.[1] ?? "";
    registrar("canonical aponta para o domínio oficial", canonical.startsWith(OFICIAL), canonical || "ausente");

    const ogImagem = /property="og:image"\s+content="([^"]+)"/i.exec(raiz.texto)?.[1] ?? "";
    registrar("og:image aponta para o domínio oficial", ogImagem.startsWith(OFICIAL), ogImagem || "ausente");

    registrar("Sem 'undefined'/'NaN' na saída do HTML", !/undefined|NaN/.test(raiz.texto), "");

    const nosniff = raiz.headers.get("x-content-type-options") ?? "";
    registrar("Header X-Content-Type-Options: nosniff", nosniff.toLowerCase() === "nosniff", nosniff || "ausente", false);
    const referrer = raiz.headers.get("referrer-policy") ?? "";
    registrar("Header Referrer-Policy presente", referrer.length > 0, referrer || "ausente", false);
  }

  for (const rota of ["/auth", "/termos", "/privacidade", "/reembolso"]) {
    const r = await pegar(rota);
    registrar(`GET ${rota} responde 200`, r.ok && r.status === 200, r.ok ? `status ${r.status}` : r.erro);
  }

  const og = await pegar("/og-aura-id.png");
  const tipoOg = og.headers.get("content-type") ?? "";
  registrar("Arte de compartilhamento acessível", og.ok && og.status === 200 && tipoOg.includes("image"), `status ${og.status} · ${tipoOg}`);

  const robots = await pegar("/robots.txt");
  registrar("robots.txt acessível", robots.ok && robots.status === 200, `status ${robots.status}`, false);

  const inexistente = await pegar("/rota-que-nao-existe-aura-id");
  registrar("Rota inexistente responde 404", inexistente.ok && inexistente.status === 404, `status ${inexistente.status}`, false);

  console.log("");
  let falhas = 0;
  for (const r of resultados) {
    const marca = r.ok ? "PASS" : r.obrigatorio ? "FAIL" : "INFO";
    if (!r.ok && r.obrigatorio) falhas += 1;
    console.log(`${marca.padEnd(5)} ${r.nome}${r.detalhe ? ` — ${r.detalhe}` : ""}`);
  }
  console.log(`${"=".repeat(58)}\n${resultados.length - falhas} ok · ${falhas} falha(s)\n`);
  process.exit(falhas > 0 ? 1 : 0);
}

main().catch((erro) => {
  console.error("Smoke interrompido:", erro);
  process.exit(1);
});
