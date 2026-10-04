type Sortable = { activity_date: string | null; activity_time: string | null; display_order: number }

// Chronological: date, then time (untimed first that day), undated last;
// display_order breaks ties. Dates/times are ISO strings, so they compare as text.
export function sortActivitiesByDate<T extends Sortable>(activities: T[]): T[] {
  return [...activities].sort((x, y) => {
    if (x.activity_date !== y.activity_date) {
      if (!x.activity_date) return 1
      if (!y.activity_date) return -1
      return x.activity_date < y.activity_date ? -1 : 1
    }
    const xt = x.activity_time ?? '', yt = y.activity_time ?? ''
    if (xt !== yt) return xt < yt ? -1 : 1
    return x.display_order - y.display_order
  })
}
