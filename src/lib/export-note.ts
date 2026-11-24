import { invoke } from "@tauri-apps/api/core"
import { save } from "@tauri-apps/plugin-dialog"
import { jsPDF } from "jspdf"
import { autoTable } from "jspdf-autotable"
import { getProfile } from "#lib/profile"
import { getPdfFooterTemplate, DEFAULT_PDF_FOOTER_TEMPLATE } from "#lib/export-settings"

import interRegularUrl from "@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf?url"
import interBoldUrl from "@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf?url"
import interItalicUrl from "@expo-google-fonts/inter/400Regular_Italic/Inter_400Regular_Italic.ttf?url"
import interBoldItalicUrl from "@expo-google-fonts/inter/700Bold_Italic/Inter_700Bold_Italic.ttf?url"
import jbMonoRegularUrl from "@expo-google-fonts/jetbrains-mono/400Regular/JetBrainsMono_400Regular.ttf?url"
import jbMonoBoldUrl from "@expo-google-fonts/jetbrains-mono/700Bold/JetBrainsMono_700Bold.ttf?url"
import jbMonoItalicUrl from "@expo-google-fonts/jetbrains-mono/400Regular_Italic/JetBrainsMono_400Regular_Italic.ttf?url"
import jbMonoBoldItalicUrl from "@expo-google-fonts/jetbrains-mono/700Bold_Italic/JetBrainsMono_700Bold_Italic.ttf?url"

// --- PDF fonts ---------------------------------------------------------
//
// jsPDF's built-in fonts only support WinAnsi encoding, so real text (real
// arrows, box-drawing, non-Latin scripts) has to be substituted or dropped
// (see PDF_UNICODE_FALLBACKS below). Embedding Inter + JetBrains Mono gives
// a nicer look and covers Latin/Cyrillic/Greek without substitution.

const PDF_FONT_FAMILY_SANS = "inter"
const PDF_FONT_FAMILY_MONO = "jetbrainsmono"

interface PdfFontFile {
  url: string
  vfsName: string
  family: string
  style: "normal" | "bold" | "italic" | "bolditalic"
}

const PDF_FONT_FILES: PdfFontFile[] = [
  { url: interRegularUrl, vfsName: "Inter-Regular.ttf", family: PDF_FONT_FAMILY_SANS, style: "normal" },
  { url: interBoldUrl, vfsName: "Inter-Bold.ttf", family: PDF_FONT_FAMILY_SANS, style: "bold" },
  { url: interItalicUrl, vfsName: "Inter-Italic.ttf", family: PDF_FONT_FAMILY_SANS, style: "italic" },
  { url: interBoldItalicUrl, vfsName: "Inter-BoldItalic.ttf", family: PDF_FONT_FAMILY_SANS, style: "bolditalic" },
  { url: jbMonoRegularUrl, vfsName: "JetBrainsMono-Regular.ttf", family: PDF_FONT_FAMILY_MONO, style: "normal" },
  { url: jbMonoBoldUrl, vfsName: "JetBrainsMono-Bold.ttf", family: PDF_FONT_FAMILY_MONO, style: "bold" },
  { url: jbMonoItalicUrl, vfsName: "JetBrainsMono-Italic.ttf", family: PDF_FONT_FAMILY_MONO, style: "italic" },
  { url: jbMonoBoldItalicUrl, vfsName: "JetBrainsMono-BoldItalic.ttf", family: PDF_FONT_FAMILY_MONO, style: "bolditalic" },
]

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  const chunkSize = 0x8000
  let binary = ""
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

let pdfFontDataPromise: Promise<Record<string, string>> | null = null

function loadPdfFontData(): Promise<Record<string, string>> {
  if (!pdfFontDataPromise) {
    pdfFontDataPromise = Promise.all(
      PDF_FONT_FILES.map(async f => {
        const res = await fetch(f.url)
        const buf = await res.arrayBuffer()
        return [f.vfsName, arrayBufferToBase64(buf)] as const
      })
    ).then(entries => Object.fromEntries(entries))
  }
  return pdfFontDataPromise
}

