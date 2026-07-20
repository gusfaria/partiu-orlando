export type CarFormValue = {
  rental_company: string
  location: string
  pickup_date: string
  dropoff_date: string
  brand: string
  color: string
  seats: string
}

export function isCarFormValid(v: CarFormValue): boolean {
  return v.rental_company.trim() !== '' &&
    v.location.trim() !== '' &&
    v.pickup_date !== '' &&
    v.dropoff_date !== '' &&
    v.brand.trim() !== '' &&
    v.color.trim() !== '' &&
    Number.isFinite(Number(v.seats)) && Number(v.seats) > 0
}
