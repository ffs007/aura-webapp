# Aura ID — MVP Plan

An emotionally safe, AI-powered visual identity companion. Recommendations are framed as invitations and experiments, never rankings or rules.

## Visual direction
Editorial, calm, warm: ivory/sand backgrounds, deep plum ink, muted terracotta accent. Serif display headings (Cormorant) with a clean sans body (Karla). Soft rounded cards, generous whitespace, gentle motion. "AI-generated" labels on every output.

## Phase 1 (this build)
1. **Landing page** (/) — value proposition, principles (no ranking, no body shaming), CTA to sign up.
2. **Auth** — email/password + Google sign-in via Lovable Cloud.
3. **Consent & privacy** — granular toggles: photo processing, cross-module personalization (Visual DNA), reminders. Every change logged; revocable in Settings.
4. **Onboarding wizard** (quick mode 4 steps / deep mode 8 steps) — goals, profession, dress code, climate/city, routine, budget, maintenance tolerance, comfort with change, preferred and rejected references, culture notes (optional, never inferred).
5. **Session start** — emotional mode selector + entry mode (General transformation, Event, Quick test, Professional, Makeup, Hair, Clothing, Tattoo planning, Saved collections) + occasion and desired intensity.
6. **Photo/reference upload** (optional, behind explicit consent) — private storage, user-only access, delete anytime.
7. **AI package generation** — 3–5 integrated packages, each with safe / intermediate / bold variations covering clothing, makeup, hair, accessories, tattoo visibility. Includes cost, maintenance, reversibility, adaptation time, risks, professional-validation flag, "why it works", step-by-step plan, event checklist when in event mode. Warnings for tattoos, chemical hair, permanent changes.
8. **Recommendation dashboard + package detail** — save, reject, annotate, approve, adapt (regenerate with note), mark "beautiful but not practical".
9. **Compare** — side-by-side view of 2–3 packages.
10. **Visual DNA** — signals learned from feedback, only if personalization consent is on; editable and deletable.
11. **Saved collections** — group packages.
12. **Feedback after use** — short reflection that feeds Visual DNA (if authorized).
13. **Export center** — download plan as Markdown/printable page (Google Docs export listed as optional future connector).
14. **Settings & data** — consents, delete photos / recommendations / Visual DNA / entire account, in-app reminders.
15. **Admin (role-gated)** — consent audit, event counts/usage metrics (no photos), error log, connector status, content safety config (blocked terms list).

## Out of scope (marked in-app as "Fora do escopo dos conectores Lovable")
Photorealistic personal image generation, advanced hairstyle simulation, real-time AR, tattoo-on-movement simulation, live video correction. External reminders (Gmail/Telegram/Twilio), Google Drive export, Notion, BigQuery, Calendar — roadmap, added later on request.

## Technical details
- Lovable Cloud: tables `profiles`, `consents`, `visual_profiles`, `sessions`, `photos` (metadata), `packages`, `package_feedback`, `annotations`, `collections`, `collection_items`, `visual_dna`, `reminders`, `audit_events`, `safety_config`, `user_roles` (+ `has_role` security-definer). RLS: owner-only on all user data; admin read on aggregates/audit only.
- Private storage bucket `user-photos`, path `{user_id}/...`, owner-only policies.
- AI via Lovable AI Gateway (Gemini) in a server function with structured output (tool calling) for the package schema; profile + Visual DNA + rejected references injected into the prompt; safety system prompt forbids ranking/body judgments. Optional photo analysis only when consent is on.
- Audit events written for consent granted/revoked, photo uploaded/deleted, package generated/saved/rejected, plan exported, reminder enabled, data deleted.
- Loading, empty, error and signed-out states on every screen; 429/402 AI errors surfaced gently.
- Interface language: English (can add Portuguese on request).
