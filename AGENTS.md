<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- Arcade want-to-play markers use a separate owner-scoped wishlist; filter by explicit saved markers independently of Played tracking. Why: unplayed games are not automatically wishlisted.
- Password recovery uses the public `/reset-password` page, validates a recovery link/session, and updates only the new password; ordinary sign-in sessions cannot open its form. Why: email recovery must work without redirecting to Today or requiring the old password.
- Starpath sections use `groupCourses` to separate completed enrollments from active and Extra Credit courses and sort the unified completion list. Why: prior and newly completed courses must appear together without remaining in active lists.
- Friend removal deletes only the selected accepted friendship through the caller's RLS-scoped client, then refreshes social data; shared squad memberships are untouched. Why: unlinking friends must not remove squad participation.
- Built-in courses/tracks live in `src/lib/catalog.ts`; admin edits are stored as overrides in `catalog_items` and merged in place by `useCatalog()` (pages showing courses must call it). Why: providers have no shared public API, and the admin can still curate without code changes.
- Admin is a `user_roles` row granted by trigger to the owner's verified email; never check admin by email in client code. Why: prevents privilege escalation.
- Uploaded avatars are stored as small 256px data URLs in `profiles.avatar_url` (workspace blocks public storage buckets). Why: public profiles need permanent image links.
- Schedules are computed client-side from unfinished units starting today (`src/lib/schedule.ts`), never stored. Why: missed days rebalance automatically.
- XP and streaks change only through security-definer RPCs (complete_unit, daily_checkin, complete_course); profiles' xp/streak columns are not user-updatable. Why: prevent self-awarded XP.
- Lesson undo uses uncomplete_unit to atomically remove today's completion, reverse XP, and reopen a completed course; final-lesson navigation uses a course search parameter on Starpath. Why: prevents undo/recheck XP farming and targets the certificate dialog for either planned or extra courses.
- Learner-added courses live in `user_courses` (owner + admin read), are drafted by `draftCourseFromUrl` (AI reads the page) and merged into the catalog only for their owner via `applyUserCourses`. Allowed sites are in `src/lib/providers.ts` and mirrored in the table's insert policy. Why: keeps personal courses private while matching the built-in course shape.
- Extra Credit = `enrollments.extra`; it earns XP through `complete_unit` but `computePlan` skips it. Why: bonus work must never shift the weekly plan.
- A study day ends at 03:00 in the learner's time zone (`profiles.tz`, synced on load): client uses `src/lib/day.ts`, server uses `public.local_day()`. Why: late-night study counts toward the right day and streak.
- Every route declares `staticData.sitemap`; `/sitemap.xml` is derived from those decisions (`src/lib/sitemap.ts`). Why: new pages must make an explicit search-listing choice.
