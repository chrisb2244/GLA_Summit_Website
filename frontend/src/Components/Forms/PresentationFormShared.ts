/**
 * Shared types and validation constants used by both the new-submission form
 * and the draft-edit form.
 */
import type { PresentationType } from '@/lib/databaseModels';
import type { EmailProps, PersonProps } from '../Form/Person';

export type PresentationBaseFormData = {
  submitter: PersonProps;
  otherPresenters: EmailProps[];
  isFinal: boolean;
  speakerAgreement: boolean;
  title: string;
  abstract: string;
  learningPoints: string;
  presentationType: PresentationType;
};

export const TITLE_MAX = 150;
export const ABSTRACT_MAX = 5000;
export const ABSTRACT_MIN = 100;
export const LEARNING_POINTS_MIN = 50;
