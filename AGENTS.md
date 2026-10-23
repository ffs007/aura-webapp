<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Signed-in pages live under src/routes/_authenticated/; its layout also gates on consent and completed profile so no app page runs without consent.
- AI suggestion generation and privileged actions (account deletion, admin stats) live in src/lib/aura.functions.ts as authenticated server functions; keep AI keys and service-role access server-side.
- Generated packages are stored as structured JSON in packages.content and follow the AuraPackage type in src/lib/aura.ts; update the server JSON schema and the type together.
- UI copy is hard-coded Brazilian Portuguese (no i18n library); shared labels/enums live in src/lib/aura.ts.
- New spec documents are parts of the same Aura ID app: merge and dedupe into existing routes/tables instead of creating parallel modules.
- AI calls go through callJson in src/lib/ai.server.ts (streamed Responses + strict JSON schema); DNA usage must respect consents.personalization, dna_paused and module_permissions.
- Visual DNA lives under src/routes/_authenticated/dna/ (layout + tabs); every summary change writes a dna_versions row, every user correction a dna_corrections row.
- Makeup module lives under src/routes/_authenticated/maquiagem/; makeup looks are rows in packages with kind='makeup_look' (MakeupLook in src/lib/makeup.ts) so compare/collections/export stay shared.
- Hair module lives under src/routes/_authenticated/cabelo/; hair plans are rows in packages with kind='hair_plan' (HairPlan in src/lib/hair.ts); catalog/safety rules in hair_catalog/hair_rules tables.
- Clothing module lives under src/routes/_authenticated/roupas/; outfits are rows in packages with kind='outfit' (Outfit in src/lib/clothing.ts); gap/capsule/purchase/mission AI results are rows in style_analyses by kind.
- Tattoo planning uses tattoo_projects for private intentions/checklists, packages with kind='tattoo_plan' extending AuraPackage for shared views, existing photos/reminders for project attachments, and tattoo_care_logs for private observations; this avoids parallel libraries and notification systems.
- Tattoo body-photo storage requires general photo permission plus tattoo_profiles.body_photo_consent enforced by database/storage policies; no tattoo image is sent to AI, and private intentions/notes/journals never feed DNA or briefing exports.
- Tattoo exports require per-briefing confirmation and exclude the module from bulk downloads; this prevents accidental disclosure of private notes and bodily references.
- Journey module lives under src/routes/_authenticated/jornada/ (UI in src/components/journey/); plans/steps/reflections/reports in journey_* tables, photos reuse photos (kind='journey'), reminders reuse reminders.journey_plan_id; emotional notes never leave the app or feed DNA.
- Onboarding (src/routes/_authenticated/onboarding.tsx + src/components/onboarding/) is driven by field definitions in src/lib/onboarding.ts; answers, pending fields and last step live in visual_profiles.data so drafts resume without a new table.
- Presentation preferences live in visual_profiles.data and use shared presentation rules across generation modules; explicit per-request overrides are stored in package context to preserve historical results.
- Beard profiles use beard_profiles and generated plans use AuraPackage-compatible packages kind='beard_plan', sharing comparison, collections and export rather than separate libraries.
- Private generated references use generated_references keyed by user/package/slot and the authenticated image streaming route; prompts contain only allowlisted visual fields and never personal photos or private journals.
