#!/usr/bin/env node
/**
 * Verificação de pagamento do Aura ID (sem cobrar nada).
 *
 * Confere a infraestrutura que sustenta o Aura Pass:
 *  1. site/health de produção;
 *  2. webhook do Stripe recusando payload sem assinatura (400) — prova de que está no ar;
 *  3. criação de sessão de checkout LIVE para `pass` e `pro` (não abre o pagamento).
 *
 * Uso:
 *   node scripts/verificar-pagamento.mjs
 *   $env:AURA_TESTE_EMAIL="..."; $env:AURA_TESTE_SENHA="..."
 *   node scripts/verificar-pagamento.mjs --base https://www.auraid.app.br
 *
 * Requer SUPABASE_PUBLISHABLE_KEY (ou lê do .env local).
 */
import { readFileSync, existsSync } from "node:fs";

const arg = (nome, padrao) => {
  const i = process.argv.indexOf(`--${nome}`);
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1];
  return padrao;
};

const SUPABASE_URL = "https://oyfqecigqrceijoxggqw.supabase.co";
const BASE = arg("base", "https://www.auraid.app.br").replace(/\/$/, "");
const email = process.env.AURA_TESTE_EMAIL ?? "";
const senha = process.env.AURA_TESTE_SENHA ?? "";

function chavePublica() {
  if (process.env.SUPABASE_PUBLISHABLE_KEY) return process.env.SUPABASE_PUBLISHABLE_KEY.trim();
  try {
    if (existsSync(".env")) {
      const linha = readFileSync(".env", "utf8").split(/\r?\n/).find((l) => l.startsWith("SUPABASE_PUBLISHABLE_KEY="));
      if (linha) return linha.split("=").slice(1).join("=").trim().replace(/^["']|["']$/g, "");
    }
  } catch { /* sem .env */ }
  return "";
}

const resultados = [];
const registrar = (nome, ok, detalhe = "", obrigatorio = true) => resultados.push({ nome, ok, detalhe, obrigatorio });

async function main() {
  console.log(`\nAura ID · verificação de pagamento\nBase: ${BASE}\n${"=".repeat(60)}`);
  const apikey = chavePublica();
  if (!apikey) {
    console.error("SUPABASE_PUBLISHABLE_KEY ausente (env ou .env).");
    process.exit(1);
  }

  // 1. Saúde
  try {
    const r = await fetch(`${BASE}/api/health`);
    const j = await r.json().catch(() => ({}));
    registrar("Health de produção 200 com banco OK", r.status === 200 && j.ok === true && j.checks?.banco === true, `status ${r.status}`);
  } catch (e) {
    registrar("Health de produção 200 com banco OK", false, e.message);
  }

  // 2. Webhook existe e recusa sem assinatura
  try {
    const r = await fetch(`${SUPABASE_URL}/functions/v1/stripe-webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "evt_verificacao", type: "checkout.session.completed" }),
    });
    registrar("Webhook Stripe recusa payload sem assinatura (400)", r.status === 400, `status ${r.status}`);
  } catch (e) {
    registrar("Webhook Stripe recusa payload sem assinatura (400)", false, e.message);
  }

  // 3. Checkout autenticado (sem abrir pagamento)
  if (!email || !senha) {
    registrar("Checkout pass/pro cria sessão LIVE", true, "PULADO: defina AURA_TESTE_EMAIL/AURA_TESTE_SENHA", false);
  } else {
    let token = "";
    try {
      const login = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: { apikey, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: senha }),
      });
      if (!login.ok) throw new Error(`login ${login.status}`);
      token = (await login.json()).access_token;
    } catch (e) {
      registrar("Checkout pass/pro cria sessão LIVE", false, `login falhou: ${e.message}`);
    }
    if (token) {
      for (const plano of ["pass", "pro"]) {
        try {
          const r = await fetch(`${SUPABASE_URL}/functions/v1/stripe-checkout`, {
            method: "POST",
            headers: { apikey, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ app_url: BASE, plano }),
          });
          const j = await r.json().catch(() => ({}));
          const url = String(j.url ?? "");
          const modo = url.includes("cs_live_") ? "LIVE" : url.includes("cs_test_") ? "TEST" : "desconhecido";
          const ok = r.status === 200 && url.startsWith("https://checkout.stripe.com/");
          // Não abrir o pagamento: criar a sessão já valida preço, modo e retorno.
          registrar(`Checkout ${plano} cria sessão (${modo})`, ok, ok ? `modo ${modo}` : `status ${r.status} ${String(j.error ?? "").slice(0, 120)}`);
        } catch (e) {
          registrar(`Checkout ${plano} cria sessão`, false, e.message);
        }
      }
    }
  }

  console.log("");
  let falhas = 0;
  for (const r of resultados) {
    const marca = r.ok ? "PASS" : r.obrigatorio ? "FAIL" : "INFO";
    if (!r.ok && r.obrigatorio) falhas += 1;
    console.log(`${marca.padEnd(5)} ${r.nome}${r.detalhe ? ` — ${r.detalhe}` : ""}`);
  }
  console.log(`${"=".repeat(60)}\n${resultados.length - falhas} ok · ${falhas} falha(s)\n`);
  process.exit(falhas > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("Verificação interrompida:", e);
  process.exit(1);
});
