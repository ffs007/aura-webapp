#!/usr/bin/env node
/**
 * Verificador de bloqueios de lançamento do Aura ID.
 *
 * Roda SOMENTE LEITURA por padrão. Fases que escrevem (criar/limpar conta,
 * upload de teste) exigem flags explícitas:
 *
 *   node scripts/verificar-lancamento.mjs
 *   node scripts/verificar-lancamento.mjs --escrita
 *   node scripts/verificar-lancamento.mjs --criar-conta-teste
 *   node scripts/verificar-lancamento.mjs --verificar-exclusao
 *   node scripts/verificar-lancamento.mjs --limpar --sim
 *   node scripts/verificar-lancamento.mjs --json scripts/resultado.json
 *
 * As chaves são lidas de .env / .env.local / .env.aura-id (nunca versionadas)
 * e NUNCA são impressas: a saída mostra apenas presença, host e prefixo curto.
 */
import { readFileSync, existsSync, writeFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const RAIZ = dirname(dirname(fileURLToPath(import.meta.url)));
const ARQ_CONTA = join(RAIZ, "scripts", ".verificacao-conta.json");

const argv = process.argv.slice(2);
const flag = (nome) => argv.includes(nome);
const valor = (nome) => {
  const i = argv.indexOf(nome);
  return i >= 0 ? argv[i + 1] : undefined;
};

if (flag("--help") || flag("-h")) {
  console.log(`
Uso: node scripts/verificar-lancamento.mjs [opções]

  --json <arquivo>        também grava o resultado em JSON
  --escrita               testa upload/remoção no bucket user-photos (cria e apaga um arquivo dummy)
  --criar-conta-teste     cria uma conta descartável com dados mínimos e imprime o passo manual de exclusão
  --verificar-exclusao    confere se a conta criada (e os dados/storage dela) foi realmente apagada
  --limpar                lista contas teste.* (dry-run)
  --limpar --sim          apaga de verdade as contas teste.* listadas (cuidado!)
  --sem-cores             desliga cores
  -h, --help              esta ajuda

Chaves lidas de .env / .env.local / .env.aura-id, ou de variáveis de ambiente.
`);
  process.exit(0);
}

/* -------------------------------------------------------------------------- */
/*  Base                                                                      */
/* -------------------------------------------------------------------------- */

const cores = !flag("--sem-cores") && process.stdout.isTTY;
const c = {
  ok: (t) => (cores ? `\x1b[32m${t}\x1b[0m` : t),
  falha: (t) => (cores ? `\x1b[31m${t}\x1b[0m` : t),
  aviso: (t) => (cores ? `\x1b[33m${t}\x1b[0m` : t),
  fraco: (t) => (cores ? `\x1b[90m${t}\x1b[0m` : t),
  titulo: (t) => (cores ? `\x1b[1m${t}\x1b[0m` : t),
};

const resultados = [];
function anotar(nivel, id, titulo, detalhe = "") {
  resultados.push({ nivel, id, titulo, detalhe });
  const etiqueta =
    nivel === "PASS" ? c.ok("PASS") : nivel === "FAIL" ? c.falha("FAIL") : nivel === "WARN" ? c.aviso("WARN") : c.fraco("SKIP");
  console.log(`[${etiqueta}] ${id.padEnd(4)} ${titulo}${detalhe ? c.fraco(" — " + detalhe) : ""}`);
}
const pass = (id, t, d) => anotar("PASS", id, t, d);
const fail = (id, t, d) => anotar("FAIL", id, t, d);
const warn = (id, t, d) => anotar("WARN", id, t, d);
const skip = (id, t, d) => anotar("SKIP", id, t, d);
const secao = (t) => console.log(`\n${c.titulo("── " + t)}`);

function mascarar(v) {
  if (!v) return "(ausente)";
  if (v.length <= 10) return "••••";
  return `${v.slice(0, 6)}…(${v.length} caracteres)`;
}

function carregarEnv() {
  const env = { ...process.env };
  for (const nome of [".env", ".env.local", ".env.aura-id"]) {
    const caminho = join(RAIZ, nome);
    if (!existsSync(caminho)) continue;
    for (const linha of readFileSync(caminho, "utf8").split(/\r?\n/)) {
      const m = linha.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (!env[m[1]]) env[m[1]] = v;
    }
  }
  return env;
}

const env = carregarEnv();
const URL_SB = (env.SUPABASE_URL ?? env.VITE_SUPABASE_URL ?? "").replace(/\/+$/, "");
const ANON = env.SUPABASE_PUBLISHABLE_KEY ?? env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const APP = (env.APP_URL ?? "http://localhost:8080").replace(/\/+$/, "");
const ref = (() => {
  try {
    return new URL(URL_SB).host.split(".")[0];
  } catch {
    return "";
  }
})();

const headersAnon = () => ({ apikey: ANON, Authorization: `Bearer ${ANON}` });
const headersService = () => ({ apikey: SERVICE, Authorization: `Bearer ${SERVICE}` });

async function pedir(url, { method = "GET", headers = {}, body, timeout = 15000 } = {}) {
  try {
    const res = await fetch(url, {
      method,
      headers: body !== undefined ? { "content-type": "application/json", ...headers } : headers,
      body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
      signal: AbortSignal.timeout(timeout),
    });
    const texto = await res.text().catch(() => "");
    let json = null;
    try {
      json = JSON.parse(texto);
    } catch {
      /* nem toda resposta é JSON */
    }
    return { ok: res.ok, status: res.status, headers: res.headers, texto, json };
  } catch (e) {
    const tipo = e?.name === "TimeoutError" ? "timeout" : String(e?.message ?? e);
    return { ok: false, status: 0, headers: new Headers(), texto: "", json: null, erro: tipo };
  }
}

/* -------------------------------------------------------------------------- */
/*  Subcomandos                                                               */
/* -------------------------------------------------------------------------- */

function lerContaSalva() {
  try {
    return JSON.parse(readFileSync(ARQ_CONTA, "utf8"));
  } catch {
    return null;
  }
}

async function listarUsuarios() {
  const todos = [];
  for (let pagina = 1; pagina <= 5; pagina++) {
    const r = await pedir(`${URL_SB}/auth/v1/admin/users?page=${pagina}&per_page=200`, { headers: headersService() });
    if (!r.ok) return { erro: r, usuarios: todos };
    const lista = r.json?.users ?? [];
    todos.push(...lista);
    if (lista.length < 200) break;
  }
  return { usuarios: todos };
}

async function listarStorage(bucket, prefixo) {
  const r = await pedir(`${URL_SB}/storage/v1/object/list/${bucket}`, {
    method: "POST",
    headers: headersService(),
    body: { prefix: prefixo, limit: 100, offset: 0 },
  });
  if (!r.ok) return { erro: r, itens: [] };
  const itens = Array.isArray(r.json) ? r.json : [];
  return { itens, erro: null };
}

async function apagarPastaStorage(bucket, prefixo) {
  const { itens, erro } = await listarStorage(bucket, prefixo);
  if (erro) return { apagados: 0, erro };
  const caminhos = itens.filter((i) => i.name).map((i) => `${prefixo}/${i.name}`.replace(/\/+/g, "/"));
  if (!caminhos.length) return { apagados: 0, erro: null };
  const r = await pedir(`${URL_SB}/storage/v1/object/${bucket}`, { method: "DELETE", headers: headersService(), body: { prefixes: caminhos } });
  return { apagados: caminhos.length, erro: r.ok ? null : r };
}

async function criarContaTeste() {
  secao("9. Conta descartável para testar exclusão");
  if (!SERVICE) {
    fail("9.0", "SUPABASE_SERVICE_ROLE_KEY ausente", "sem ela não é possível criar a conta de teste");
    return;
  }
  const email = `teste.exclusao.${Date.now()}@example.com`;
  const senha = "AuraTeste#2026";
  const criada = await pedir(`${URL_SB}/auth/v1/admin/users`, {
    method: "POST",
    headers: headersService(),
    body: { email, password: senha, email_confirm: true, user_metadata: { nome: "Conta de verificação" } },
  });
  const id = criada.json?.id ?? criada.json?.user?.id;
  if (!criada.ok || !id) {
    fail("9.1", "Não foi possível criar a conta descartável", `HTTP ${criada.status} ${String(criada.json?.msg ?? criada.texto ?? "").slice(0, 120)}`);
    return;
  }
  pass("9.1", "Conta descartável criada", `${email} · id ${id.slice(0, 8)}…`);

  const seeds = [
    ["consents", { user_id: id, photo_processing: false, personalization: false, reminders: false }],
    ["visual_profiles", { user_id: id, completed: true, mode: "quick", data: {} }],
    [
      "packages",
      {
        user_id: id,
        batch_id: randomUUID(),
        entry_mode: "general",
        content: {
          title: `Sugestão de verificação — ${email}`,
          invitation: "Só para checar a exclusão de conta.",
          why_it_works: "Dado de teste. Pode apagar.",
          steps: [],
          risks: [],
          event_checklist: [],
          cost_note: "",
        },
        context: {},
        status: "new",
      },
    ],
    ["reminders", { user_id: id, title: `Lembrete de verificação — ${email}`, due_at: new Date(Date.now() + 86_400_000).toISOString() }],
    ["collections", { user_id: id, name: `Coleção de verificação — ${email}`, package_ids: [] }],
  ];
  let seedsOk = 0;
  for (const [tabela, corpo] of seeds) {
    const r = await pedir(`${URL_SB}/rest/v1/${tabela}`, { method: "POST", headers: { ...headersService(), Prefer: "return=minimal" }, body: corpo });
    if (r.ok) seedsOk++;
    else warn("9.2", `Seed falhou em ${tabela}`, `HTTP ${r.status} ${String(r.texto).slice(0, 100)}`);
  }
  if (seedsOk === seeds.length) pass("9.2", "Dados de teste criados", "consents, visual_profiles, packages, reminders, collections");
  else warn("9.2", "Dados de teste parcialmente criados", `${seedsOk}/${seeds.length} tabelas`);

  const fotoPath = `${id}/verificacao-${Date.now()}.txt`;
  const up = await pedir(`${URL_SB}/storage/v1/object/user-photos/${fotoPath}`, {
    method: "POST",
    headers: { ...headersService(), "content-type": "text/plain", "x-upsert": "false" },
    body: "verificacao",
  });
  if (up.ok) pass("9.3", "Foto de teste no storage criada", `user-photos/${fotoPath.slice(0, 20)}…`);
  else warn("9.3", "Não foi possível criar foto de teste", `HTTP ${up.status} — exclusão de storage será validada só pelo fluxo da UI`);

  writeFileSync(ARQ_CONTA, JSON.stringify({ id, email, senha, criadoEm: new Date().toISOString(), fotoPath }, null, 2));

  console.log(`
${c.titulo("Agora o passo manual (2 minutos):")}
  1. Abra ${APP}/auth e entre com:
       e-mail: ${email}
       senha:  ${senha}
  2. Vá em ${APP}/settings → "Seus dados" → "Excluir minha conta" → confirmar.
  3. Rode:
       node scripts/verificar-lancamento.mjs --verificar-exclusao
${c.fraco("A senha acima é de uma conta descartável; não use em conta real.")}
`);
}

async function verificarExclusao() {
  secao("10. Verificação da exclusão de conta (pós-UI)");
  const conta = lerContaSalva();
  if (!conta) {
    fail("10.0", "Nenhuma conta de verificação registrada", "rode antes: node scripts/verificar-lancamento.mjs --criar-conta-teste");
    return;
  }
  if (!SERVICE) {
    fail("10.1", "SUPABASE_SERVICE_ROLE_KEY ausente", "sem ela não é possível verificar a exclusão");
    return;
  }
  const { id, email, fotoPath } = conta;

  const usuario = await pedir(`${URL_SB}/auth/v1/admin/users/${id}`, { headers: headersService() });
  const aindaExiste = usuario.status === 200;
  if (aindaExiste) fail("10.1", "A conta ainda existe no Auth", "a exclusão pela UI não chegou ao fim (ou ainda não foi feita)");
  else pass("10.1", "Conta removida do Auth", `HTTP ${usuario.status}`);

  const tabelas = ["consents", "visual_profiles", "packages", "reminders", "collections", "photos"];
  let restou = 0;
  for (const tabela of tabelas) {
    const r = await pedir(`${URL_SB}/rest/v1/${tabela}?user_id=eq.${id}&select=id&limit=5`, { headers: headersService() });
    const n = Array.isArray(r.json) ? r.json.length : -1;
    if (n > 0) {
      restou += n;
      warn("10.2", `Ainda há linhas em ${tabela}`, `${n} linha(s)`);
    }
  }
  if (!restou) pass("10.2", "Nenhuma linha restante nas tabelas verificadas", tabelas.join(", "));

  let restouStorage = 0;
  for (const bucket of ["user-photos", "studio-media"]) {
    const { itens } = await listarStorage(bucket, id);
    if (itens.length) {
      restouStorage += itens.length;
      warn("10.3", `Ainda há ${itens.length} arquivo(s) em ${bucket}`, `pasta ${id.slice(0, 8)}…`);
    }
  }
  if (fotoPath) {
    const r = await pedir(`${URL_SB}/storage/v1/object/user-photos/${fotoPath}`, { method: "DELETE", headers: headersService() });
    if (r.ok) pass("10.4", "Arquivo de teste removido do storage", "limpeza pós-verificação");
    else skip("10.4", "Arquivo de teste já não existe", `HTTP ${r.status}`);
  }
  if (!restouStorage) pass("10.3", "Storage da conta vazio", "user-photos e studio-media");

  if (!aindaExiste && !restou && !restouStorage) {
    pass("10.5", "EXCLUSÃO COMPLETA", "Auth + tabelas + storage");
    rmSync(ARQ_CONTA, { force: true });
    console.log(c.ok("\nFluxo de exclusão aprovado. Pode configurar SUPABASE_SERVICE_ROLE_KEY em produção."));
  } else {
    console.log(c.falha("\nExclusão incompleta. Corrija antes de convidar usuários."));
  }
}

async function limparContasTeste() {
  secao("8. Contas de teste encontradas");
  if (!SERVICE) {
    fail("8.0", "SUPABASE_SERVICE_ROLE_KEY ausente", "não é possível listar/limpar contas");
    return;
  }
  const { usuarios, erro } = await listarUsuarios();
  if (erro) {
    fail("8.1", "Não foi possível listar usuários", `HTTP ${erro.status}`);
    return;
  }
  const suspeitos = usuarios.filter((u) => /^teste\./i.test(u.email ?? "") || /@example\.com$/i.test(u.email ?? ""));
  if (!suspeitos.length) {
    pass("8.1", "Nenhuma conta teste.* encontrada", `${usuarios.length} usuários verificados`);
    return;
  }
  warn("8.1", `${suspeitos.length} conta(s) de teste encontrada(s)`, "remova antes do go-live");
  for (const u of suspeitos) {
    console.log(`     · ${u.email} · criada em ${String(u.created_at ?? "").slice(0, 19)} · id ${String(u.id).slice(0, 8)}…`);
  }
  if (!flag("--limpar")) {
    skip("8.2", "Limpeza", "rode com --limpar --sim para apagar (irreversível)");
    return;
  }
  if (!flag("--sim")) {
    warn("8.2", "Simulação", "sem --sim nada é apagado");
    return;
  }
  let apagadas = 0;
  for (const u of suspeitos) {
    for (const bucket of ["user-photos", "studio-media"]) await apagarPastaStorage(bucket, u.id);
    const r = await pedir(`${URL_SB}/auth/v1/admin/users/${u.id}`, { method: "DELETE", headers: headersService() });
    if (r.ok) {
      apagadas++;
      console.log(`     apagada: ${u.email}`);
    } else warn("8.3", `Falha ao apagar ${u.email}`, `HTTP ${r.status}`);
  }
  pass("8.2", "Limpeza concluída", `${apagadas}/${suspeitos.length} contas`);
}

/* -------------------------------------------------------------------------- */
/*  Verificação principal                                                     */
/* -------------------------------------------------------------------------- */

async function main() {
  if (flag("--criar-conta-teste")) {
    await criarContaTeste();
    return finalizar();
  }
  if (flag("--verificar-exclusao")) {
    await verificarExclusao();
    return finalizar();
  }
  if (flag("--limpar")) {
    await limparContasTeste();
    return finalizar();
  }

  console.log(c.titulo(`\nAura ID — verificação de bloqueios de lançamento\n`) + c.fraco(`raiz: ${RAIZ} · app: ${APP}\n`));

  /* 1. Ambiente ------------------------------------------------------------ */
  secao("1. Variáveis de ambiente");
  const obrigatorias = ["SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY"];
  const build = ["VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY"];
  for (const nome of obrigatorias) {
    if (env[nome]) pass("1.1", `${nome} presente`, nome === "SUPABASE_URL" ? new URL(URL_SB).host : mascarar(env[nome]));
    else fail("1.1", `${nome} ausente`, "o app não builda/roda sem ela");
  }
  for (const nome of build) {
    if (env[nome]) pass("1.2", `${nome} presente`, mascarar(env[nome]));
    else warn("1.2", `${nome} ausente`, "o client do navegador não vai funcionar no build");
  }
  if (SERVICE) pass("1.3", "SUPABASE_SERVICE_ROLE_KEY presente", mascarar(SERVICE));
  else fail("1.3", "SUPABASE_SERVICE_ROLE_KEY ausente", "BLOQUEIA exclusão de conta (LGPD), /admin e funil");

  const vazamento = Object.keys(env).filter(
    (k) => k.startsWith("VITE_") && /service_role|sb_secret|secret/i.test(k) && env[k],
  );
  if (vazamento.length) fail("1.4", "Chave secreta exposta em variável VITE_", vazamento.join(", "));
  else pass("1.4", "Nenhuma chave secreta em variável pública (VITE_)");

  if (env.LOVABLE_API_KEY) pass("1.5", "LOVABLE_API_KEY presente", "avatar do onboarding / gateway de imagem");
  else warn("1.5", "LOVABLE_API_KEY ausente", "avatar do onboarding pode ficar indisponível");

  if (!URL_SB) {
    fail("1.6", "Sem SUPABASE_URL", "as fases de rede serão puladas");
    return finalizar();
  }

  /* 2. Identidade do projeto ---------------------------------------------- */
  secao("2. Projeto Supabase");
  pass("2.1", "URL do Supabase", `${new URL(URL_SB).host} (ref ${ref})`);
  try {
    const codigo = readFileSync(join(RAIZ, "src/lib/stripe.functions.ts"), "utf8");
    const refCodigo = codigo.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1];
    if (refCodigo && refCodigo !== ref) fail("2.2", "Projeto do código difere do .env", `código=${refCodigo} · env=${ref}`);
    else if (refCodigo) pass("2.2", "Código e .env apontam para o mesmo projeto", refCodigo);
  } catch {
    skip("2.2", "Não foi possível ler o ref do código");
  }
  try {
    const toml = readFileSync(join(RAIZ, "supabase/config.toml"), "utf8");
    const projeto = toml.match(/project_id\s*=\s*"([^"]+)"/)?.[1];
    if (projeto && projeto !== ref) warn("2.3", "config.toml aponta para projeto antigo", `config=${projeto} · env=${ref}`);
    else if (projeto) pass("2.3", "config.toml coerente", projeto);
  } catch {
    skip("2.3", "supabase/config.toml não encontrado");
  }

  /* 3. Anon/auth ----------------------------------------------------------- */
  secao("3. Supabase acessível (chave publicável)");
  const health = await pedir(`${URL_SB}/auth/v1/health`, { headers: headersAnon() });
  if (health.ok) pass("3.1", "Auth responde", `HTTP ${health.status}`);
  else if (health.status === 401) warn("3.1", "Auth responde mas exige apikey no /health", "HTTP 401 — endpoint existe");
  else fail("3.1", "Auth não responde", `HTTP ${health.status} ${health.erro ?? ""}`);

  const settings = await pedir(`${URL_SB}/auth/v1/settings`, { headers: headersAnon() });
  if (settings.ok) {
    const ext = settings.json?.external ?? {};
    const ativos = Object.entries(ext).filter(([, v]) => v === true).map(([k]) => k);
    pass("3.2", "Configuração de Auth lida", ativos.length ? ativos.join(", ") : "sem provedores externos ativos");
    const autoconfirm = settings.json?.mailer_autoconfirm;
    if (autoconfirm === true) warn("3.3", "Confirmação de e-mail automática ligada", "bom para beta, arriscado para público");
    else if (autoconfirm === false) pass("3.3", "Confirmação de e-mail exigida", "SMTP precisa estar funcionando");
  } else {
    warn("3.2", "Não foi possível ler /auth/v1/settings", `HTTP ${settings.status}`);
  }

  const tabela = await pedir(`${URL_SB}/rest/v1/audit_events?select=id&limit=1`, { headers: headersAnon() });
  if (tabela.status === 404) fail("3.4", "Tabela audit_events não existe no projeto", "schema errado ou projeto vazio");
  else if (tabela.ok || tabela.status === 401 || tabela.status === 403) pass("3.4", "REST responde", `HTTP ${tabela.status} (RLS aplicada)`);
  else warn("3.4", "REST respondeu de forma inesperada", `HTTP ${tabela.status}`);

  /* 4. Service role -------------------------------------------------------- */
  secao("4. Chave de serviço (service role)");
  if (!SERVICE) {
    skip("4.0", "Capacidades privilegiadas", "sem SUPABASE_SERVICE_ROLE_KEY");
  } else {
    const admin = await pedir(`${URL_SB}/auth/v1/admin/users?page=1&per_page=1`, { headers: headersService() });
    if (admin.ok) pass("4.1", "Admin API acessível", "chave é service role");
    else fail("4.1", "Admin API recusou a chave", `HTTP ${admin.status}`);

    const rest = await pedir(`${URL_SB}/rest/v1/audit_events?select=id&limit=1`, { headers: headersService() });
    if (rest.ok) pass("4.2", "REST com service role acessível", "RLS contornada");
    else fail("4.2", "REST com service role falhou", `HTTP ${rest.status}`);

    const storage = await pedir(`${URL_SB}/storage/v1/object/list/user-photos`, {
      method: "POST",
      headers: headersService(),
      body: { prefix: "", limit: 1, offset: 0 },
    });
    if (storage.ok) pass("4.3", "Bucket user-photos acessível", "necessário para exclusão de fotos");
    else fail("4.3", "Bucket user-photos inacessível", `HTTP ${storage.status} — crie o bucket privado`);

    const vitrine = await pedir(`${URL_SB}/storage/v1/object/list/studio-media`, {
      method: "POST",
      headers: headersService(),
      body: { prefix: "", limit: 1, offset: 0 },
    });
    if (vitrine.ok) pass("4.4", "Bucket studio-media acessível", "vitrine pública");
    else fail("4.4", "Bucket studio-media inacessível", `HTTP ${vitrine.status} — crie o bucket público`);

    if (flag("--escrita")) {
      const caminho = `verificacao/${randomUUID()}.txt`;
      const up = await pedir(`${URL_SB}/storage/v1/object/user-photos/${caminho}`, {
        method: "POST",
        headers: { ...headersService(), "content-type": "text/plain", "x-upsert": "false" },
        body: "verificacao",
      });
      const del = up.ok
        ? await pedir(`${URL_SB}/storage/v1/object/user-photos/${caminho}`, { method: "DELETE", headers: headersService() })
        : null;
      if (up.ok && del?.ok) pass("4.5", "Upload e remoção no storage", "necessário para 'Excluir minhas fotos'");
      else fail("4.5", "Falha em upload/remoção no storage", `upload=${up.status} remoção=${del?.status ?? "-"}`);
    } else {
      skip("4.5", "Teste de escrita no storage", "rode com --escrita");
    }
  }

  /* 5. SMTP ---------------------------------------------------------------- */
  secao("5. SMTP / recuperação de senha");
  if (!env.SMTP_TEST_EMAIL) {
    skip("5.1", "Envio de e-mail", "defina SMTP_TEST_EMAIL=seu@email.com para testar");
  } else {
    const r = await pedir(`${URL_SB}/auth/v1/recover`, { headers: headersAnon(), body: { email: env.SMTP_TEST_EMAIL } });
    if (r.ok) {
      pass("5.1", "Pedido de recuperação aceito", `HTTP ${r.status}`);
      warn("5.2", "Entrega não é verificável por API", `confira a caixa de ${env.SMTP_TEST_EMAIL} (até 2 min); sem e-mail = SMTP/template quebrado`);
    } else {
      fail("5.1", "Pedido de recuperação recusado", `HTTP ${r.status} ${String(r.json?.msg ?? "").slice(0, 100)}`);
    }
  }

  /* 6. Edge Functions / Stripe -------------------------------------------- */
  secao("6. Edge Functions e assinatura");
  for (const [nome, func] of [
    ["stripe-checkout", "stripe-checkout"],
    ["ai-gateway", "ai-gateway"],
  ]) {
    const r = await pedir(`${URL_SB}/functions/v1/${func}`, { method: "POST", body: {} });
    if (r.status === 404) fail(`6.${nome === "ai-gateway" ? 2 : 1}`, `Edge Function ${nome} não encontrada`, "deploy da função pendente");
    else if ([401, 403, 400, 405].includes(r.status)) pass(`6.${nome === "ai-gateway" ? 2 : 1}`, `Edge Function ${nome} existe`, `HTTP ${r.status} sem autenticação (esperado)`);
    else warn(`6.${nome === "ai-gateway" ? 2 : 1}`, `Edge Function ${nome} respondeu ${r.status}`, "confirme deploy e autenticação");
  }
  if (SERVICE) {
    const core = await pedir(`${URL_SB}/rest/v1/entitlements?select=id&limit=1`, {
      headers: { ...headersService(), "Accept-Profile": "core" },
    });
    if (core.ok) pass("6.3", "Schema core.entitlements acessível", "assinatura pode ser lida");
    else fail("6.3", "core.entitlements inacessível", `HTTP ${core.status} — schema/RLS de assinatura ausente`);
  } else {
    skip("6.3", "core.entitlements", "sem service role");
  }
  warn("6.4", "Checkout não é validável por API", "abra /aura-pass e conclua um checkout em modo de teste do Stripe");

  /* 7. Headers de produção ------------------------------------------------ */
  secao("7. Headers de segurança");
  const alvo = env.APP_URL;
  if (!alvo) {
    skip("7.1", "Verificação de headers", "defina APP_URL=https://seu-dominio para testar o deploy");
  } else {
    const r = await pedir(alvo);
    if (!r.ok && r.status === 0) fail("7.1", "APP_URL não respondeu", r.erro ?? "");
    else {
      pass("7.1", "Produção respondeu", `HTTP ${r.status}`);
      const nosniff = r.headers.get("x-content-type-options");
      const refPolicy = r.headers.get("referrer-policy");
      if (nosniff === "nosniff") pass("7.2", "X-Content-Type-Options: nosniff");
      else fail("7.2", "Header nosniff ausente", "o deploy não inclui o src/server.ts atualizado?");
      if (refPolicy) pass("7.3", "Referrer-Policy presente", refPolicy);
      else warn("7.3", "Referrer-Policy ausente");
      if (r.headers.get("content-security-policy")) pass("7.4", "CSP presente");
      else warn("7.4", "CSP ausente", "decidir política antes do público (sessão em localStorage)");
      if (r.headers.get("strict-transport-security")) pass("7.5", "HSTS presente");
      else warn("7.5", "HSTS ausente", "configurar no domínio/Cloudflare");
    }
  }

  /* 8. Dados de teste ------------------------------------------------------ */
  secao("8. Dados de teste");
  if (!SERVICE) {
    skip("8.1", "Listagem de contas teste.*", "sem service role");
  } else {
    const { usuarios, erro } = await listarUsuarios();
    if (erro) fail("8.1", "Não foi possível listar usuários", `HTTP ${erro.status}`);
    else {
      const suspeitos = usuarios.filter((u) => /^teste\./i.test(u.email ?? "") || /@example\.com$/i.test(u.email ?? ""));
      if (!suspeitos.length) pass("8.1", "Nenhuma conta teste.* encontrada", `${usuarios.length} usuários`);
      else {
        warn("8.1", `${suspeitos.length} conta(s) de teste`, "rode --limpar --sim antes do go-live");
        for (const u of suspeitos.slice(0, 10)) console.log(`     · ${u.email} · criada em ${String(u.created_at ?? "").slice(0, 10)}`);
        if (suspeitos.length > 10) console.log(`     · … e mais ${suspeitos.length - 10}`);
      }
    }
  }

  return finalizar();
}