function registerPdfFonts(pdf: jsPDF, fontData: Record<string, string>): void {
  for (const f of PDF_FONT_FILES) {
    pdf.addFileToVFS(f.vfsName, fontData[f.vfsName])
    pdf.addFont(f.vfsName, f.family, f.style)
  }
}

function sanitizeFilename(title: string): string {
  const trimmed = title.trim().replace(/[/\\?%*:|"<>]/g, "-")
  return trimmed || "Untitled"
}

async function writeFile(dest: string, contents: Uint8Array): Promise<void> {
  await invoke("write_file", { dest, contents: Array.from(contents) })
}

function stripInlineMarkdown(text: string): string {
  return text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")   // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")    // links
    .replace(/(\*{3}|_{3})(.+?)\1/g, "$2")      // bold+italic
    .replace(/(\*{2}|_{2})(.+?)\1/g, "$2")      // bold
    .replace(/~~(.+?)~~/g, "$1")                // strikethrough
    .replace(/`([^`]+)`/g, "$1")                // inline code
    .replace(/(\*|_)(.+?)\1/g, "$2")             // italic
}

// Strips markdown syntax down to plain text, but leaves list markers
// (-, *, +, 1.) alone since bullets/numbering read fine as plain text.
function markdownToPlainText(markdown: string): string {
  const lines = markdown.split("\n")
  const output: string[] = []
  let inCodeFence = false

  for (const rawLine of lines) {
    if (/^\s*```/.test(rawLine)) { inCodeFence = !inCodeFence; continue }
    if (inCodeFence) { output.push(rawLine); continue }

    if (/^\s*([-*_])\1{2,}\s*$/.test(rawLine)) continue // horizontal rule

    let line = rawLine.replace(/^(\s*>\s?)+/, "")        // blockquote markers
    line = line.replace(/^(\s*)#{1,6}\s+/, "$1")         // heading markers

    const listMatch = line.match(/^(\s*(?:[-*+]|\d+[.)])\s+)(.*)$/)
    const prefix = listMatch ? listMatch[1] : ""
    const rest   = listMatch ? listMatch[2] : line

    output.push(prefix + stripInlineMarkdown(rest))
  }

  return output.join("\n")
}

export async function exportNoteAsTxt(title: string, content: string): Promise<boolean> {
  const dest = await save({
    defaultPath: `${sanitizeFilename(title)}.txt`,
    filters: [{ name: "Text", extensions: ["txt"] }],
  })
  if (!dest) return false

  await writeFile(dest, new TextEncoder().encode(markdownToPlainText(content)))
  return true
}

export async function exportNoteAsMarkdown(title: string, content: string): Promise<boolean> {
  const dest = await save({
    defaultPath: `${sanitizeFilename(title)}.md`,
    filters: [{ name: "Markdown", extensions: ["md"] }],
  })
  if (!dest) return false

  await writeFile(dest, new TextEncoder().encode(content))
  return true
}

// --- Markdown -> vector PDF -------------------------------------------------
//
// Renders markdown as real PDF text (not a rasterized screenshot), so the
// output is small, has a sane fixed font size regardless of the editor's
// on-screen zoom, and the text stays selectable/searchable.

type Block =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "listitem"; ordered: boolean; marker: string; depth: number; text: string }
  | { type: "blockquote"; text: string }
  | { type: "code"; lines: string[] }
  | { type: "hr" }
  | { type: "table"; header: string[]; rows: string[][] }

function splitTableRow(line: string): string[] {
  let trimmed = line.trim()
  if (trimmed.startsWith("|")) trimmed = trimmed.slice(1)
  if (trimmed.endsWith("|")) trimmed = trimmed.slice(0, -1)
  return trimmed.split("|").map(c => c.trim())
}

function isTableSeparatorRow(line: string): boolean {
  if (!line.includes("|") && !line.includes("-")) return false
  const cells = splitTableRow(line)
  return cells.length > 0 && cells.every(c => /^:?-{3,}:?$/.test(c))
}

