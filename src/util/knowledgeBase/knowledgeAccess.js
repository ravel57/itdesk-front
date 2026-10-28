import { can } from 'src/util/access'

// Backend: создание, изменение, удаление и сортировка статей — только ADMIN/MANAGER.
export function canManageKnowledgeBase () {
  return can('KB_EDIT')
}
