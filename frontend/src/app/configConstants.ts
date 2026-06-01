import type { SummitYear } from '@/lib/databaseModels';

export const CAN_SUBMIT_PRESENTATION: boolean = true;
// When true, the submission form shows a "save as draft" checkbox.
// Setting this independently of CAN_SUBMIT_PRESENTATION lets you allow
// draft-saving while keeping final submissions closed (or vice-versa).
export const CAN_SUBMIT_DRAFT: boolean = true;
// Co-presenter accept/decline invite workflow. OFF = implicit acceptance (co-presenters
// added directly, no invite emails, no accept/decline route). The route + server actions
// are shipped but hard-gated; COPRESENTER_INVITE_KEY is intentionally left UNDEFINED while
// off (the verify path then fails closed). To enable: set a strong COPRESENTER_INVITE_KEY
// (openssl rand -hex 32), then flip this to true.
export const COPRESENTER_INVITE_WORKFLOW: boolean = false;
// Set to true once banner images for the current year are ready to publish.
export const MEDIA_BANNERS_AVAILABLE: boolean = false;

// Controls for which year the presentation-list defaults,
// and for which year the agenda is displayed.
// This should be updated once presentations are accepted for a given year.
export const currentDisplayYear: SummitYear = '2025';

// The year for which presentation submissions are currently open.
// Also controls the subjects in registration and login emails.
// Update before opening presentation submissions.
export const submissionsForYear: SummitYear = '2026';

// The year for which tickets are currently being issued.
// Also governs the homepage metadata,
// the OG image generation for the homepage,
// and the ICS file subject for the overall event.
// Update when effectively transitioning the site to reflect primarily a new event year.
export const ticketYear: SummitYear = '2026';

// Cache-busting version for the generated ticket OG image (/api/ticket).
// It is not part of the signed data, so it does not affect token validation.
export const TICKET_DESIGN_VERSION = 1;

export const startDate = new Date(Date.UTC(2026, 7, 31, 12, 0, 0));
export const eventUrl =
  'https://app.events.ringcentral.com/events/gla-summit-2026/';