function parseMarkdownBlocks(markdown: string): Block[] {
  const lines = markdown.split("\n")
  const blocks: Block[] = []
  let paragraphBuf: string[] = []
  let i = 0

  function flushParagraph() {
    if (paragraphBuf.length) {
      blocks.push({ type: "paragraph", text: paragraphBuf.join(" ") })
      paragraphBuf = []
    }
  }

  while (i < lines.length) {
    const line = lines[i]

    if (/^\s*```/.test(line)) {
      flushParagraph()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !/^\s*```/.test(lines[i])) {
        codeLines.push(lines[i])
        i++
      }
      i++ // skip closing fence
      blocks.push({ type: "code", lines: codeLines })
      continue
    }

    if (/^\s*$/.test(line)) {
      flushParagraph()
      i++
      continue
    }

    if (/^\s*([-*_])\1{2,}\s*$/.test(line)) {
      flushParagraph()
      blocks.push({ type: "hr" })
      i++
      continue
    }

    const headingMatch = line.match(/^\s*(#{1,6})\s+(.*)$/)
    if (headingMatch) {
      flushParagraph()
      blocks.push({ type: "heading", level: headingMatch[1].length, text: headingMatch[2].trim() })
      i++
      continue
    }

    if (line.includes("|") && i + 1 < lines.length && isTableSeparatorRow(lines[i + 1])) {
      flushParagraph()
      const header = splitTableRow(line)
      i += 2
      const rows: string[][] = []
      while (i < lines.length && lines[i].trim() !== "" && lines[i].includes("|")) {
        rows.push(splitTableRow(lines[i]))
        i++
      }
      blocks.push({ type: "table", header, rows })
      continue
    }

    const quoteMatch = line.match(/^\s*>\s?(.*)$/)
    if (quoteMatch) {
      flushParagraph()
      blocks.push({ type: "blockquote", text: quoteMatch[1] })
      i++
      continue
    }

    const listMatch = line.match(/^(\s*)([-*+]|\d+[.)])\s+(.*)$/)
    if (listMatch) {
      flushParagraph()
      const indent  = listMatch[1].length
      const marker  = listMatch[2]
      const ordered = /\d/.test(marker)
      blocks.push({ type: "listitem", ordered, marker, depth: Math.floor(indent / 2), text: listMatch[3] })
      i++
      continue
    }

    paragraphBuf.push(line.trim())
    i++
  }

  flushParagraph()
  return blocks
}

interface Run {
  text: string
  bold: boolean
  italic: boolean
  code: boolean
}

const INLINE_PATTERN = /(\*\*\*.+?\*\*\*|___.+?___|\*\*.+?\*\*|__.+?__|~~.+?~~|`[^`]+?`|\*[^*]+?\*|_[^_]+?_)/g

function tokenizeInline(raw: string): Run[] {
  const text = raw
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")

  const parts = text.split(INLINE_PATTERN).filter(p => p.length > 0)
  const runs: Run[] = []

  for (const part of parts) {
    if (/^(\*\*\*.+\*\*\*|___.+___)$/.test(part)) {
      runs.push({ text: part.slice(3, -3), bold: true, italic: true, code: false })
    } else if (/^(\*\*.+\*\*|__.+__)$/.test(part)) {
      runs.push({ text: part.slice(2, -2), bold: true, italic: false, code: false })
    } else if (/^~~.+~~$/.test(part)) {
      runs.push({ text: part.slice(2, -2), bold: false, italic: false, code: false })
    } else if (/^`[^`]+`$/.test(part)) {
      runs.push({ text: part.slice(1, -1), bold: false, italic: false, code: true })
    } else if (/^(\*[^*]+\*|_[^_]+_)$/.test(part)) {
      runs.push({ text: part.slice(1, -1), bold: false, italic: true, code: false })
    } else {
      runs.push({ text: part, bold: false, italic: false, code: false })
    }
  }

  return runs
}

interface Word {
  text: string
  bold: boolean
  italic: boolean
  code: boolean
  isSpace: boolean
}

