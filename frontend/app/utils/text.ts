// Strip HTML tags and return plain text
export function stripHtml(html: string): string {
  if (!html) return ''
  
  // If it's already plain text (no HTML tags), just return it cleaned
  const hasHtmlTags = /<[^>]+>/.test(html)
  if (!hasHtmlTags) {
    return html
      .replace(/\s+/g, ' ')
      .trim()
  }
  
  const decoded = html
    .replace(/&lt;[^&]*&gt;/g, '')   // Handle encoded <...> tags
    .replace(/[\u2018\u2019]/g, "'")  // Fix curly single quotes
    .replace(/[\u201c\u201d]/g, '"')  // Fix curly double quotes
  
  return decoded
    .replace(/<[^>]*>/g, ' ')  // Strip HTML tags
    .replace(/\s+/g, ' ')               // Collapse whitespace
    .trim()
}
