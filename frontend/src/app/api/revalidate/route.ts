import type { NextRequest } from 'next/server';
import { revalidateTag } from 'next/cache';
import { createAdminClient } from '@/lib/supabaseClient';
import { logToDb } from '@/lib/utils';
import { isSummitYear } from '@/lib/databaseModels';
import {
  CACHE_TAGS,
  cacheTagForPresentation,
  cacheTagForPresentationVideo,
  cacheTagForPresenterPresentations,
  cacheTagForYear
} from '@/lib/supabase/cacheTags';

/**
 * On-demand cache revalidation for data that is mutated outside the app
 * (acceptance, scheduling, and video links are edited directly in Supabase,
 * not through a server action). A Supabase database webhook POSTs the changed
 * row here and we expire the matching cache tags so the public pages refresh
 * without waiting for the time backstop in `next.config.ts`.
 *
 * Authenticated with a shared secret (`SECRET_REVALIDATE_TOKEN`) sent in the
 * `x-revalidate-secret` header, configured on the webhook.
 */

/** Header carrying the shared secret. Must match the webhook configuration. */
const SECRET_HEADER = 'x-revalidate-secret';

/** The subset of the Supabase webhook payload we rely on. */
type WebhookPayload = {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  // `record` is the new row (null on DELETE); `old_record` is the previous row
  // (null on INSERT). We read whichever is present.
  record: Record<string, unknown> | null;
  old_record: Record<string, unknown> | null;
};

export async function POST(request: NextRequest) {
  const expected = process.env.SECRET_REVALIDATE_TOKEN;
  if (!expected) {
    // Fail closed: without a configured secret we cannot authenticate callers.
    await logToDb(
      'error',
      'Revalidate webhook called but SECRET_REVALIDATE_TOKEN is unset',
      'api/revalidate'
    );
    return Response.json(
      { revalidated: false, message: 'Revalidation is not configured' },
      { status: 503 }
    );
  }

  const provided = request.headers.get(SECRET_HEADER);
  if (!provided || provided !== expected) {
    return Response.json(
      { revalidated: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  let payload: WebhookPayload;
  try {
    payload = (await request.json()) as WebhookPayload;
  } catch {
    return Response.json(
      { revalidated: false, message: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const tags = await tagsForPayload(payload);

  if (tags.size === 0) {
    await logToDb(
      'info',
      'Revalidate webhook produced no matching tags',
      'api/revalidate',
      { context: { table: payload?.table ?? null, type: payload?.type ?? null } }
    );
    return Response.json({
      revalidated: false,
      message: 'No matching tags',
      table: payload?.table ?? null
    });
  }

  // `{ expire: 0 }` is the route-handler form for external systems: it expires
  // the tag immediately (server actions would use `updateTag`, which is not
  // available outside an action).
  for (const tag of tags) {
    revalidateTag(tag, { expire: 0 });
  }

  return Response.json({ revalidated: true, tags: [...tags], now: Date.now() });
}

/**
 * Map a changed row to the set of cache tags that should be expired.
 *
 * `accepted_presentations.id` is the presentation id (the PK references
 * `presentation_submissions.id`), and `video_links.presentation_id` likewise.
 */
const tagsForPayload = async (
  payload: WebhookPayload
): Promise<Set<string>> => {
  const tags = new Set<string>();
  const row = payload?.record ?? payload?.old_record;
  if (!row) {
    return tags;
  }

  switch (payload.table) {
    case 'accepted_presentations': {
      const presentationId = typeof row.id === 'string' ? row.id : null;
      if (!presentationId) {
        break;
      }
      const year =
        typeof row.year === 'string' && isSummitYear(row.year)
          ? row.year
          : null;

      // Acceptance (insert/delete) and scheduling (update) both change the
      // presentation page, the year list, and the agenda.
      tags.add(cacheTagForPresentation(presentationId));
      tags.add(CACHE_TAGS.agenda);
      // Accepting/un-accepting changes the set of accepted presenters shown on
      // the /presenter-list pages. (Harmless to expire on a schedule-only update.)
      tags.add(CACHE_TAGS.acceptedPresenterIds);
      if (year) {
        tags.add(cacheTagForYear(year));
        tags.add(`${CACHE_TAGS.acceptedPresenterIds}:${year}`);
      }

      // Each presenter's own page lists this presentation. The admin client
      // bypasses RLS — the public policy only exposes presenters while the
      // acceptance row exists, which would hide them on a DELETE webhook.
      for (const id of await getPresenterIds(presentationId)) {
        tags.add(cacheTagForPresenterPresentations(id));
      }
      break;
    }
    case 'video_links': {
      const presentationId =
        typeof row.presentation_id === 'string' ? row.presentation_id : null;
      if (presentationId) {
        tags.add(cacheTagForPresentationVideo(presentationId));
      }
      break;
    }
  }

  return tags;
};

/** Presenter ids attached to a presentation, for per-presenter page tags. */
const getPresenterIds = async (presentationId: string): Promise<string[]> => {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('presentation_presenters')
    .select('presenter_id')
    .eq('presentation_id', presentationId);

  if (error) {
    await logToDb(
      'error',
      'Failed to look up presenters for revalidation',
      'api/revalidate',
      {
        context: { presentationId, message: error.message, code: error.code }
      }
    );
    return [];
  }

  return data.map((r) => r.presenter_id);
};
