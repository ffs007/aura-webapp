import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ENTRY_MODES, EMOTIONAL_MODES, logEvent } from "@/lib/aura";
import { generatePackages } from "@/lib/aura.functions";
import { cn } from "@/lib/utils";
import { PresentationChoice } from "@/components/PresentationChoice";

export const Route = createFileRoute("/_authenticated/studio")({
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: "Estúdio — Aura ID" }, { name: "description", content: "Comece uma nova exploração visual." }, { property: "og:title", content: "Estúdio — Aura ID" }, { property: "og:description", content: "Comece uma nova exploração visual." }] }),
  component: Studio,
});

type Photo = { id: string; path: string; url?: string | undefined };

function Studio() {
  const nav = useNavigate();
  const { user } = Route.useRouteContext();
  const gen = useServerFn(generatePackages);
  const [emotion, setEmotion] = useState("curious");
  const [entry, setEntry] = useState("general");
  const [occasion, setOccasion] = useState("");
  const [extra, setExtra] = useState("");
  const [intensity, setIntensity] = useState(3);
  const [busy, setBusy] = useState(false);
  const [photoConsent, setPhotoConsent] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [presentation, setPresentation] = useState("");

  async function loadPhotos() {
    const { data } = await supabase.from("photos").select("id, path").order("created_at", { ascending: false });
    const withUrls = await Promise.all((data ?? []).map(async (p) => {
      const { data: s } = await supabase.storage.from("user-photos").createSignedUrl(p.path, 3600);
      return { ...p, url: s?.signedUrl };
    }));
    setPhotos(withUrls);
  }

  useEffect(() => {
    supabase.from("visual_profiles").select("data").eq("user_id", user.id).maybeSingle().then(({ data }) => setPresentation(String((data?.data as Record<string, unknown> | null)?.["presentation"] ?? "")));
    supabase.from("consents").select("photo_processing").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      setPhotoConsent(!!data?.photo_processing);
      if (data?.photo_processing) loadPhotos();
    });
  }, [user.id]);

  async function upload(files: FileList | null) {
    if (!files) return;
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("image/")) { toast.error(`${f.name} não é uma imagem`); continue; }
      const path = `${user.id}/${crypto.randomUUID()}-${f.name.replace(/[^\w.]/g, "_")}`;
      const { error } = await supabase.storage.from("user-photos").upload(path, f);
      if (error) { toast.error(`Falha no envio: ${error.message}`); continue; }
      await supabase.from("photos").insert({ user_id: user.id, path });
      await logEvent("photo_uploaded");
    }
    loadPhotos();
  }

  async function removePhoto(p: Photo) {
    await supabase.storage.from("user-photos").remove([p.path]);
    await supabase.from("photos").delete().eq("id", p.id);
    await logEvent("photo_deleted");
    setPhotos(photos.filter((x) => x.id !== p.id));
  }

  async function generate() {
    if (entry === "beard") { nav({ to: "/barba" }); return; }
    if (entry === "makeup") { nav({ to: "/maquiagem/gerar" }); return; }
    setBusy(true);
    try {
      const r = await gen({ data: { entryMode: entry, emotionalMode: emotion, occasion, extra, intensity, presentation: presentation === "masculine" || presentation === "feminine" ? presentation : undefined } });
      if (r.error) { toast.error(r.error); return; }
      nav({ to: "/dashboard", search: { batch: r.batchId ?? undefined } });
    } catch (e) {
      toast.error("Algo deu errado ao criar suas sugestões.");
      console.error(e);
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-12">
      <PresentationChoice value={presentation} onChange={setPresentation} />
      <div className="animate-rise">
        <h1 className="text-5xl">Como você chega hoje?</h1>
        <p className="mt-2 text-muted-foreground">Seu humor define o quão ousados — ou suaves — serão nossos convites.</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {EMOTIONAL_MODES.map((m) => (
            <button key={m.id} onClick={() => setEmotion(m.id)} className={cn("rounded-full border px-4 py-2 text-sm transition", emotion === m.id ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-secondary")} title={m.hint}>{m.label}</button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-3xl">O que você quer explorar?</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ENTRY_MODES.map((m) => (
            <button key={m.id} onClick={() => setEntry(m.id)} className={cn("rounded-2xl border p-4 text-left transition", entry === m.id ? "border-accent bg-card shadow-soft" : "bg-card/60 hover:bg-card")}>
              <div className="font-medium">{m.label}</div><div className="text-xs text-muted-foreground">{m.hint}</div>
            </button>
          ))}
          <Link to="/collections" className="rounded-2xl border border-dashed p-4 text-left hover:bg-card">
            <div className="font-medium">Coleções salvas</div><div className="text-xs text-muted-foreground">Reveja o que você guardou</div>
          </Link>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-5">
          <div className="space-y-2"><Label>{entry === "event" ? "O evento (data, lugar, clima)" : "Ocasião ou contexto (opcional)"}</Label><Input value={occasion} onChange={(e) => setOccasion(e.target.value)} placeholder={entry === "event" ? "Casamento de amiga, ao ar livre, tarde de março" : "ex.: emprego novo mês que vem"} /></div>
          <div className="space-y-2"><Label>Intensidade desejada</Label><Slider min={1} max={5} step={1} value={[intensity]} onValueChange={([v]) => setIntensity(v ?? 3)} /><div className="flex justify-between text-xs text-muted-foreground"><span>Sutil</span><span>Marcante</span></div></div>
          <div className="space-y-2"><Label>Algo mais para hoje?</Label><Textarea value={extra} onChange={(e) => setExtra(e.target.value)} rows={3} placeholder="ex.: só tenho 10 minutos de manhã" /></div>
        </div>
        <div className="rounded-2xl border bg-card p-5">
          <h3 className="text-2xl">Fotos e referências</h3>
          {photoConsent ? (
            <>
              <p className="mt-1 text-sm text-muted-foreground">Opcional e privado. Só você vê; exclua quando quiser.</p>
              <Input type="file" accept="image/*" multiple className="mt-4" onChange={(e) => upload(e.target.files)} />
              {photos.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">Nenhuma referência ainda.</p> : (
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {photos.map((p) => (
                    <div key={p.id} className="group relative overflow-hidden rounded-lg">
                      {p.url && <img src={p.url} alt="Sua referência" loading="lazy" className="aspect-square w-full object-cover" />}
                      <button onClick={() => removePhoto(p)} className="absolute inset-x-0 bottom-0 bg-foreground/70 py-1 text-xs text-background opacity-0 group-hover:opacity-100">Excluir</button>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">O processamento de fotos está desligado. Você pode ativá-lo em <Link to="/settings" className="underline">Configurações</Link> — nunca é obrigatório.</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button size="lg" variant="accent" onClick={generate} disabled={busy}>{busy ? "Compondo seus convites…" : entry === "makeup" ? "Ir para o gerador de maquiagem" : "Criar minhas sugestões"}</Button>
        {busy && <span className="text-sm text-muted-foreground">Isso pode levar até um minuto.</span>}
      </div>
    </div>
  );
}
