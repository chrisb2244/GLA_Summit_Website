import { Database } from './sb_databaseModels';

export type PresentationType = Database['public']['Enums']['presentation_type'];
export type MyPresentationSubmissionType =
  Database['public']['Views']['my_submissions']['Row'];

export type SummitYear = Database['public']['Enums']['summit_year'];
export const currentDisplayYear: SummitYear = '2022';
export const submissionsForYear: SummitYear = '2024';

// Awkward typing code to check that years are exhaustively covered
// This prevents an issue in which updating the database type (e.g. to add another year)
// expands the type 'SummitYear' but the 'summityears' constant is not expanded.
// That would break the type guard function, 'isSummitYear'.

// You can check this by deleting e.g. '2023' from the array of summityears.
// If a type error occurs at 'exactType(summitCandidateYear, dummyYear)' then
// the types are mismatched (likely because the SummitYear type has expanded).
type IfEquals<T, U, Y = unknown, N = never> = (<G>() => G extends T
  ? 1
  : 2) extends <G>() => G extends U ? 1 : 2
  ? Y
  : N;

declare const exactType: <T, U>(
  a: T & IfEquals<T, U>,
  b: U & IfEquals<T, U>
) => IfEquals<T, U>;
const summityears = ['2020', '2021', '2022', '2024'] as const;
declare let dummyYear: SummitYear;
declare let summitCandidateYear: (typeof summityears)[number];
// The check is placed inside a function to prevent being called
// at runtime when importing the file.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const checkTypeValid = () => exactType(summitCandidateYear, dummyYear);

export function isSummitYear(year: string): year is SummitYear {
  // The check here is against SummitYear, not the type of summityears.
  return summityears.includes(year as SummitYear);
}

// These types need to be indexed for ['Row'], in most cases.
// The parent element is exported to allow easier use with Updates and Inserts
export type ProfileModel = Database['public']['Tables']['profiles'];
export type PresentationPresentersModel =
  Database['public']['Tables']['presentation_presenters'];

// These types aren't used for insertion or updating, so export the Row directly
export type AllPresentationsModel =
  Database['public']['Views']['all_presentations']['Row'];
export type MySubmissionsModel =
  Database['public']['Views']['my_submissions']['Row'];

export type PresentationSubmissionsModel = {
  id: string;
  submitter_id: string;
  updated_at: string;
  title: string;
  abstract: string;
  learning_points: string | null;
  is_submitted: boolean;
  presentation_type: PresentationType;
};
