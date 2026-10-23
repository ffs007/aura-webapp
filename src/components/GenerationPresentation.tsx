import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PresentationChoice } from "./PresentationChoice";
export function GenerationPresentation({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  useEffect(() => { supabase.from("visual_profiles").select("data").maybeSingle().then(({ data }) => { const p = (data?.data ?? {}) as Record<string, unknown>; if (p["presentation"]) onChange(String(p["presentation"])); }); }, []);
  return <PresentationChoice value={value} onChange={onChange} />;
}