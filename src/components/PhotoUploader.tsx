import { Link } from "@tanstack/react-router";
import { useEffect, useId, useState } from "react";
import { toast } from "sonner";
import { ImagePlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { CarregandoInline, EstadoErro, EstadoVazio } from "@/components/estados";
import { CARTAO_COMPACTO, FOCO, TITULO_ITEM } from "@/lib/design";
import { logEvent } from "@/lib/aura";

type Photo = { id: string; path: string; url?: string | undefined };

export function PhotoUploader({ userId, kind = "reference", title = "Fotos e referências", note }: { userId: string; kind?: string; title?: string; note?: string }) {
  const [consent, setConsent] = useState<boolean | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [erroCarga, setErroCarga] = useState(false);
  const uploadId = useId();

  async function load() {
    setErroCarga(false);
    const { data, error } = await supabase.from("photos").select("id, path").eq("kind", kind).order("created_at", { ascending: false });
    if (error) { setErroCarga(true); return; }
    setPhotos(await Promise.all((data ?? []).map(async (p) => ({ ...p, url: (await supabase.storage.from("user-photos").createSignedUrl(p.path, 3600)).data?.signedUrl }))));
  }
  useEffect(() => {
    supabase.from("consents").select("photo_processing").eq("user_id", userId).maybeSingle().then(({ data }) => { setConsent(!!data?.photo_processing); if (data?.photo_processing) load(); });
  }, [userId]);

  async function upload(files: FileList | null) {
    if (!files) return;
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("image/")) { toast.error(`${f.name} não é uma imagem`); continue; }
      const path = `${userId}/${crypto.randomUUID()}-${f.name.replace(/[^\w.]/g, "_")}`;
      const { error } = await supabase.storage.from("user-photos").upload(path, f);
      if (error) { toast.error(`Falha no envio: ${error.message}`); continue; }
      await supabase.from("photos").insert({ user_id: userId, path, kind });
      await logEvent("photo_uploaded", { kind });
    }
    load();
  }
  async function remove(p: Photo) {
    await supabase.storage.from("user-photos").remove([p.path]);
    await supabase.from("photos").delete().eq("id", p.id);
    await logEvent("photo_deleted", { kind });
    setPhotos(photos.filter((x) => x.id !== p.id));
  }

  return (
    <div className={CARTAO_COMPACTO}>
      <h3 className={TITULO_ITEM}>{title}</h3>
      {consent === null ? (
        <CarregandoInline className="mt-2" />
      ) : !consent ? (
        <p className="mt-2 text-sm text-muted-foreground">O processamento de fotos está desligado. Você pode ativá-lo em <Link to="/settings" className="underline">Configurações</Link> — nunca é obrigatório.</p>
      ) : (
        <>
          <p className="mt-1 text-sm text-muted-foreground">{note ?? "Opcional e privado. Só você vê; exclua quando quiser."}</p>
          {kind === "face" && !agreed ? (
            <label className="mt-3 flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" onChange={(e) => setAgreed(e.target.checked)} />Concordo em enviar fotos do meu rosto, guardadas de forma privada e usadas só para minhas sugestões.</label>
          ) : (
            <Input id={uploadId} aria-label="Enviar fotos" type="file" accept="image/*" multiple className="mt-4" onChange={(e) => upload(e.target.files)} />
          )}
          {erroCarga && <EstadoErro className="mt-4" titulo="Não foi possível carregar suas fotos" onTentarNovamente={() => void load()} />}
          {!erroCarga && photos.length === 0 ? (
            <EstadoVazio
              compacto
              className="mt-4"
              icone={<ImagePlus className="size-5" />}
              titulo="Nenhuma foto ainda"
              descricao="Envie a primeira foto para a Aura entender seu contexto. É opcional e fica privada."
              acoes={
                kind === "face" && !agreed ? undefined : (
                  <label htmlFor={uploadId} className="inline-flex h-8 cursor-pointer items-center rounded-full border border-input bg-background px-3 text-xs font-medium shadow-sm transition-colors hover:bg-secondary">Escolher foto</label>
                )
              }
            />
          ) : (
            <div className="mt-4 grid grid-cols-4 gap-2">
              {photos.map((p) => (
                <div key={p.id} className="group relative overflow-hidden rounded-lg">
                  {p.url && <img src={p.url} alt="Sua foto" loading="lazy" className="aspect-square w-full object-cover" />}
                  <button onClick={() => remove(p)} className={`absolute inset-x-0 bottom-0 bg-foreground/70 py-1 text-xs text-background opacity-0 group-hover:opacity-100 focus-visible:opacity-100 ${FOCO}`}>Excluir</button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
