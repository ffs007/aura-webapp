import { useState } from 'react';
import { LoaderCircle, MessageSquareHeart } from 'lucide-react';
import { toast } from 'sonner';
import { useServerFn } from '@tanstack/react-start';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Aviso } from '@/components/estados';
import { FOCO } from '@/lib/design';
import { enviarFeedback } from '@/lib/feedback.functions';

const TIPOS: { v: 'critica' | 'sugestao' | 'duvida' | 'elogio'; l: string }[] = [
  { v: 'critica', l: '🙃 Crítica' },
  { v: 'sugestao', l: '💡 Sugestão' },
  { v: 'duvida', l: '❓ Dúvida' },
  { v: 'elogio', l: '💛 Elogio' },
];

/**
 * Canal de feedback — botão fixo presente em TODAS as páginas (públicas incluso).
 * Crítica é ouro: informação de graça é o insumo mais barato e mais caro que existe.
 */
export function FeedbackButton() {
  const enviar = useServerFn(enviarFeedback);
  const [aberto, setAberto] = useState(false);
  const [tipo, setTipo] = useState<'critica' | 'sugestao' | 'duvida' | 'elogio'>('critica');
  const [texto, setTexto] = useState('');
  const [contato, setContato] = useState('');
  const [mandando, setMandando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState('');

  async function mandar() {
    setMandando(true);
    setErroEnvio('');
    try {
      await enviar({ data: { tipo, texto, ...(contato.trim() ? { contato: contato.trim() } : {}), rota: window.location.pathname } });
      toast.success('Recebido! A gente lê TUDO — crítica é ouro. 💛');
      setAberto(false); setTexto(''); setContato('');
    } catch (e) { setErroEnvio(e instanceof Error ? e.message : 'Não foi possível enviar.'); } finally { setMandando(false); }
  }

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        title="Críticas, sugestões, dúvidas e elogios"
        aria-label="Abrir canal de opinião"
        className={`fixed bottom-4 right-4 z-40 grid size-12 place-items-center rounded-full border bg-background/90 shadow-soft backdrop-blur transition hover:bg-secondary print:hidden ${FOCO}`}
      >
        <MessageSquareHeart className="size-5 text-accent" />
      </button>
      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent>
          <DialogTitle>Sua opinião — de graça e valiosa</DialogTitle>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {TIPOS.map((t) => (
                <button
                  key={t.v}
                  type="button"
                  aria-pressed={tipo === t.v}
                  onClick={() => setTipo(t.v)}
                  className={`rounded-full px-3 py-1.5 text-sm transition ${FOCO} ${tipo === t.v ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
                >
                  {t.l}
                </button>
              ))}
            </div>
            <Textarea
              aria-label="Sua mensagem"
              rows={5}
              maxLength={4000}
              placeholder="Fala sério com a gente — o que incomoda, o que falta, o que amou. Xingar pode, ajudar mais ainda."
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
            />
            <Input
              aria-label="Contato opcional"
              placeholder="Contato (opcional — se quiser resposta)"
              maxLength={120}
              value={contato}
              onChange={(e) => setContato(e.target.value)}
            />
            {erroEnvio && (
              <Aviso
                tom="atencao"
                acoes={<Button size="sm" variant="outline" disabled={mandando || texto.trim().length < 5} onClick={() => void mandar()}>Tentar novamente</Button>}
              >
                {erroEnvio}
              </Aviso>
            )}
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">Pode mandar anônimo. Guardamos só o essencial.</p>
              <Button size="sm" disabled={mandando || texto.trim().length < 5} onClick={() => void mandar()}>
                {mandando ? <LoaderCircle className="size-4 animate-spin" /> : <MessageSquareHeart className="size-4" />}
                Enviar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
