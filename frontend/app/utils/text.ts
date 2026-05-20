// Strip HTML tags and return plain text
export function stripHtml(html: string): string {
  if (!html) return ''
  
  // If it's already plain text (no HTML tags), just return it cleaned
  const hasHtmlTags = /<[^>]+>/.test(html)
  if (!hasHtmlTags) {
    return html
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }
  
  const decoded = html
    .replace(/&lt;[^&]*&gt;/g, '')   // Handle encoded <...> tags
    .replace(/\u00e2\u0080\u0099/g, "'")  // Fix curly apostrophes
    .replace(/\u00e2\u0080\u00(9c|9d)/g, '"')  // Fix quotes
    .replace(/'/g, "'")
    .replace(/'/g, "'")
    .replace(/"/g, '"')
    .replace(/"/g, '"')
  
  return decoded
    .replace(/<[^>]*>/g, ' ')  // Strip HTML tags
    .replace(/\n/g, ' ')                // Newlines to spaces
    .replace(/\s+/g, ' ')               // Collapse whitespace
    .trim()
}

// Truncate text to maxLength
export function truncateText(text: string | undefined | null, maxLength: number = 10): string {
  if (!text) return 'No description'
  const plain = stripHtml(text)
  if (plain.length <= maxLength) return plain
  return plain.slice(0, maxLength).trim() + '...'
}
