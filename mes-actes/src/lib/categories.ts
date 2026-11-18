import { CATEGORY_LABELS } from '@/data/establishment'
import type { ActItem, CategoryId } from '@/types'

export const CATEGORY_ORDER: CategoryId[] = [
  'scolarite',
  'resultats',
  'diplomes',
  'soutenance',
  'stages',
  'formation',
  'reclamations',
  'memoires',
  'autres',
]

export interface ActCategory {
  id: CategoryId
  label: string
  count: number
}

export function actCategories(acts: ActItem[]): ActCategory[] {
  return CATEGORY_ORDER.map((id) => ({
    id,
    label: CATEGORY_LABELS[id],
    count: acts.filter((act) => act.category === id).length,
  })).filter((category) => category.count > 0)
}
