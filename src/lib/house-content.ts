// House page content, hardcoded in both languages (it rarely changes and is
// not edited from the admin panel). Layout markers [mapa] / [fotos] are
// language-agnostic and consumed by parseHouseSegments.
import type { Language } from '@/lib/i18n/context'

type HouseText = { title: string; markdown: string }

export const HOUSE_CONTENT: Record<Language, HouseText> = {
  pt: {
    title: 'A Casa',
    markdown: `## 📍 Endereço

**Solara Resort**
8923 Coconut Breeze Dr
Kissimmee, FL

[Ver fotos e detalhes da casa](https://www.homedisneyvacation.com/casas/ff13289)

[mapa]

## 🗓️ Datas

| | |
|---|---|
| **Check-in** | Sexta, 9 de outubro — a partir das 16h |
| **Check-out** | Domingo, 18 de outubro — até às 10h |

## 🏠 Sobre a casa

- **7 quartos** • **7 banheiros** • acomoda até **14 pessoas**
- **Piscina privativa**
- Localizada dentro do Solara Resort, a poucos minutos dos parques da Disney

[fotos]

## ℹ️ Sobre o Solara Resort

O Solara é um resort de casas de férias em Kissimmee, pertinho dos parques da Disney. A casa fica dentro do condomínio fechado com acesso às áreas comuns do resort.`,
  },
  en: {
    title: 'The House',
    markdown: `## 📍 Address

**Solara Resort**
8923 Coconut Breeze Dr
Kissimmee, FL

[View photos and house details](https://www.homedisneyvacation.com/casas/ff13289)

[mapa]

## 🗓️ Dates

| | |
|---|---|
| **Check-in** | Friday, October 9 — from 4pm |
| **Check-out** | Sunday, October 18 — until 10am |

## 🏠 About the house

- **7 bedrooms** • **7 bathrooms** • sleeps up to **14**
- **Private pool**
- Inside Solara Resort, minutes from the Disney parks

[fotos]

## ℹ️ About Solara Resort

Solara is a vacation-home resort in Kissimmee, close to the Disney parks. The house sits inside the gated community with access to the resort's shared amenities.`,
  },
}
