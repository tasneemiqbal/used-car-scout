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

## Brand preparation
- Keep imported supporting brand foundations in `src/design` and CDN pointers in `src/assets/brand`, separate from application screens, so assets can be reused without importing prebuilt UI.

## Application boundaries
- Evaluate time-dependent validation limits inside request-time refinements, not at module initialization, because the published Worker clock can start at the epoch.
- Define client-safe validated input/evidence contracts separately from server integrations so untrusted input cannot expand stored or shared report fields.
- Keep report and vehicle-cache tables server-only with explicit service-role grants and no browser policies; report access is an exact validated random-capability lookup, not a list or search.
- Compute ownership estimates in deterministic code with explicit assumptions and exclusions so AI cannot invent arithmetic or imply an all-inclusive cost.
- Enforce paid-operation allowances through atomic server-only database counters and HMAC-signed HttpOnly visitor cookies, never unverified forwarded headers or client-supplied limits; attach the operation middleware before any billable work and fail closed on counter errors.
- Prune stale usage counters in bounded request-time batches rather than permanent scheduled polling; anonymous cookie limits are abuse mitigation, not authentication or a complete spending cap.
- Marketing pages share one shell (`SitePage` in src/components/site.tsx) and reuse section components, so the homepage and standalone pages never drift.
- Recall presentation explains part names and next steps separately from unchanged official defect and remedy text, so beginner-friendly labels never invent recall facts.
- Scout chat VIN checks use server-side NHTSA decode and decoded-model-year recalls, never per-VIN repair/history claims, because the free API does not expose those records.
- Sanitized listing claims travel with report requests and deterministically override risk/highlight ordering, because government model-year records cannot detect seller scams or admitted damage.
- Demo examples use fictional client-safe text or privacy-redacted real listing screenshots, clearly labeled and sent through the ordinary checker and its existing limits; never bypass safeguards or load another visitor's report to demonstrate the app.
- Government configurations remain distinct; fuel budgets conservatively use the lowest matching gasoline MPG and explicit assumed fuel prices, because the listing may not identify an engine or body style.
- Scout replies use validated answer/follow-up/draft/feedback objects carried as UI-message data, because client text must not invent suggestions or interpret untrusted output as instructions.
- Restore chat history only after its report/language/practice-settings key matches the active window, because mounting with stale empty history can overwrite saved conversations.
- Report chat hash links open and focus the chat, and its language picker uses the shared saved language choice, so navigation and Spanish replies work from existing reports.
- Use the shared selected language for every screen; a report keeps the language it was created in (no after-the-fact translation — removed as too slow and fragile).
- Convert HEIC on the buyer's device before upload, because stored/server image contracts accept only validated JPEG, PNG and WebP bytes.
- Share-image previews and downloads use the same escaped SVG artwork and global CSS palette tokens so their layout and values cannot drift.
