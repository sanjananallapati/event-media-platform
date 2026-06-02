export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function generateUniqueSlug(text: string, suffix?: string): string {
  const base = slugify(text);
  if (suffix) {
    return `${base}-${suffix}`;
  }
  return `${base}-${Date.now()}`;
}
