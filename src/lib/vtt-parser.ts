/**
 * VTT File Parser Utility
 * Parses VTT subtitle files and extracts transcript content
 */

export interface VTTTranscript {
  fileName: string
  videoId: string
  fullText: string
  entries: Array<{
    startTime: string
    endTime: string
    text: string
  }>
}

/**
 * Parses a single VTT file content
 * @param fileName - Name of the VTT file
 * @param content - Raw VTT file content
 * @returns Parsed transcript with metadata
 */
export function parseVTTFile(fileName: string, content: string): VTTTranscript {
  const lines = content.split('\n')
  const entries: Array<{ startTime: string; endTime: string; text: string }> = []
  let currentTime = ''
  let currentText = ''

  for (const line of lines) {
    const trimmedLine = line.trim()

    // Skip header and empty lines
    if (trimmedLine === 'WEBVTT' || trimmedLine === '' || trimmedLine.startsWith('NOTE')) {
      continue
    }

    // Check if line is a timestamp
    if (trimmedLine.includes('-->')) {
      if (currentText) {
        const [startTime, endTime] = trimmedLine.split('-->').map((t) => t.trim())
        entries.push({
          startTime,
          endTime,
          text: currentText.trim(),
        })
        currentText = ''
      }
      currentTime = trimmedLine
    } else if (trimmedLine && !trimmedLine.includes('-->')) {
      // This is subtitle text
      currentText += (currentText ? ' ' : '') + trimmedLine
    }
  }

  // Add last entry if exists
  if (currentText) {
    const [startTime, endTime] = currentTime.split('-->').map((t) => t.trim())
    entries.push({
      startTime,
      endTime,
      text: currentText.trim(),
    })
  }

  // Extract video ID from filename (e.g., "video_abc123.vtt" -> "abc123")
  const videoIdMatch = fileName.match(/video[_-]?([a-zA-Z0-9]+)\.vtt/i)
  const videoId = videoIdMatch ? videoIdMatch[1] : fileName.replace('.vtt', '')

  // Combine all text for full transcript
  const fullText = entries.map((e) => e.text).join(' ')

  return {
    fileName,
    videoId,
    fullText,
    entries,
  }
}

/**
 * Validates if a file is a valid VTT file
 * @param fileName - Name of the file
 * @param content - File content
 * @returns true if valid VTT file
 */
export function isValidVTTFile(fileName: string, content: string): boolean {
  if (!fileName.toLowerCase().endsWith('.vtt')) {
    return false
  }

  const trimmedContent = content.trim()
  if (!trimmedContent.startsWith('WEBVTT')) {
    return false
  }

  // Check if it has at least one timestamp
  return /\d{2}:\d{2}:\d{2}.*-->/m.test(trimmedContent)
}

/**
 * Extracts VTT files from a folder structure
 * Handles nested folders and filters only .vtt files
 * @param files - Array of File objects from folder upload
 * @returns Array of VTT files with their content
 */
export async function extractVTTFilesFromFolder(
  files: File[]
): Promise<Array<{ fileName: string; content: string; path: string }>> {
  const vttFiles: Array<{ fileName: string; content: string; path: string }> = []

  for (const file of files) {
    // Check if file is a VTT file
    if (file.name.toLowerCase().endsWith('.vtt')) {
      try {
        const content = await file.text()

        // Validate VTT format
        if (isValidVTTFile(file.name, content)) {
          vttFiles.push({
            fileName: file.name,
            content,
            path: file.webkitRelativePath || file.name,
          })
        } else {
          console.warn(`File ${file.name} is not a valid VTT file`)
        }
      } catch (error) {
        console.error(`Error reading file ${file.name}:`, error)
      }
    }
  }

  return vttFiles
}

/**
 * Cleans and normalizes VTT text content
 * @param text - Raw text from VTT
 * @returns Cleaned text
 */
export function cleanVTTText(text: string): string {
  return text
    .replaceAll(/\s+/g, ' ') // Replace multiple spaces with single space
    .replaceAll(/[^\w\s.,!?-]/g, '') // Remove special characters except punctuation
    .trim()
}