function finalizar() {
  const resumo = {
    PASS: resultados.filter((r) => r.nivel === "PASS").length,
    FAIL: resultados.filter((r) => r.nivel === "FAIL").length,
    WARN: resultados.filter((r) => r.nivel === "WARN").length,
    SKIP: resultados.filter((r) => r.nivel === "SKIP").length,
  };
  console.log("\n" + "─".repeat(60));
  console.log(
    `${c.titulo("RESUMO")}  ${c.ok(resumo.PASS + " PASS")} · ${c.falha(resumo.FAIL + " FAIL")} · ${c.aviso(resumo.WARN + " WARN")} · ${c.fraco(resumo.SKIP + " SKIP")}`,
  );
  const bloqueios = resultados.filter((r) => r.nivel === "FAIL");
  if (bloqueios.length) {
    console.log(c.falha("\nBLOQUEIOS DE LANÇAMENTO:"));
    for (const b of bloqueios) console.log(`  ✖ ${b.id} ${b.titulo}${b.detalhe ? " — " + b.detalhe : ""}`);
    console.log(c.fraco("\nCritério para lançamento público: 0 FAIL acima."));
  } else {
    console.log(c.ok("\nNenhum bloqueio automático encontrado. Ainda faltam os passos manuais (SMTP real, checkout em teste, exclusão de conta)."));
  }

  if (flag("--json")) {
    const destino = valor("--json");
    if (destino) {
      writeFileSync(destino, JSON.stringify({ quando: new Date().toISOString(), app: APP, resumo, resultados }, null, 2));
      console.log(c.fraco(`\nJSON salvo em ${destino}`));
    }
  }
  process.exitCode = resumo.FAIL ? 1 : 0;
}

main().catch((e) => {
  console.error(c.falha("\nErro inesperado no verificador:"), e);
  process.exitCode = 2;
});
