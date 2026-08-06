/**
 * Utility functions for handling site domain configuration and converting internal URLs
 * to normalized relative path links across the application.
 */

/**
 * Normalizes a domain string to its hostname and origin.
 */
export function normalizeDomain(siteDomain?: string): { hostname: string; origin: string } | null {
  if (!siteDomain || !siteDomain.trim()) return null;
  let domain = siteDomain.trim().toLowerCase();
  
  // Remove trailing slashes
  while (domain.endsWith('/')) {
    domain = domain.slice(0, -1);
  }

  if (!domain.startsWith('http://') && !domain.startsWith('https://')) {
    domain = 'https://' + domain;
  }

  try {
    const parsed = new URL(domain);
    return {
      hostname: parsed.hostname,
      origin: parsed.origin
    };
  } catch (e) {
    const cleanHost = siteDomain.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
    return {
      hostname: cleanHost,
      origin: `https://${cleanHost}`
    };
  }
}

/**
 * Converts internal URLs (matching the defined siteDomain or relative path structure)
 * into normalized relative paths (e.g. /article/a1).
 * Preserves external third-party links, friend links, action links, mailto/tel, and hash anchors as-is.
 */
export function formatSiteLink(url?: string, siteDomain?: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Special schemes, actions, and anchors
  if (
    trimmed.startsWith('action:') ||
    trimmed.startsWith('alert:') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:') ||
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('#')
  ) {
    return trimmed;
  }

  // Already a relative path
  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  const normalized = normalizeDomain(siteDomain);
  if (normalized) {
    try {
      const fullUrlStr = (trimmed.startsWith('http://') || trimmed.startsWith('https://'))
        ? trimmed
        : `https://${trimmed}`;
      
      const linkUrl = new URL(fullUrlStr);
      // If the link hostname matches the defined site domain
      if (linkUrl.hostname === normalized.hostname) {
        const relativePath = linkUrl.pathname + linkUrl.search + linkUrl.hash;
        return relativePath.startsWith('/') ? relativePath : '/' + relativePath;
      }
    } catch (e) {
      // Ignore URL parse error
    }
  }

  return trimmed;
}

/**
 * Helper to determine if a link is an external third-party link.
 */
export function isExternalLink(url?: string, siteDomain?: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();

  if (
    trimmed.startsWith('action:') ||
    trimmed.startsWith('alert:') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:') ||
    trimmed.startsWith('#') ||
    trimmed.startsWith('/')
  ) {
    return false;
  }

  const normalized = normalizeDomain(siteDomain);
  if (normalized) {
    try {
      const fullUrlStr = (trimmed.startsWith('http://') || trimmed.startsWith('https://'))
        ? trimmed
        : `https://${trimmed}`;
      const linkUrl = new URL(fullUrlStr);
      if (linkUrl.hostname === normalized.hostname) {
        return false;
      }
    } catch (e) {}
  }

  return trimmed.startsWith('http://') || trimmed.startsWith('https://');
}
