import type { SummitYear } from '@/lib/databaseModels';

export const CAN_SUBMIT_PRESENTATION: boolean = false;
// When true, the submission form shows a "save as draft" checkbox.
// Setting this independently of CAN_SUBMIT_PRESENTATION lets you allow
// draft-saving while keeping final submissions closed (or vice-versa).
export const CAN_SUBMIT_DRAFT: boolean = false;
export const currentDisplayYear: SummitYear = '2025';
export const submissionsForYear: SummitYear = '2025';
export const ticketYear: SummitYear = '2025';

export const startDate = new Date(Date.UTC(2025, 5, 23, 12, 0, 0));
export const eventUrl =
  'https://app.events.ringcentral.com/events/gla-summit-2025/';
