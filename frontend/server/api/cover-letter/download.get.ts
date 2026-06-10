import { generateCoverLetter } from '../../utils/cover-letter'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const jobId = query.id as string
    
    if (!jobId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Job ID required'
      })
    }
    
    // Get the job
    const job = await getJobById(jobId)
    if (!job) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Job not found'
      })
    }
    
    // Get cover letter (use saved one or generate)
    let coverLetter = job.application_data?.cover_letter || ''
    if (!coverLetter) {
      coverLetter = await generateCoverLetter(job)
    }
    
    // Build Word document XML
    const docContent = buildWordDoc(coverLetter)
    
    // Set response headers for download
    setHeader(event, 'Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    setHeader(event, 'Content-Disposition', `attachment; filename="Cover_Letter_${sanitizeFilename(job.company)}_${sanitizeFilename(job.title)}.docx"`)
    
    return docContent
    
  } catch (error: any) {
    console.error('Error generating cover letter download:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to generate cover letter'
    })
  }
})

function sanitizeFilename(str: string): string {
  return str.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30)
}

function buildWordDoc(content: string): Buffer {
  const JSZip = require('jszip')
  const zip = new JSZip()
  
  // Convert plain text to proper Word XML
  const escapedContent = escapeXml(content)
  const paragraphs = escapedContent.split('\n').map(line => {
    if (line.trim() === '') {
      return '<w:p><w:pPr><w:pStyle w:val="Normal"/></w:pPr></w:p>'
    }
    return `<w:p>
      <w:pPr><w:pStyle w:val="Normal"/></w:pPr>
      <w:r>
        <w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr>
        <w:t>${line}</w:t>
      </w:r>
    </w:p>`
  }).join('')
  
  // [Content_Types].xml
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`)
  
  // _rels/.rels
  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`)
  
  // word/_rels/document.xml.rels
  zip.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`)
  
  // word/styles.xml
  zip.file('word/styles.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:rPr>
      <w:rFonts w:ascii="Calibri" w:eastAsia="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>
      <w:sz w:val="22"/>
      <w:szCs w:val="22"/>
    </w:rPr>
  </w:style>
</w:styles>`)
  
  // word/document.xml
  zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${paragraphs}
  </w:body>
</w:document>`)
  
  return zip.generate({ type: 'nodebuffer' })
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
