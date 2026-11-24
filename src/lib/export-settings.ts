import { getSetting, setSetting } from "#lib/profile"

const FOOTER_TEMPLATE_KEY = "pdf_footer_template"

export const DEFAULT_PDF_FOOTER_TEMPLATE = "Exported from NOVA Planner  ·  {date}  ·  {author}"

// Empty string means "no footer" — distinct from unset, which falls back to the default.
export async function getPdfFooterTemplate(): Promise<string> {
  const stored = await getSetting(FOOTER_TEMPLATE_KEY)
  return stored ?? DEFAULT_PDF_FOOTER_TEMPLATE
}

export async function setPdfFooterTemplate(template: string): Promise<void> {
  await setSetting(FOOTER_TEMPLATE_KEY, template)
}
