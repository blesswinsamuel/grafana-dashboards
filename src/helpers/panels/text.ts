import * as text from '@grafana/grafana-foundation-sdk/text'

export type TextPanelOpts = {
  content: string
  mode?: 'html' | 'markdown' | 'code'
  transparent?: boolean
  height?: number
  title?: string
}

export function NewTextPanel({ content, mode = 'markdown', transparent = true, height, title }: TextPanelOpts): text.PanelBuilder {
  const b = new text.PanelBuilder()
    .transparent(transparent)
    .mode({ html: text.TextMode.HTML, markdown: text.TextMode.Markdown, code: text.TextMode.Code }[mode])
    .content(content)
  if (height) {
    b.height(height)
  }
  if (title) {
    b.title(title)
  }
  return b
}
