import { pinyin } from 'pinyin-pro';

/**
 * Converts date string like "2026-03-05" or "2天前" or Date object into YYYYMMDD format (e.g. "20260305")
 */
export function normalizeDateToYYYYMMDD(dateStr?: string): string {
  const baseDate = new Date();
  
  if (!dateStr) {
    const y = baseDate.getFullYear();
    const m = String(baseDate.getMonth() + 1).padStart(2, '0');
    const d = String(baseDate.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
  }

  // Handle "X天前" / "X小时前" / "昨天" / "今天"
  if (dateStr.includes('天前')) {
    const days = parseInt(dateStr, 10) || 1;
    const d = new Date(baseDate.getTime() - days * 24 * 60 * 60 * 1000);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}${m}${day}`;
  }

  if (dateStr.includes('小时前') || dateStr.includes('分钟前') || dateStr === '今天') {
    const y = baseDate.getFullYear();
    const m = String(baseDate.getMonth() + 1).padStart(2, '0');
    const d = String(baseDate.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
  }

  if (dateStr === '昨天') {
    const d = new Date(baseDate.getTime() - 24 * 60 * 60 * 1000);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}${m}${day}`;
  }

  // Match YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
  const match = dateStr.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (match) {
    const y = match[1];
    const m = match[2].padStart(2, '0');
    const d = match[3].padStart(2, '0');
    return `${y}${m}${d}`;
  }

  // If already contains 8 digits
  const match8 = dateStr.match(/\d{8}/);
  if (match8) {
    return match8[0];
  }

  const y = baseDate.getFullYear();
  const m = String(baseDate.getMonth() + 1).padStart(2, '0');
  const d = String(baseDate.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

/**
 * Generates slug according to title's first 3 characters in pinyin + YYYYMMDD date.
 * Example:
 *  Title: "报错回顾：给OpenClaw添加错误..." -> First 3 chars: "报错回" -> pinyin: "baocuohui"
 *  Date: "2026-03-05" -> "20260305"
 *  Output: "baocuohui20260305"
 */
export function generatePinyinSlug(title: string, dateStr?: string): string {
  if (!title) {
    return `wenzhang${normalizeDateToYYYYMMDD(dateStr)}`;
  }

  // Strip leading symbols and non-word characters
  const cleanTitle = title.trim().replace(/^[^a-zA-Z0-9\u4e00-\u9fa5]+/, '');

  // Extract up to 3 valid characters (Chinese chars, Latin letters, or digits)
  const charArray: string[] = [];
  let i = 0;
  while (i < cleanTitle.length && charArray.length < 3) {
    const ch = cleanTitle[i];
    // Skip whitespace and basic symbols
    if (/[\s\t\n\r\p{P}\p{S}]/u.test(ch)) {
      i++;
      continue;
    }
    charArray.push(ch);
    i++;
  }

  const first3Str = charArray.join('');
  let py = '';
  if (first3Str) {
    try {
      py = pinyin(first3Str, { toneType: 'none', type: 'array', v: true })
        .map(s => s.toLowerCase().replace(/[^a-z0-9]/g, ''))
        .join('');
    } catch {
      py = first3Str.toLowerCase().replace(/[^a-z0-9]/g, '');
    }
  }

  if (!py) {
    py = 'wenzhang';
  }

  const dateCode = normalizeDateToYYYYMMDD(dateStr);
  return `${py}${dateCode}`;
}

/**
 * Get article relative path, absolute path, and slug
 */
export function getArticlePaths(article: { slug?: string; title: string; date?: string }, customDomain?: string) {
  const slug = article.slug || generatePinyinSlug(article.title, article.date);
  const relativePath = `/article/${slug}`;

  const domain = customDomain || 'https://blog.sanfun.com';
  const siteUrl = `${domain.replace(/\/$/, '')}${relativePath}`;

  return {
    slug,
    relativePath,
    siteUrl,
    absolutePath: siteUrl
  };
}
