import { InfoPage } from '@/components/InfoPage'
import { CarsSection } from '@/components/CarsSection'

export default function CarsPage() {
  return (
    <InfoPage slug="cars" fallbackTitle="Carros">
      <CarsSection />
    </InfoPage>
  )
}
