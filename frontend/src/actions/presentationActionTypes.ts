export const COPRESENTER_LOOKUP_CLIENT_ERROR =
  'Unable to verify co-presenter accounts right now. Please try again.';
export const PRESENTATION_SAVE_CLIENT_ERROR =
  'Unable to save the presentation right now. Please try again.';
export const DRAFT_DELETE_CLIENT_ERROR =
  'Unable to delete the draft right now. Please try again.';
export const DRAFT_UPDATE_CLIENT_ERROR =
  'Unable to update the draft right now. Please try again.';

export type SubmitReturnType =
  | { success: true }
  | { success: false; error: { message: string } }
  | { success: false; isDuplicate: true; existingId: string; existingTitle: string };

export type DeleteReturnType =
  | { success: true }
  | { success: false; error: { message: string } };

export type UpdateReturnType =
  | { success: true }
  | { success: false; error: { message: string } };
