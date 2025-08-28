import { filter, map } from "lodash-es"

export const TWITTER_MAX_CHAR = 280
export const LONG_FORM_MAX_CHAR = 3000

export function camelCaseToWords(s: string) {
  const result = s.replace(/([A-Z])/g, " $1")
  return result.charAt(0).toUpperCase() + result.slice(1)
}

export const splitTextIntoThreadSections = (text: string, maxChars = TWITTER_MAX_CHAR) => {
  // Initial split on double line breaks to get major sections
  const sections = text.split("\n\n")

  // Function to further split a section if it's too long
  const splitLongSection = (section: string): string[] => {
    const subSections: string[] = []
    if (section.length <= maxChars) {
      subSections.push(section)
    } else {
      // Split by sentence or comma as a fallback, then refine
      const sentences = section.match(/[^\.!\?]+[\.!\?]+/g) || [section] // Regex to split by sentence
      let currentSection = ""
      sentences.forEach((sentence) => {
        if (currentSection.length + sentence.length <= maxChars) {
          currentSection += `${sentence.trim()} `
        } else {
          subSections.push(currentSection.trim())
          currentSection = `${sentence.trim()} ` // Start a new section
        }
      })
      if (currentSection.trim().length) {
        subSections.push(currentSection.trim()) // Add the last section
      }
    }
    return subSections
  }

  // Apply further splitting and refinement
  const refinedSections: string[] = []
  sections.forEach((section) => {
    refinedSections.push(...splitLongSection(section))
  })

  function refineSectionsForLines(sections: string[], idealChars = TWITTER_MAX_CHAR): string[] {
    const refinedSections: string[] = []
    let bufferSection = ""

    sections.forEach((section, index) => {
      // If the current buffer plus the next section is too long, push the buffer as a new section
      if (bufferSection.length + section.length > idealChars) {
        refinedSections.push(bufferSection)
        bufferSection = section // Start a new buffer with the current section
      } else {
        // Add the current section to the buffer
        bufferSection += (bufferSection ? "\n\n" : "") + section
      }

      // If it's the last section, make sure to add the buffer to the refined sections
      if (index === sections.length - 1 && bufferSection.length) {
        refinedSections.push(bufferSection)
      }
    })

    return refinedSections
  }

  const finalSections = filter(refineSectionsForLines(refinedSections, TWITTER_MAX_CHAR), (c) => !!c) // You can adjust the idealChars based on your needs

  return map(finalSections, (sectionText: string) => {
    return {
      content: sectionText,
    }
  })
}

export const getWordCount = (text?: string): number => {
  if (!text || text.trim() === "") return 0

  // For CJK (Chinese, Japanese, Korean) characters
  const cjkMatch = text.match(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/g)
  const cjkCount = cjkMatch ? cjkMatch.length : 0

  // For Latin and other space-separated scripts
  const latinCount = text.trim().split(/\s+/).length

  // If we have CJK characters, use their count, otherwise use the Latin word count
  return cjkCount > 0 ? cjkCount : latinCount
}
