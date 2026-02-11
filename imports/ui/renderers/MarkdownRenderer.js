import { marked, Renderer } from 'marked'

class DefaultRenderer extends Renderer {
  heading ({ tokens }) {
    const text = this.parser.parseInline(tokens);
    return `<span class="lea-text-bold">${text}</span>`
  }

  paragraph ({ tokens } /*, level */) {
    const text = this.parser.parseInline(tokens);
    return `<p class="lea-text">${text}</p>`
  }

  strong ({ tokens }) {
    const text = this.parser.parseInline(tokens);
    return `<span class="lea-text-bold">${text}</span>`
  }
}

const renderer = new DefaultRenderer()
const defaultOptions = {
  mangle: false,
  breaks: true,
  gfm: true,
  async: true,
  headerIds: false,
}

export const MarkdownRenderer = {}

MarkdownRenderer.render = async (txt) => {
  return await marked.parse(txt.replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/,""), {
    ...defaultOptions,
    renderer,
  })
}
