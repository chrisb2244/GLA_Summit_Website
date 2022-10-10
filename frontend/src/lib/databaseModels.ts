import { Database } from './sb_databaseModels'

export type PresentationType = Database['public']['Enums']['presentation_type']

// These types need to be indexed for ['Row'], in most cases.
// The parent element is exported to allow easier use with Updates and Inserts
export type ProfileModel = Database['public']['Tables']['profiles']
export type PresentationPresentersModel = Database['public']['Tables']['presentation_presenters']


// These types aren't used for insertion or updating, so export the Row directly
export type AllPresentationsModel = Database['public']['Views']['all_presentations']['Row']
export type MySubmissionsModel = Database['public']['Views']['my_submissions']['Row']

export type PresentationSubmissionsModel = {
  id: string
  submitter_id: string
  updated_at: string
  title: string
  abstract: string
  learning_points: string | null
  is_submitted: boolean
  presentation_type: PresentationType
}