function runsToWords(runs: Run[]): Word[] {
  const words: Word[] = []
  for (const run of runs) {
    for (const piece of run.text.split(/(\s+)/)) {
      if (piece === "") continue
      const isSpace = /^\s+$/.test(piece)
      words.push({ text: isSpace ? " " : piece, bold: run.bold, italic: run.italic, code: run.code, isSpace })
    }
  }
  return words
}

function setFontForWord(pdf: jsPDF, word: Word, baseFontSize: number): void {
  const family = word.code ? PDF_FONT_FAMILY_MONO : PDF_FONT_FAMILY_SANS
  const style  = word.bold && word.italic ? "bolditalic" : word.bold ? "bold" : word.italic ? "italic" : "normal"
  pdf.setFont(family, style)
  pdf.setFontSize(word.code ? baseFontSize - 1 : baseFontSize)
}

function wrapWords(pdf: jsPDF, words: Word[], maxWidth: number, baseFontSize: number): Word[][] {
  const lines: Word[][] = []
  let current: Word[] = []
  let currentWidth = 0

  function widthOf(word: Word): number {
    setFontForWord(pdf, word, baseFontSize)
    return pdf.getTextWidth(word.text)
  }

  function pushLine() {
    while (current.length && current[current.length - 1].isSpace) current.pop()
    if (current.length) lines.push(current)
    current = []
    currentWidth = 0
  }

  for (const word of words) {
    if (word.isSpace && current.length === 0) continue
    const w = widthOf(word)
    if (currentWidth + w > maxWidth && current.length > 0) pushLine()
    current.push(word)
    currentWidth += w
  }
  pushLine()

  return lines
}

interface RenderCtx {
  pageHeight: number
  marginTop: number
  marginBottom: number
  marginRight: number
}

function ensureSpace(pdf: jsPDF, y: number, needed: number, ctx: RenderCtx): number {
  if (y + needed > ctx.pageHeight - ctx.marginBottom) {
    pdf.addPage()
    return ctx.marginTop
  }
  return y
}

function renderLines(pdf: jsPDF, lines: Word[][], x0: number, y: number, lineHeight: number, baseFontSize: number, ctx: RenderCtx): number {
  for (const line of lines) {
    y = ensureSpace(pdf, y, lineHeight, ctx)
    let x = x0
    for (const word of line) {
      setFontForWord(pdf, word, baseFontSize)
      pdf.text(word.text, x, y)
      x += pdf.getTextWidth(word.text)
    }
    y += lineHeight
  }
  return y
}

const HEADING_SIZES: Record<number, number> = { 1: 17, 2: 15, 3: 13, 4: 11.5, 5: 10.5, 6: 10 }

