import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { BadgeCheck, SearchX, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Aviso, CabecalhoPagina, CarregandoPagina, EstadoErro, EstadoVazio } from '@/components/estados';
import { CARTAO } from '@/lib/design';
import { enviarBriefing, profissionalPorSlug, type ProfissionalPublico } from '@/lib/profissionais.functions';

export const Route = createFileRoute('/_authenticated/briefing/$slug')({
  head: () => ({
    meta: [
      { title: 'Enviar meu briefing · Aura ID' },
      { name: 'description', content: 'Envie seu briefing para quem você escolheu no Aura ID.' },
    ],
  }),
  component: Page,
});

const ROTULOS: Record<string, string> = {
  cabeleireira: 'Cabelo', maquiadora: 'Maquiagem', tatuadora: 'Tatuagem',
  esteticista: 'Estética', barbeiro: 'Barbearia', manicure: 'Manicure',
};

const TITULO_MAX = 120;
const MENSAGEM_MIN = 10;
const MENSAGEM_MAX = 8000;

/** Erros técnicos (rede, sessão) não aparecem em inglês para a pessoa. */
function mensagemHumana(erro: unknown): string {
  const bruta = erro instanceof Error ? erro.message : '';
  const tecnica = /failed to fetch|networkerror|network request|load failed|unauthorized|invalid token/i;
  if (!bruta || tecnica.test(bruta)) return 'Não foi possível concluir agora. Verifique sua conexão e tente novamente.';
  return bruta;
}

/**
 * Rota autenticada do CTA público "Enviar meu briefing" (/p/{slug}).
 * A micropágina pública grava `aura.destino` antes de entrar; depois de
 * login/consentimento/onboarding a pessoa volta para cá com a profissional
 * preservada e envia o briefing sem precisar de pacote ou foto.
 */
