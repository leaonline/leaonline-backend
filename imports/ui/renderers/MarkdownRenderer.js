import { marked, Renderer } from 'marked'

class DefaultRenderer extends Renderer {
  heading (text) {
    return `<span class="lea-text-bold">${text}</span>`
  }

  paragraph (text /*, level */) {
    return `<p class="lea-text">${text}</p>`
  }

  strong (text) {
    return `<span class="lea-text-bold">${text}</span>`
  }
}

const renderer = new DefaultRenderer()
const defaultOptions = {
  mangle: false,
  breaks: true,
  gfm: true,
  async: true,
  headerIds: false
}

export const MarkdownRenderer = {}

MarkdownRenderer.render = async txt => {
  return marked.parse(txt, {
    ...defaultOptions,
    renderer
  })
}