function renderMarkdownBody(pdf: jsPDF, markdown: string, y: number, ctx: RenderCtx, marginLeft: number, contentWidth: number): number {
  const blocks = parseMarkdownBlocks(markdown)
  for (let blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
    const block = blocks[blockIndex]
    switch (block.type) {
      case "heading": {
        const fontSize   = HEADING_SIZES[block.level] ?? 11
        const lineHeight = fontSize * 1.3
        const words      = runsToWords(tokenizeInline(block.text)).map(w => ({ ...w, bold: true }))
        const lines      = wrapWords(pdf, words, contentWidth, fontSize)
        y += lineHeight * 1.1
        y = renderLines(pdf, lines, marginLeft, y, lineHeight, fontSize, ctx)
        y += lineHeight * 0.3
        break
      }
      case "paragraph": {
        const fontSize   = 9.5
        const lineHeight = fontSize * 1.4
        const words      = runsToWords(tokenizeInline(block.text))
        const lines      = wrapWords(pdf, words, contentWidth, fontSize)
        y = renderLines(pdf, lines, marginLeft, y, lineHeight, fontSize, ctx)
        y += lineHeight * 0.75
        break
      }
      case "listitem": {
        const fontSize   = 9.5
        const lineHeight = fontSize * 1.4
        const indent     = 16 + block.depth * 16
        const markerText = block.ordered ? `${block.marker} ` : "•  "
        y = ensureSpace(pdf, y, lineHeight, ctx)
        pdf.setFont(PDF_FONT_FAMILY_SANS, "normal")
        pdf.setFontSize(fontSize)
        pdf.text(markerText, marginLeft + block.depth * 16, y)
        const words = runsToWords(tokenizeInline(block.text))
        const lines = wrapWords(pdf, words, contentWidth - indent, fontSize)
        y = renderLines(pdf, lines, marginLeft + indent, y, lineHeight, fontSize, ctx)
        const nextBlock = blocks[blockIndex + 1]
        const listEnding = !nextBlock || nextBlock.type !== "listitem"
        y += lineHeight * (listEnding ? 0.75 : 0.2)
        break
      }
      case "blockquote": {
        const fontSize   = 9.5
        const lineHeight = fontSize * 1.4
        const indent     = 16
        const words      = runsToWords(tokenizeInline(block.text)).map(w => ({ ...w, italic: true }))
        const lines      = wrapWords(pdf, words, contentWidth - indent, fontSize)
        pdf.setTextColor(100)
        y = renderLines(pdf, lines, marginLeft + indent, y, lineHeight, fontSize, ctx)
        pdf.setTextColor(0)
        y += lineHeight * 0.5
        break
      }
      case "code": {
        const fontSize   = 8.5
        const lineHeight = fontSize * 1.4
        pdf.setFont(PDF_FONT_FAMILY_MONO, "normal")
        pdf.setFontSize(fontSize)
        for (const rawLine of block.lines) {
          const wrapped = pdf.splitTextToSize(rawLine || " ", contentWidth) as string[]
          for (const wline of wrapped) {
            y = ensureSpace(pdf, y, lineHeight, ctx)
            pdf.text(wline, marginLeft, y)
            y += lineHeight
          }
        }
        y += lineHeight * 0.5
        break
      }
      case "table": {
        y = ensureSpace(pdf, y, 40, ctx)
        autoTable(pdf, {
          startY: y,
          margin: { left: marginLeft, right: ctx.marginRight },
          head: [block.header.map(stripInlineMarkdown)],
          body: block.rows.map(row => row.map(stripInlineMarkdown)),
          styles: { font: PDF_FONT_FAMILY_SANS, fontSize: 9, cellPadding: 4, overflow: "linebreak" },
          headStyles: { font: PDF_FONT_FAMILY_SANS, fillColor: [235, 235, 235], textColor: 20, fontStyle: "bold" },
          theme: "grid",
        })
        y = (pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 16
        break
      }
      case "hr": {
        y = ensureSpace(pdf, y, 20, ctx)
        y += 8
        pdf.setDrawColor(200)
        pdf.line(marginLeft, y, marginLeft + contentWidth, y)
        y += 14
        break
      }
    }
  }
  return y
}

// jsPDF's built-in fonts (Helvetica/Courier) only support WinAnsi encoding —
// characters outside it (box-drawing tree glyphs, smart quotes, arrows, etc.)
// render as nothing rather than erroring. Map common ones to ASCII lookalikes
// and fall back anything else unmapped to "?" so it's visible instead of gone.
const PDF_UNICODE_FALLBACKS: Record<string, string> = {
  "─": "-", "━": "-", "│": "|", "┃": "|",
  "┌": "+", "┐": "+", "└": "+", "┘": "+",
  "├": "+", "┤": "+", "┬": "+", "┴": "+", "┼": "+",
  "═": "=", "║": "|", "╔": "+", "╗": "+", "╚": "+", "╝": "+",
  "╠": "+", "╣": "+", "╦": "+", "╩": "+", "╬": "+",
  "‘": "'", "’": "'", "“": "\"", "”": "\"",
  "–": "-", "—": "--", "…": "...",
  "→": "->", "←": "<-", "↔": "<->", "⇒": "=>",
  "↑": "^", "↓": "v", "↕": "^v", "⇑": "^", "⇓": "v",
  "•": "-", "×": "x", "✓": "v", "✗": "x", "✔": "v", "✘": "x",
  "™": "(TM)", "®": "(R)", "©": "(C)",
}

function toPdfSafeText(text: string): string {
  let out = ""
  for (const ch of text) {
    if ((ch.codePointAt(0) ?? 0) <= 0xff) { out += ch; continue }
    out += PDF_UNICODE_FALLBACKS[ch] ?? "?"
  }
  return out
}

function renderFooterTemplate(template: string, authorName: string | null, dateOverride: string | null): string {
  // dateOverride comes from a <DatePicker> value (YYYY-MM-DD); parse it as local,
  // not UTC midnight, so it doesn't shift a day depending on the user's timezone.
  const dateText = dateOverride
    ? new Date(`${dateOverride}T00:00:00`).toLocaleDateString(undefined, {
        year: "numeric", month: "short", day: "numeric",
      })
    : new Date().toLocaleString(undefined, {
        year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
      })
  return template
    .replace(/\{date\}/g, dateText)
    .replace(/\{author\}/g, authorName ?? "")
}

function drawFooter(pdf: jsPDF, text: string, pageWidth: number, pageHeight: number): void {
  const pageCount = pdf.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i)
    pdf.setFont(PDF_FONT_FAMILY_SANS, "normal")
    pdf.setFontSize(8)
    pdf.setTextColor(150)
    pdf.text(text, pageWidth / 2, pageHeight - 28, { align: "center" })
    pdf.setTextColor(0)
  }
}

