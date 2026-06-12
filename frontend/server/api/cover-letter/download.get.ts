import { generateCoverLetter } from '../../utils/cover-letter'
import { getJobById } from '../../utils/github'

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
    const docBuffer = buildWordDoc(coverLetter)
    
    // Set response headers for download
    setHeader(event, 'Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    setHeader(event, 'Content-Disposition', `attachment; filename="Cover_Letter_${sanitizeFilename(job.company)}_${sanitizeFilename(job.title)}.docx"`)
    
    return docBuffer
    
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
  // Build docx zip structure manually using Node.js zlib
  const { Buffer } = require('buffer')
  
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
  
  // Create file contents
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`

  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`

  const docRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`

  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:rPr>
      <w:rFonts w:ascii="Calibri" w:eastAsia="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>
      <w:sz w:val="22"/>
      <w:szCs w:val="22"/>
    </w:rPr>
  </w:style>
</w:styles>`

  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${paragraphs}
  </w:body>
</w:document>`

  // Build zip using Node.js zlib
  const files: Record<string, Buffer> = {
    '[Content_Types].xml': Buffer.from(contentTypes, 'utf-8'),
    '_rels/.rels': Buffer.from(rels, 'utf-8'),
    'word/_rels/document.xml.rels': Buffer.from(docRels, 'utf-8'),
    'word/styles.xml': Buffer.from(styles, 'utf-8'),
    'word/document.xml': Buffer.from(document, 'utf-8'),
  }
  
  return createZipBuffer(files)
}

// Minimal ZIP creation without external dependencies
function createZipBuffer(files: Record<string, Buffer>): Buffer {
  const { crc32 } = require('zlib')
  const { Buffer } = require('buffer')
  
  const localFiles: Buffer[] = []
  const centralDirectory: Buffer[] = []
  let offset = 0
  
  for (const [name, data] of Object.entries(files)) {
    const crc = crc32(data)
    const compressed = data // Store uncompressed (no compression)
    const size = data.length
    
    // Local file header
    const localHeader = Buffer.alloc(30 + name.length)
    localHeader.writeUInt32LE(0x04034b50, 0) // Local file header signature
    localHeader.writeUInt16LE(20, 4) // Version needed
    localHeader.writeUInt16LE(0, 6) // General purpose bit flag
    localHeader.writeUInt16LE(0, 8) // Compression method (0 = store)
    localHeader.writeUInt16LE(0, 10) // Modification time
    localHeader.writeUInt16LE(0, 12) // Modification date
    localHeader.writeUInt32LE(crc, 14)
    localHeader.writeUInt32LE(size, 18) // Compressed size
    localHeader.writeUInt32LE(size, 22) // Uncompressed size
    localHeader.writeUInt16LE(name.length, 26)
    localHeader.writeUInt16LE(0, 28) // Extra field length
    localHeader.write(name, 30, 'utf-8')
    
    localFiles.push(localHeader)
    localFiles.push(compressed)
    
    // Central directory entry
    const cdEntry = Buffer.alloc(46 + name.length)
    cdEntry.writeUInt32LE(0x02014b50, 0) // Central directory signature
    cdEntry.writeUInt16LE(20, 4) // Version made by
    cdEntry.writeUInt16LE(20, 6) // Version needed
    cdEntry.writeUInt16LE(0, 8) // General purpose bit flag
    cdEntry.writeUInt16LE(0, 10) // Compression method
    cdEntry.writeUInt16LE(0, 12) // Modification time
    cdEntry.writeUInt16LE(0, 14) // Modification date
    cdEntry.writeUInt32LE(crc, 16)
    cdEntry.writeUInt32LE(size, 20)
    cdEntry.writeUInt32LE(size, 24)
    cdEntry.writeUInt16LE(name.length, 28)
    cdEntry.writeUInt16LE(0, 30) // Extra field length
    cdEntry.writeUInt16LE(0, 32) // Comment length
    cdEntry.writeUInt16LE(0, 34) // Disk number start
    cdEntry.writeUInt16LE(0, 36) // Internal file attributes
    cdEntry.writeUInt32LE(0, 38) // External file attributes
    cdEntry.writeUInt32LE(offset, 42) // Relative offset
    cdEntry.write(name, 46, 'utf-8')
    
    centralDirectory.push(cdEntry)
    
    offset += localHeader.length + compressed.length
  }
  
  const cdSize = centralDirectory.reduce((sum, buf) => sum + buf.length, 0)
  const cdOffset = offset
  
  // Central directory
  const cd = Buffer.concat(centralDirectory)
  
  // End of central directory
  const eocd = Buffer.alloc(22)
  eocd.writeUInt32LE(0x06054b50, 0) // End of central directory signature
  eocd.writeUInt16LE(0, 4) // Disk number
  eocd.writeUInt16LE(0, 6) // Disk with central directory
  eocd.writeUInt16LE(Object.keys(files).length, 8) // Number of entries on disk
  eocd.writeUInt16LE(Object.keys(files).length, 10) // Total entries
  eocd.writeUInt32LE(cdSize, 12) // Central directory size
  eocd.writeUInt32LE(cdOffset, 16) // Central directory offset
  eocd.writeUInt16LE(0, 20) // Comment length
  
  return Buffer.concat([...localFiles, cd, eocd])
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
