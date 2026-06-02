const STORAGE_KEY = 'invora_partner_campaign';

export function getStoredPartnerCampaignCode(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(STORAGE_KEY);
}

export function setStoredPartnerCampaignCode(code: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(STORAGE_KEY, code);
}

export function clearStoredPartnerCampaignCode(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(STORAGE_KEY);
}

export function parseRefFromSearchParams(params: URLSearchParams): string | null {
  return params.get('ref') ?? params.get('utm_campaign');
}

export function appendPartnerRefToUrl(url: string, partnerCode: string): string {
  const u = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'https://invora.app');
  u.searchParams.set('ref', partnerCode);
  u.searchParams.set('utm_source', 'partner');
  u.searchParams.set('utm_medium', 'share');
  return u.pathname + u.search;
}

export function visitorKey(): string {
  if (typeof window === 'undefined') return 'server';
  let key = localStorage.getItem('invora_visitor_key');
  if (!key) {
    key = crypto.randomUUID();
    localStorage.setItem('invora_visitor_key', key);
  }
  return key;
}