export interface PdfExportOptions {
  footerTemplate?: string
  dateOverride?: string
}

export async function exportNoteAsPdf(rawTitle: string, rawContent: string, options?: PdfExportOptions): Promise<boolean> {
  const title   = toPdfSafeText(rawTitle)
  const content = toPdfSafeText(rawContent)

  const dest = await save({
    defaultPath: `${sanitizeFilename(title)}.pdf`,
    filters: [{ name: "PDF", extensions: ["pdf"] }],
  })
  if (!dest) return false

  const fontData = await loadPdfFontData()
  const pdf = new jsPDF({ unit: "pt", format: "a4" })
  registerPdfFonts(pdf, fontData)

  const marginLeft   = 50
  const marginRight  = 50
  const marginTop    = 56
  const marginBottom = 56
  const pageWidth    = pdf.internal.pageSize.getWidth()
  const pageHeight   = pdf.internal.pageSize.getHeight()
  const contentWidth = pageWidth - marginLeft - marginRight

  const ctx: RenderCtx = { pageHeight, marginTop, marginBottom, marginRight }
  let y = marginTop

  const trimmedTitle = title.trim()
  if (trimmedTitle) {
    const titleFontSize   = 18
    const titleLineHeight = titleFontSize * 1.3
    const words = runsToWords(tokenizeInline(trimmedTitle)).map(w => ({ ...w, bold: true }))
    const lines = wrapWords(pdf, words, contentWidth, titleFontSize)
    y = renderLines(pdf, lines, marginLeft, y, titleLineHeight, titleFontSize, ctx)
    y += titleLineHeight * 0.5
  }

  renderMarkdownBody(pdf, content, y, ctx, marginLeft, contentWidth)

  const [profile, storedFooterTemplate] = await Promise.all([
    getProfile().catch(() => null),
    options?.footerTemplate === undefined
      ? getPdfFooterTemplate().catch(() => DEFAULT_PDF_FOOTER_TEMPLATE)
      : Promise.resolve(options.footerTemplate),
  ])
  const footerTemplate = toPdfSafeText(storedFooterTemplate)
  if (footerTemplate.trim()) {
    const authorName = profile?.name ? toPdfSafeText(profile.name) : null
    drawFooter(pdf, renderFooterTemplate(footerTemplate, authorName, options?.dateOverride ?? null), pageWidth, pageHeight)
  }

  const contents = pdf.output("arraybuffer")
  await writeFile(dest, new Uint8Array(contents))
  return true
}
