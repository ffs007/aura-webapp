import { useState } from "react";
import { Send, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Aviso, CarregandoInline, EstadoVazio } from "@/components/estados";
import { CARTAO_COMPACTO } from "@/lib/design";
import { listarProfissionais, enviarBriefing, type Profissional } from "@/lib/profissionais.functions";

const PROFISSOES: [string, string][] = [
  ["cabeleireira", "Cabelo"], ["maquiadora", "Maquiagem"], ["tatuadora", "Tatuagem"],
  ["esteticista", "Estética"], ["barbeiro", "Barbearia"], ["manicure", "Manicure"],
];

/** Busca profissionais por CEP + raio e envia o briefing gerado. Geocodização via BrasilAPI no navegador. */
export function EnviarBriefing({ titulo, texto, modulo, profissaoFixa, packageId, fotoPath }: { titulo: string; texto: string; modulo: string; profissaoFixa?: string | undefined; packageId?: string | undefined; fotoPath?: string | undefined }) {
  const listar = useServerFn(listarProfissionais), enviar = useServerFn(enviarBriefing);
  const [cep, setCep] = useState("");
  const [raio, setRaio] = useState(25);
  const [profissao, setProfissao] = useState(profissaoFixa ?? "");
  const [buscando, setBuscando] = useState(false);
  const [resultados, setResultados] = useState<Profissional[] | null>(null);
  const [enviando, setEnviando] = useState("");
  const [enviados, setEnviados] = useState<string[]>([]);
  const [err, setErr] = useState("");

  async function buscar() {
    setErr(""); setResultados(null); setBuscando(true);
    try {
      const cepLimpo = cep.replace(/\D/g, "");
      if (cepLimpo.length !== 8) return setErr("Digite os 8 números do CEP.");
      const alvo = profissao || profissaoFixa;
      if (!alvo) return setErr("Escolha o tipo de profissional.");
      const geo = await fetch(`https://brasilapi.com.br/api/cep/v2/${cepLimpo}`);
      const geoJson = (await geo.json()) as { location?: { coordinates?: { latitude?: number; longitude?: number } } };
      const lat = geoJson.location?.coordinates?.latitude, lng = geoJson.location?.coordinates?.longitude;
      if (typeof lat !== "number" || typeof lng !== "number") return setErr("Não achamos as coordenadas desse CEP. Tente outro da sua região.");
      const r = await listar({ data: { profissao: alvo as never, lat, lng, raio_km: raio } });
      setResultados(r);
    } catch { setErr("A busca falhou. Tente novamente."); } finally { setBuscando(false); }
  }

  async function enviarPara(p: Profissional) {
    setEnviando(p.id);
    try {
      let foto_url: string | undefined;
      if (fotoPath) {
        const s = await supabase.storage.from("user-photos").createSignedUrl(fotoPath, 60 * 60 * 24 * 30);
        foto_url = s.data?.signedUrl;
      }
      await enviar({ data: { professional_id: p.id, packageId, modulo, titulo, texto, ...(foto_url ? { foto_url } : {}) } });
      setEnviados((xs) => [...xs, p.id]);
      toast.success(`Briefing enviado para ${p.nome}! A resposta aparece em Profissionais → Meus envios.`);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Não foi possível enviar."); } finally { setEnviando(""); }
  }

  return (
    <div className={`space-y-3 ${CARTAO_COMPACTO}`} role="region" aria-label="Enviar briefing a profissionais">
      <p className="text-sm font-medium">📍 Encontrar profissional perto de você</p>
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <Input aria-label="Seu CEP" placeholder="Seu CEP (só números)" value={cep} inputMode="numeric" maxLength={9} onChange={(e) => setCep(e.target.value)} />
        <select aria-label="Raio de busca" className="rounded-md border bg-background p-2 text-sm" value={raio} onChange={(e) => setRaio(Number(e.target.value))}>
          {[5, 10, 25, 50, 100].map((r) => <option key={r} value={r}>Raio: {r} km</option>)}
        </select>
        <Button size="sm" disabled={buscando} onClick={() => void buscar()}>{buscando ? "Buscando…" : "Buscar"}</Button>
      </div>
      {!profissaoFixa && (
        <select aria-label="Tipo de profissional" className="w-full rounded-md border bg-background p-2 text-sm" value={profissao} onChange={(e) => setProfissao(e.target.value)}>
          <option value="">Tipo de profissional…</option>
          {PROFISSOES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      )}
      {buscando && <CarregandoInline rotulo="Buscando profissionais…" />}
      {err && <Aviso tom="atencao" acoes={<Button size="sm" variant="outline" onClick={() => void buscar()}>Tentar novamente</Button>}>{err}</Aviso>}
      {resultados && resultados.length === 0 && (
        <EstadoVazio
          compacto
          icone={<Users className="size-5" />}
          titulo="Ninguém cadastrado nesse raio ainda"
          descricao="Você pode convidar quem atende você a se cadastrar — é grátis para começar."
          acoes={<Button size="sm" variant="outline" onClick={() => { setResultados(null); setCep(""); }}>Tentar outro CEP</Button>}
        />
      )}
      {resultados?.map((p) => (
        <div key={p.id} className={`flex flex-wrap items-center justify-between gap-2 ${CARTAO_COMPACTO}`}>
          <div>
            <p className="text-sm font-medium">{p.nome} {p.verificado && <span title="Verificado" className="text-accent">✓</span>}</p>
            <p className="text-xs text-muted-foreground">{PROFISSOES.find(([v]) => v === p.profissao)?.[1] ?? p.profissao}{p.nome_salao ? ` · ${p.nome_salao}` : ""} · a {p.distancia_km} km{p.instagram ? ` · ${p.instagram}` : ""}</p>
          </div>
          <Button size="sm" disabled={enviados.includes(p.id) || enviando === p.id} onClick={() => void enviarPara(p)}>
            <Send className="size-4" />
            {enviados.includes(p.id) ? "Enviado ✓" : enviando === p.id ? "Enviando…" : "Enviar briefing"}
          </Button>
        </div>
      ))}
    </div>
  );
}
