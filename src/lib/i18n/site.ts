import enMessages from '@/locales/en.json'

const siteMessages = enMessages.site

export function getDefaultSiteName(): string {
  return siteMessages.name
}

export function getDefaultSiteDescription(): string {
  return siteMessages.description
}

export function getDefaultSiteKeywords(): string {
  return siteMessages.keywords
}
