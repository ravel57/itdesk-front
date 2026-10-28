import { getOrganizationName } from 'src/util/organizationHelpers'
import { getOrganizationKey } from 'src/util/organizations/organizationIdentity'

// Сборка параметров роута (?organization=...) для страницы организаций (чистые функции + безопасный replace).

// Значение организации из query: поддерживаются organization / organizationId / organizationid.
export function getOrganizationQueryValue (query) {
  return query?.organization ||
    query?.organizationId ||
    query?.organizationid
}

// Ищет организацию по значению из URL: ключ, id или название.
export function findOrganizationByRouteValue (organizations, routeValue) {
  const value = String(routeValue)
  return organizations.find(organization => {
    return getOrganizationKey(organization) === value ||
      String(organization.id || '') === value ||
      getOrganizationName(organization) === value
  })
}

export function getOrganizationRouteValue (organization) {
  return organization.id !== undefined && organization.id !== null
    ? String(organization.id)
    : getOrganizationKey(organization)
}

export function buildSelectedOrganizationQuery (query, routeValue) {
  const nextQuery = { ...query }
  delete nextQuery.organizationId
  delete nextQuery.organizationid
  nextQuery.organization = routeValue
  return nextQuery
}

export function buildClosedOrganizationQuery (query) {
  const nextQuery = { ...query }
  delete nextQuery.organization
  delete nextQuery.organizationId
  delete nextQuery.organizationid
  return nextQuery
}

// router.replace без необработанных ошибок навигации
export function replaceRouteQuery (router, path, query) {
  const navigation = router.replace({
    path,
    query
  })

  if (navigation?.catch) {
    navigation.catch(() => {})
  }
}