function Page() {
  // O routeTree.gen.ts é regenerado pelo dev/build assim que esta rota existe;
  // até lá o TS ainda não conhece os params deste arquivo — o cast some sozinho
  // depois da regeneração e não muda o comportamento.
  const { slug } = Route.useParams() as { slug: string };
  const carregarProfissional = useServerFn(profissionalPorSlug);
  const enviar = useServerFn(enviarBriefing);

  const [estado, setEstado] = useState<'carregando' | 'ok' | 'nao-encontrado' | 'erro'>('carregando');
  const [profissional, setProfissional] = useState<ProfissionalPublico | null>(null);
  const [tentativa, setTentativa] = useState(0);

  const [titulo, setTitulo] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState('');
  const [enviado, setEnviado] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    let vivo = true;
    setEstado('carregando');
    carregarProfissional({ data: { slug } })
      .then((p) => {
        if (!vivo) return;
        setProfissional(p);
        setEstado('ok');
      })
      .catch((e: unknown) => {
        if (!vivo) return;
        const msg = e instanceof Error ? e.message : '';
        setEstado(/não encontrad/i.test(msg) ? 'nao-encontrado' : 'erro');
      });
    return () => { vivo = false; };
  }, [slug, tentativa, carregarProfissional]);

  async function enviarBriefingUI(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!profissional || enviando) return;
    const tituloLimpo = titulo.trim();
    const mensagemLimpa = mensagem.trim();
    if (tituloLimpo.length < 3) { setErroEnvio('Dê um título curto ao seu briefing.'); return; }
    if (mensagemLimpa.length < MENSAGEM_MIN) { setErroEnvio(`Escreva pelo menos ${MENSAGEM_MIN} caracteres na mensagem.`); return; }
    setErroEnvio('');
    setEnviando(true);
    try {
      await enviar({
        data: {
          professional_id: profissional.id,
          modulo: 'briefing-publico',
          titulo: tituloLimpo,
          texto: mensagemLimpa,
        },
      });
      setEnviado(true);
    } catch (erro) {
      setErroEnvio(mensagemHumana(erro));
    } finally {
      setEnviando(false);
    }
  }

  if (estado === 'carregando') {
    return <CarregandoPagina rotulo="Carregando profissional…" className="min-h-screen" />;
  }

  if (estado === 'nao-encontrado') {
    return (
      <div className="mx-auto max-w-md py-20">
        <EstadoVazio
          icone={<SearchX className="size-5" />}
          titulo="Não encontramos esse perfil"
          descricao="Este link pode ter mudado ou o perfil não está mais ativo."
          acoes={<Button asChild><Link to="/profissionais">Ver profissionais perto de mim</Link></Button>}
        />
      </div>
    );
  }

  if (estado === 'erro' || !profissional) {
    return (
      <div className="mx-auto max-w-md py-20">
        <EstadoErro
          titulo="Não foi possível carregar"
          descricao="Pode ser instabilidade de conexão. Tente de novo — o link continua válido."
          onTentarNovamente={() => setTentativa((n) => n + 1)}
          acoes={<Button asChild variant="outline"><Link to="/profissionais">Ver profissionais perto de mim</Link></Button>}
        />
      </div>
    );
  }

  if (enviado) {
    return (
      <div className="mx-auto max-w-xl space-y-6 py-10">
        <CabecalhoPagina
          antes={<div className="text-5xl" aria-hidden>💌</div>}
          titulo="Briefing enviado!"
          descricao={<>
            Sua mensagem chegou para {profissional.nome}
            {profissional.nome_salao ? ` (${profissional.nome_salao})` : ''}. A resposta aparece em{' '}
            <strong>Profissionais → Meus envios</strong>.
          </>}
          className="text-center [&_h1]:text-4xl [&_h1]:font-display [&>div]:justify-center [&>div>div]:mx-auto"
          acoes={
            <>
              <Button asChild size="sm"><Link to="/profissionais">Ver meus envios</Link></Button>
              <Button asChild size="sm" variant="outline"><a href={`/p/${slug}`}>Ver perfil</a></Button>
            </>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-8 py-6">
      <CabecalhoPagina
        antes={<p className="text-xs tracking-wide text-accent">✨ AURA ID · BRIEFING</p>}
        titulo="Enviar meu briefing"
        descricao={<>
          Para <strong>{profissional.nome}</strong>
          {profissional.verificado && <BadgeCheck className="ml-1 inline size-5 text-accent" aria-label="Perfil verificado" />}
          {profissional.nome_salao ? ` · ${profissional.nome_salao}` : ''}
        </>}
        className="text-center [&_h1]:text-4xl [&_h1]:font-display [&>div]:justify-center [&>div>div]:mx-auto"
      />
      <p className="text-center text-sm text-muted-foreground">{ROTULOS[profissional.profissao] ?? profissional.profissao}</p>

      <Aviso tom="info">
        Sua mensagem vai para quem atende; a resposta aparece em <strong>Profissionais → Meus envios</strong>.
      </Aviso>

      <form ref={formRef} onSubmit={enviarBriefingUI} className={`space-y-4 ${CARTAO}`}>
        <div>
          <Label htmlFor="briefing-titulo">Título</Label>
          <Input
            id="briefing-titulo"
            value={titulo}
            maxLength={TITULO_MAX}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="ex.: Quero um corte mais leve para o dia a dia"
            required
          />
          <p className="mt-1 text-right text-xs text-muted-foreground">{titulo.length}/{TITULO_MAX}</p>
        </div>
        <div>
          <Label htmlFor="briefing-mensagem">Mensagem</Label>
          <Textarea
            id="briefing-mensagem"
            value={mensagem}
            minLength={MENSAGEM_MIN}
            maxLength={MENSAGEM_MAX}
            rows={7}
            onChange={(e) => setMensagem(e.target.value)}
            placeholder="Conte o que você quer, a ocasião, o que costuma usar e o que prefere evitar…"
            required
          />
          <p className="mt-1 flex justify-between gap-3 text-xs text-muted-foreground">
            <span>Mínimo de {MENSAGEM_MIN} caracteres. Não precisa enviar foto nem pacote.</span>
            <span>{mensagem.length}/{MENSAGEM_MAX}</span>
          </p>
        </div>
        {erroEnvio && (
          <Aviso
            tom="atencao"
            acoes={<Button type="button" size="sm" variant="outline" onClick={() => formRef.current?.requestSubmit()}>Tentar novamente</Button>}
          >
            {erroEnvio}
          </Aviso>
        )}
        <Button
          type="submit"
          className="w-full"
          disabled={enviando || mensagem.trim().length < MENSAGEM_MIN || titulo.trim().length < 3}
        >
          <Send className="size-4" /> {enviando ? 'Enviando…' : 'Enviar meu briefing'}
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground">Você pode voltar e enviar outro briefing quando quiser.</p>
    </div>
  );
}
