import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Confirm } from "@/components/Confirm";
import { CabecalhoPagina, Cartao, EstadoErro, EsqueletoLista } from "@/components/estados";
import { CARTAO_COMPACTO, FOCO, TITULO_SECAO } from "@/lib/design";
import { cn } from "@/lib/utils";
import { useModoVisual, type ModoVisual } from "@/hooks/useModoVisual";
import { CONSENT_ITEMS, fmtDateTime, logEvent } from "@/lib/aura";
import { deleteAccount, exportarMeusDados } from "@/lib/aura.functions";
import { traduzErroAuth } from "@/lib/erros-auth";


export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: "Configurações e dados — Aura ID" }, { name: "description", content: "Gerencie consentimentos, lembretes e seus dados." }, { property: "og:title", content: "Configurações e dados — Aura ID" }, { property: "og:description", content: "Gerencie consentimentos, lembretes e seus dados." }] }),
  component: Settings,
});

function Settings() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const nav = useNavigate();
  const del = useServerFn(deleteAccount);
  const exportar = useServerFn(exportarMeusDados);
  const [modo, salvarModo] = useModoVisual();
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [salvandoLembrete, setSalvandoLembrete] = useState(false);
  const [limpando, setLimpando] = useState<"photos" | "packages" | null>(null);
  const [excluindoConta, setExcluindoConta] = useState(false);

  // --- Conta: nome, e-mail, senha, sessões e exportação ---
  const [nome, setNome] = useState(() => {
    const salvo = user.user_metadata?.["nome"] ?? user.user_metadata?.["full_name"];
    return typeof salvo === "string" ? salvo : "";
  });
  const [salvandoNome, setSalvandoNome] = useState(false);
  const [novoEmail, setNovoEmail] = useState("");
  const [trocandoEmail, setTrocandoEmail] = useState(false);
  const [avisoEmail, setAvisoEmail] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [trocandoSenha, setTrocandoSenha] = useState(false);
  const [saindoOutros, setSaindoOutros] = useState(false);
  const [exportando, setExportando] = useState(false);

  const q = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const [{ data: c }, { data: r }, { data: admin }] = await Promise.all([
        supabase.from("consents").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("reminders").select("*").order("due_at"),
        supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }),
      ]);
      return { consent: c, reminders: r ?? [], admin: !!admin };
    },
  });
  const c = q.data?.consent;

  function trocarModo(novo: ModoVisual) {
    if (novo === modo) return;
    salvarModo(novo);
    toast.success(novo === "simples" ? "Modo simples ativado" : "Modo completo ativado");
  }

  async function toggle(key: "photo_processing" | "personalization" | "reminders" | "image_generation", v: boolean) {
    const { error } = await supabase.from("consents").update({ [key]: v, updated_at: new Date().toISOString() } as never).eq("user_id", user.id);
    if (error) { toast.error("Não foi possível atualizar o consentimento. Tente de novo."); return; }
    await logEvent("consent_changed", { scope: key, value: v });
    if (key === "personalization" && v) await logEvent("cross_module_enabled");
    if (key === "reminders" && v) await logEvent("reminder_enabled");
    qc.invalidateQueries();
  }

  async function addReminder() {
    if (salvandoLembrete) return;
    if (!title.trim() || !due) { toast.error("Dê um título e uma data para o lembrete."); return; }
    setSalvandoLembrete(true);
    try {
      const { error } = await supabase.from("reminders").insert({ user_id: user.id, title: title.trim(), due_at: new Date(due).toISOString() });
      if (error) { toast.error("Não foi possível adicionar o lembrete. Tente de novo."); return; }
      setTitle(""); setDue(""); qc.invalidateQueries({ queryKey: ["settings"] });
    } finally { setSalvandoLembrete(false); }
  }

  async function toggleReminder(id: string, done: boolean) {
    const { error } = await supabase.from("reminders").update({ done: !done }).eq("id", id);
    if (error) { toast.error("Não foi possível atualizar o lembrete. Tente de novo."); return; }
    qc.invalidateQueries({ queryKey: ["settings"] });
  }

  async function removeReminder(id: string) {
    const { error } = await supabase.from("reminders").delete().eq("id", id);
    if (error) { toast.error("Não foi possível remover o lembrete. Tente de novo."); return; }
    qc.invalidateQueries({ queryKey: ["settings"] });
  }

  async function wipe(scope: "photos" | "packages") {
    if (limpando) return;
    setLimpando(scope);
    try {
      const { data: references, error: refsError } = await supabase.from("generated_references").select("path");
      if (refsError) { toast.error("Não foi possível preparar a exclusão. Tente de novo."); return; }
      const paths = (references ?? []).flatMap(r => r.path ? [r.path] : []);
      if (paths.length) {
        const { error } = await supabase.storage.from("user-photos").remove(paths);
        if (error) { toast.error("Não foi possível excluir as referências. Tente de novo."); return; }
      }
      const { error: refsDeleteError } = await supabase.from("generated_references").delete().eq("user_id", user.id);
      if (refsDeleteError) { toast.error("Não foi possível excluir as referências. Tente de novo."); return; }
      if (scope === "photos") {
        const { data, error: photosError } = await supabase.from("photos").select("path");
        if (photosError) { toast.error("Não foi possível excluir as fotos. Tente de novo."); return; }
        if (data?.length) {
          const { error: storageError } = await supabase.storage.from("user-photos").remove(data.map((p) => p.path));
          if (storageError) { toast.error("Não foi possível excluir as fotos. Tente de novo."); return; }
        }
      }
      const { error } = await supabase.from(scope).delete().eq("user_id", user.id);
      if (error) { toast.error("Não foi possível excluir os dados. Tente de novo."); return; }
      await logEvent("data_deleted", { scope });
      qc.invalidateQueries();
      toast.success("Excluído");
    } finally { setLimpando(null); }
  }

  async function deleteAll() {
    if (excluindoConta) return;
    setExcluindoConta(true);
    try {
      const r = await del();
      if (r.error) { toast.error("Não foi possível excluir a conta. Tente de novo."); return; }
      await supabase.auth.signOut();
      nav({ to: "/" });
    } catch {
      toast.error("Não foi possível excluir a conta agora. Tente de novo.");
    } finally { setExcluindoConta(false); }
  }

  async function salvarNome() {
    const limpo = nome.trim();
    if (limpo.length < 2) { toast.error("Escreva um nome com pelo menos 2 letras."); return; }
    setSalvandoNome(true);
    try {
      const { error } = await supabase.auth.updateUser({ data: { nome: limpo } });
      if (error) { toast.error(traduzErroAuth(error.message, "Não foi possível concluir agora. Tente de novo.")); return; }
      setNome(limpo);
      toast.success("Nome atualizado.");
    } catch {
      toast.error("Não foi possível salvar o nome agora. Tente de novo.");
    } finally {
      setSalvandoNome(false);
    }
  }

  async function trocarEmail() {
    const limpo = novoEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpo)) { toast.error("Confira o e-mail digitado."); return; }
    if (limpo === (user.email ?? "").toLowerCase()) { toast.error("Esse já é o seu e-mail atual."); return; }
    setTrocandoEmail(true);
    setAvisoEmail("");
    try {
      const { error } = await supabase.auth.updateUser({ email: limpo });
      if (error) { toast.error(traduzErroAuth(error.message, "Não foi possível concluir agora. Tente de novo.")); return; }
      setAvisoEmail(
        `Se o envio de e-mails estiver disponível, você receberá um link de confirmação em ${limpo} (e talvez também no e-mail atual). A troca só vale depois de confirmar — até lá, continue entrando com o e-mail de sempre.`,
      );
      setNovoEmail("");
    } catch {
      toast.error("Não foi possível iniciar a troca de e-mail agora. Tente de novo.");
    } finally {
      setTrocandoEmail(false);
    }
  }

  async function trocarSenha() {
    if (novaSenha.length < 8) { toast.error("A nova senha precisa ter pelo menos 8 caracteres."); return; }
    if (novaSenha !== confirmarSenha) { toast.error("As senhas não são iguais. Confira e tente de novo."); return; }
    setTrocandoSenha(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: novaSenha });
      if (error) { toast.error(traduzErroAuth(error.message, "Não foi possível concluir agora. Tente de novo.")); return; }
      setNovaSenha("");
      setConfirmarSenha("");
      toast.success("Senha atualizada.");
    } catch {
      toast.error("Não foi possível trocar a senha agora. Tente de novo.");
    } finally {
      setTrocandoSenha(false);
    }
  }

  async function sairDosOutrosDispositivos() {
    setSaindoOutros(true);
    try {
      const { error } = await supabase.auth.signOut({ scope: "others" });
      if (error) { toast.error("Não foi possível encerrar as outras sessões agora. Tente de novo."); return; }
      toast.success("Sessões encerradas nos outros dispositivos. Esta continua ativa.");
    } catch {
      toast.error("Não foi possível encerrar as outras sessões agora. Tente de novo.");
    } finally {
      setSaindoOutros(false);
    }
  }

  async function exportarDados() {
    setExportando(true);
    try {
      const dados = await exportar();
      const conteudo = JSON.stringify(dados, null, 2);
      const blob = new Blob([conteudo], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `aura-id-meus-dados-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Dá tempo de o navegador começar o download antes de liberar a URL.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success("Exportação baixada. Fotos e imagens não entram no arquivo.");
    } catch {
      toast.error("Não foi possível exportar seus dados agora. Tente de novo.");
    } finally {
      setExportando(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-10">
      <CabecalhoPagina titulo="Configurações e dados" />
      <section className="space-y-3">
        <h2 className={TITULO_SECAO}>Preferências de visualização</h2>
        <p className="max-w-2xl text-sm text-muted-foreground">Escolha quantas ferramentas aparecem no menu. Vale só para este navegador e você pode trocar quando quiser — nada é apagado.</p>
        <div className="grid gap-3 sm:grid-cols-2" role="group" aria-label="Modo de visualização">
          <button
            type="button"
            aria-pressed={modo === "simples"}
            onClick={() => trocarModo("simples")}
            className={`rounded-2xl border p-5 text-left text-sm transition ${FOCO} ${modo === "simples" ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-secondary"}`}
          >
            <span className="block font-medium">Modo simples</span>
            <span className="mt-1 block text-xs opacity-90">Só Estúdio, Sugestões, Meu Modelo e Profissionais. Relatórios, DNA, comparações e exportação avançada ficam em “Mais opções”.</span>
          </button>
          <button
            type="button"
            aria-pressed={modo === "completo"}
            onClick={() => trocarModo("completo")}
            className={`rounded-2xl border p-5 text-left text-sm transition ${FOCO} ${modo === "completo" ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-secondary"}`}
          >
            <span className="block font-medium">Modo completo</span>
            <span className="mt-1 block text-xs opacity-90">Tudo como hoje: todos os módulos e ferramentas visíveis no menu.</span>
          </button>
        </div>
      </section>
      <section className="space-y-3">
        <h2 className={TITULO_SECAO}>Conta</h2>
        <Cartao compacto className="space-y-6">
          <div>
            <Label htmlFor="conta-nome">Seu nome</Label>
            <div className="mt-1 flex max-w-md gap-2">
              <Input
                id="conta-nome"
                value={nome}
                maxLength={120}
                autoComplete="name"
                placeholder="Como a Aura pode te chamar"
                onChange={(e) => setNome(e.target.value)}
              />
              <Button onClick={() => void salvarNome()} disabled={salvandoNome}>
                {salvandoNome ? "Salvando…" : "Salvar"}
              </Button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Serve para personalizar a sua experiência. Não aparece publicamente.</p>
          </div>

          <div>
            <p className="text-sm">E-mail atual: <strong>{user.email ?? "não informado"}</strong></p>
            <Label htmlFor="conta-email" className="mt-3 block">Trocar e-mail</Label>
            <div className="mt-1 flex max-w-md gap-2">
              <Input
                id="conta-email"
                type="email"
                autoComplete="email"
                value={novoEmail}
                placeholder="novo@email.com"
                onChange={(e) => setNovoEmail(e.target.value)}
              />
              <Button onClick={() => void trocarEmail()} disabled={trocandoEmail}>
                {trocandoEmail ? "Enviando…" : "Trocar"}
              </Button>
            </div>
            {avisoEmail && <p role="status" className="mt-2 rounded-lg border border-accent/40 bg-secondary px-3 py-2 text-sm">{avisoEmail}</p>}
            <p className="mt-1 text-xs text-muted-foreground">O endereço só muda depois da confirmação. Se o envio de e-mails não estiver disponível neste ambiente, a troca não acontece — continue entrando com o e-mail de sempre.</p>
          </div>

          <div>
            <p className="text-sm font-medium">Trocar senha</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <div>
                <Label htmlFor="conta-senha">Nova senha</Label>
                <Input
                  id="conta-senha"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="conta-senha2">Confirmar nova senha</Label>
                <Input
                  id="conta-senha2"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                />
              </div>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Use pelo menos 8 caracteres.</p>
            <Button
              className="mt-2"
              onClick={() => void trocarSenha()}
              disabled={trocandoSenha || novaSenha.length < 8 || confirmarSenha.length < 8}
            >
              {trocandoSenha ? "Trocando…" : "Trocar senha"}
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => void sairDosOutrosDispositivos()} disabled={saindoOutros}>
                {saindoOutros ? "Encerrando…" : "Sair dos outros dispositivos"}
              </Button>
              <Button variant="outline" onClick={() => void exportarDados()} disabled={exportando}>
                {exportando ? "Preparando…" : "Exportar meus dados (JSON)"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">A exportação traz seus textos e respostas em JSON. Fotos e imagens geradas ficam de fora.</p>
          </div>
        </Cartao>
      </section>
      <section className="space-y-3">
        <h2 className={TITULO_SECAO}>Assinatura</h2>
        <Button asChild variant="outline" className="h-auto whitespace-normal py-2 text-left"><Link to="/aura-pass">Aura Pass — assinatura e pagamento</Link></Button>
      </section>
      <section className="space-y-3">
        <h2 className={TITULO_SECAO}>Consentimento</h2>
        <Button asChild variant="outline" className="h-auto whitespace-normal py-2 text-left"><Link to="/onboarding">Editar estrutura e preferências</Link></Button>
        {q.isLoading ? (
          <EsqueletoLista itens={4} colunas={1} altura="h-20" />
        ) : q.error ? (
          <EstadoErro
            titulo="Não foi possível carregar seus consentimentos."
            onTentarNovamente={() => void q.refetch()}
            recarregando={q.isFetching}
          />
        ) : (
          <>
            <label className={cn("flex items-start justify-between gap-6", CARTAO_COMPACTO)}><div><div className="font-medium">Imagens geradas por IA</div><p className="text-sm text-muted-foreground">Pessoa fictícia, conceitos privados e o <strong>Aura Retrato</strong> (edição na sua foto — exige também a permissão de fotos). Cada geração usa créditos de IA.</p></div><Switch aria-label="Imagens geradas por IA" checked={!!c?.image_generation} onCheckedChange={v => toggle("image_generation", v)} /></label>
            {CONSENT_ITEMS.map((i) => (
              <label key={i.key} className={cn("flex items-start justify-between gap-6", CARTAO_COMPACTO)}>
                <div><div className="font-medium">{i.title}</div><p className="text-sm text-muted-foreground">{i.body}</p></div>
                <Switch aria-label={i.title} checked={!!c?.[i.key]} onCheckedChange={(v) => toggle(i.key, v)} />
              </label>
            ))}
            <p className="text-sm text-muted-foreground">Permissões por módulo, pausa e redefinição do DNA ficam em <Link to="/dna/permissoes" className="underline">DNA Visual → Permissões</Link>.</p>
          </>
        )}
      </section>
      {c?.reminders && (
        <section className="space-y-3">
          <h2 className={TITULO_SECAO}>Lembretes no app</h2>
          <div className="flex flex-wrap gap-2"><Input aria-label="Título do lembrete" className="max-w-xs" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ex.: Marcar corte de cabelo" /><Input aria-label="Data e hora do lembrete" type="datetime-local" className="max-w-xs" value={due} onChange={(e) => setDue(e.target.value)} /><Button onClick={addReminder} disabled={salvandoLembrete}>{salvandoLembrete ? "Salvando…" : "Adicionar"}</Button></div>
          {q.data?.reminders.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-2xl border bg-card px-4 py-2 text-sm">
              <span className={r.done ? "line-through text-muted-foreground" : ""}>{r.title} · {fmtDateTime(r.due_at)}</span>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => void toggleReminder(r.id, r.done)}>{r.done ? "Desfazer" : "Feito"}</Button>
                <Confirm label="Remover" desc="Este lembrete será removido." onYes={() => void removeReminder(r.id)} />
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">Lembretes por e-mail ou SMS ainda não estão conectados.</p>
        </section>
      )}
      <section className="space-y-3">
        <h2 className={TITULO_SECAO}>Seus dados</h2>
        <div className="flex flex-wrap gap-2">
          {limpando === "photos" ? <Button variant="outline" size="sm" disabled>Excluindo fotos…</Button> : <Confirm label="Excluir todas as fotos" desc="Todas as fotos e referências enviadas serão removidas permanentemente." onYes={() => void wipe("photos")} />}
          {limpando === "packages" ? <Button variant="outline" size="sm" disabled>Excluindo sugestões…</Button> : <Confirm label="Excluir todas as sugestões" desc="Todas as sugestões geradas serão removidas." onYes={() => void wipe("packages")} />}
          <Button asChild variant="outline" size="sm"><Link to="/dna/redefinir">Redefinir ou exportar DNA Visual</Link></Button>
        </div>
        <div className="rounded-2xl border border-destructive/40 p-5">
          <p className="text-sm">Excluir sua conta remove tudo — perfil, fotos, sugestões, feedback, DNA Visual e histórico.</p>
          <div className="mt-3">{excluindoConta ? <Button variant="outline" size="sm" disabled>Excluindo conta…</Button> : <Confirm label="Excluir minha conta" desc="Isso não pode ser desfeito." onYes={() => void deleteAll()} />}</div>
        </div>
      </section>
      {q.data?.admin && <Button asChild variant="secondary"><Link to="/admin">Abrir admin</Link></Button>}
    </div>
  );
}
