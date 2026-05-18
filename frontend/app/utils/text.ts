// Strip HTML tags and return plain text
export function stripHtml(html: string): string {
  if (!html) return ''
  return html
    .replace(/<[^>]*>/g, ' ')  // Replace tags with space
    .replace(/&nbsp;/g, ' ')   // Replace &nbsp; with space
    .replace(/&amp;/g, '&')   // Replace &amp; with &
    .replace(/&lt;/g, '<')    // Replace &lt; with <
    .replace(/&gt;/g, '>')    // Replace &gt; with >
    .replace(/&quot;/g, '"')   // Replace &quot; with "
    .replace(/&#39;/g, "'")   // Replace &#39; with '
    .replace(/\s+/g, ' ')     // Collapse multiple spaces
    .trim()
}

// Extract first N characters of plain text (for preview)
export function truncateText(text: string, maxLength: number = 150): string {
  if (!text) return ''
  const plain = stripHtml(text)
  if (plain.length <= maxLength) return plain
  return plain.slice(0, maxLength).trim() + '...'
}
