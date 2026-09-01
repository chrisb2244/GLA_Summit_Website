import type { SummitYear } from '@/lib/databaseModels';

/**
 * Agenda entries that are not presentation submissions.
 *
 * The welcome, the keynotes and the NI Expert Bar AMAs all appear on the
 * schedule, but none of them is an accepted submission: they have no
 * `/presentations/[id]` page, no abstract, and no presenter profiles.
 *
 * They are rendered without links and styled differently to show a distinction
 * from the normally accepted presentations.
 *
 * Unlike submissions, whose length is derived from `presentation_type`, these
 * carry an explicit `start`/`end`. Both are ISO 8601 in UTC, matching the
 * `scheduled_for` values in the database and `startDate` in configConstants.
 *
 * Source: the 2026 schedule export from the event platform.
 */
export type AgendaExtraKind = 'stage' | 'expert-bar';

export type AgendaExtra = {
  kind: AgendaExtraKind;
  title: string;
  speakers: string[];
  /** ISO 8601, UTC. */
  start: string;
  /** ISO 8601, UTC. */
  end: string;
};

/** Human-readable badge text, keyed by kind. */
export const agendaExtraLabels: Record<AgendaExtraKind, string> = {
  stage: 'Stage',
  'expert-bar': 'NI Expert Bar'
};

/**
 * Keyed by every summit year, so adding a year to the `summit_year` enum forces
 * a decision here rather than silently defaulting — the same guard
 * `summitStartDates` uses.
 */
export const agendaExtras: Record<SummitYear, AgendaExtra[]> = {
  '2020': [],
  '2021': [],
  '2022': [],
  '2024': [],
  '2025': [],
  '2026': [
    {
      kind: 'stage',
      title: 'Welcome to the GLA Summit!',
      speakers: ['William Richards'],
      start: '2026-08-31T12:00:00Z',
      end: '2026-08-31T12:10:00Z'
    },
    {
      kind: 'stage',
      title: 'GLA Summit 2026 Keynote: Leading with LabVIEW in an AI World',
      speakers: ['Graham Green'],
      start: '2026-08-31T15:00:00Z',
      end: '2026-08-31T16:00:00Z'
    },
    {
      kind: 'expert-bar',
      title: 'NI Expert AMA - LabVIEW & Community',
      speakers: ['Adam Roig'],
      start: '2026-08-31T16:00:00Z',
      end: '2026-08-31T17:00:00Z'
    },
    {
      kind: 'expert-bar',
      title: 'NI Expert AMA - LabVIEW & Marketing',
      speakers: ['Graham Green'],
      start: '2026-08-31T17:00:00Z',
      end: '2026-08-31T18:00:00Z'
    },
    {
      kind: 'expert-bar',
      title: 'NI Expert AMA - Nigel in LabVIEW',
      speakers: ['David Prida'],
      start: '2026-08-31T18:00:00Z',
      end: '2026-08-31T19:00:00Z'
    },
    {
      kind: 'expert-bar',
      title: 'NI Expert AMA - LabVIEW Roadmap',
      speakers: ['Austin Hill', 'Christine Sparks'],
      start: '2026-09-01T01:00:00Z',
      end: '2026-09-01T02:00:00Z'
    },
    {
      kind: 'expert-bar',
      title: 'NI Expert AMA - LabVIEW Design Principles',
      speakers: ['NORM !'],
      start: '2026-09-01T02:00:00Z',
      end: '2026-09-01T03:00:00Z'
    },
    {
      kind: 'stage',
      title: 'GLA Summit 2026 Keynote Round 2: Leading with LabVIEW in an AI World',
      speakers: ['Graham Green'],
      start: '2026-09-01T03:00:00Z',
      end: '2026-09-01T04:00:00Z'
    }
  ]
};
