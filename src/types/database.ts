export type Profile = {
  id: string
  name: string
  is_admin: boolean
  avatar_color: string
  created_at: string
}

export type Arrival = {
  id: string
  user_id: string
  arrival_date: string | null
  departure_date: string | null
  notes: string | null
  updated_at: string
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

export type ProfileWithArrival = Profile & {
  arrivals: Arrival[]
}
