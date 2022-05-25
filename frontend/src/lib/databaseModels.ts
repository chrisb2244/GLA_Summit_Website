export type ProfileModel = {
  id: string
  firstname: string
  lastname: string
  bio: string | null
  website: string | null
  avatar_url: string | null
}

export type PresentationPresentersModel = {
  presentation_id: string
  presenter_id: string
}

export type PresentationType = '7x7' | 'full length' | 'panel'

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

export type AllPresentationsModel = {
  presentation_id: string
  scheduled_for: string
  title: string
  abstract: string
  presentation_type: PresentationType
  primary_presenter: string
  all_presenters: string[]
  all_presenters_names: string[]
}

export type MySubmissionsModel = {
  presentation_id: string
  title: string
  abstract: string
  learning_points: string
  presentation_type: PresentationType
  submitter_id: string
  is_submitted: boolean
  all_presenters_ids: string[]
  all_firstnames: string[]
  all_lastnames: string[]
  all_emails: string[]
}

export type TimezonePreferencesModel = {
  id: string
  timezone_db: string
  timezone_name: string
  use_24h_clock: boolean
}
