import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ImagePlus, Download, Trash2, Expand, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { prepareReference, finishReference } from "@/lib/references.functions";
import { streamImage } from "@/lib/stream-image";

export function ReferenceImage({ packageId, slot = "avatar" }: { packageId?: string; slot?: string }) {
  const prepare = useServerFn(prepareReference), finish = useServerFn(finishReference), qc = useQueryClient();
  const [busy, setBusy] = useState(false), [preview, setPreview] = useState<string | null>(null), [final, setFinal] = useState(false), [open, setOpen] = useState(false), [agree, setAgree] = useState(false), [err, setErr] = useState("");
  const running = useRef(false);
  const key = ["references", packageId ?? "avatar", slot];
  const q = useQuery({ queryKey: key, queryFn: async () => {
    let query = supabase.from("generated_references").select("id,path,status,error").eq("slot", slot).order("created_at", { ascending: false }).limit(1);
    query = packageId ? query.eq("package_id", packageId) : query.is("package_id", null);
    const { data, error } = await query.maybeSingle(); if (error) throw error;
    const signed = data?.path ? await supabase.storage.from("user-photos").createSignedUrl(data.path, 3600) : null;
    return { ...data, url: signed?.data?.signedUrl };
  } });
  const image = preview ?? q.data?.url;
  async function remove() {
    if (!q.data?.id) return;
    if (q.data.path) { const r = await supabase.storage.from("user-photos").remove([q.data.path]); if (r.error) throw r.error; await supabase.from("photos").delete().eq("path", q.data.path); }
    const r = await supabase.from("generated_references").delete().eq("id", q.data.id); if (r.error) throw r.error;
    setPreview(null); await qc.invalidateQueries({ queryKey: key });
  }
  async function generate() {
    if (running.current) return;
    running.current = true; setBusy(true); setErr(""); let id: string | undefined;
    try {
      if (q.data?.status === "ready" || q.data?.status === "generating") throw new Error("Existe uma solicitação em andamento. Aguarde ou descarte a anterior.");
      const r = await prepare({ data: { packageId, slot, agree } }); id = r.id;
      const { data: auth } = await supabase.auth.getSession(); if (!auth.session) throw new Error("Entre na sua conta.");
      let completed: string | undefined;
      await streamImage("/api/reference-image", { id }, (url, done) => { setPreview(url); setFinal(done); if (done) completed = url; }, undefined, { Authorization: `Bearer ${auth.session.access_token}` });
      if (!completed) throw new Error("A IA não devolveu uma imagem final.");
      const path = `${auth.session.user.id}/reference-${id}.png`;
      const blob = await (await fetch(completed)).blob();
      const upload = await supabase.storage.from("user-photos").upload(path, blob, { contentType: "image/png" }); if (upload.error) throw upload.error;
      await finish({ data: { id, path } });
      if (q.data?.id) await remove();
      await qc.invalidateQueries({ queryKey: key }); toast.success("Referência guardada em privado.");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Não foi possível gerar a imagem.";
      setErr(message); setPreview(null); if (id) await finish({ data: { id, error: message } }).catch(() => {});
    } finally { running.current = false; setBusy(false); }
  }
  return <div className="mt-4 space-y-3 border-t pt-3 print:hidden">
    {image && <figure><img src={image} alt="Referência visual gerada por IA, pessoa fictícia ou conceito ilustrado" className={`aspect-[2/3] w-full rounded-lg object-contain transition-[filter] ${busy && !final ? "blur-2xl" : "blur-0"}`} /><figcaption className="mt-2 text-xs text-muted-foreground">Gerado por IA · Referência visual — não é prova virtual</figcaption></figure>}
    {!image && <label className="flex items-start gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} />Autorizo gerar e guardar imagens privadas de pessoa fictícia. Usa créditos de IA, sem enviar minhas fotos.</label>}
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" disabled={busy || q.isLoading || (!image && !agree)} onClick={generate}>{busy ? <LoaderCircle className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}{busy ? "Gerando…" : image ? "Gerar novamente" : slot === "avatar" ? "Gerar retrato" : "Gerar imagem"}</Button>
      {image && !busy && <><Button size="icon" variant="ghost" title="Ampliar imagem" aria-label="Ampliar imagem" onClick={() => setOpen(true)}><Expand className="size-4" /></Button><Button size="icon" variant="ghost" title="Baixar imagem" aria-label="Baixar imagem" onClick={async () => { const blob = await (await fetch(image)).blob(); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "aura-id-referencia.png"; a.click(); URL.revokeObjectURL(url); }}><Download className="size-4" /></Button></>}
      {q.data?.id && !busy && <Button size="icon" variant="ghost" title="Excluir referência ou solicitação" aria-label="Excluir referência ou solicitação" onClick={() => remove().catch(() => toast.error("Não foi possível excluir."))}><Trash2 className="size-4" /></Button>}
    </div>
    {(err || q.data?.error) && <p role="alert" className="break-words text-xs text-destructive">{err || q.data?.error}</p>}
    {q.data?.status === "generating" && !busy && <p className="text-xs text-muted-foreground">Solicitação em andamento. Se a página foi fechada, descarte a solicitação antes de iniciar outra.</p>}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90vh] overflow-auto"><DialogTitle>Referência visual · Gerado por IA</DialogTitle>{image && <img src={image} alt="Referência ampliada" className="w-full object-contain" />}</DialogContent></Dialog>
  </div>;
}