export type Profile = {
  id: string
  name: string
  is_admin: boolean
  avatar_color: string
  avatar_url: string | null
  created_at: string
}

export type Activity = {
  id: string
  title: string
  description: string
  activity_date: string | null
  activity_time: string | null
  cost_per_person: number | null
  cost_notes: string | null
  ticket_url: string | null
  display_order: number
  created_at: string
}

export type ActivitySignup = {
  id: string
  activity_id: string
  user_id: string
  plus_guests: number
  created_at: string
}

export type InfoPage = {
  slug: string
  title: string
  content: string
  updated_at: string
}

export type ActivityWithSignups = Activity & {
  activity_signups: (ActivitySignup & { profiles: Profile })[]
}

export type Car = {
  id: string
  created_by: string | null
  rental_company: string
  location: string
  pickup_date: string
  dropoff_date: string
  brand: string
  color: string
  seats: number
  photo_path: string | null
  created_at: string
}

export type CarWithCreator = Car & { profiles: Profile | null }

export type SitePhoto = {
  id: string
  section: 'house' | 'cars' | 'hero'
  storage_path: string
  caption: string | null
  display_order: number
  created_at: string
}

export type ArrivalEvent = {
  id: string
  description: string
  transportation: string
  arrival_date: string | null
  arrival_time: string | null
  departure_date: string | null
  departure_time: string | null
  created_by: string | null
  created_at: string
}

export type ArrivalEventPerson = {
  id: string
  event_id: string
  user_id: string
}

export type ArrivalEventWithPeople = ArrivalEvent & {
  arrival_event_people: (ArrivalEventPerson & { profiles: Profile | null })[]
}
