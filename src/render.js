import { h } from 'hastscript'
import rehypeHighlight from 'rehype-highlight'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import rehypeStringify from 'rehype-stringify'
import { remark } from 'remark'
import remarkDetails from 'remark-details'
import remarkDirective from 'remark-directive'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkRehype from 'remark-rehype'
import { visit } from 'unist-util-visit'
import YAML from 'yaml'
import highlightConfig from './highlight.js'
import myProcessors from './processors.js'
import { unfoldSnippets } from './snippets.js'
export async function renderMd (text) {
  text = await unfoldSnippets(text)

  let frontmatter
  const html = await remark()
    .use(remarkFrontmatter)
    .use(remarkMath)
    .use(remarkDirective)
    .use(remarkDetails)
    .use(remarkGfm)
    .use(myProcessors)
    .use(function () {
      return function (ast) {
        if (ast.children[0]?.type === 'yaml') {
          frontmatter = YAML.parse(ast.children[0].value)
        }
      }
    })
    .use(function () {
      return function (tree) {
        visit(tree, (node) => {
          if (
            node.type === 'textDirective' ||
            node.type === 'leafDirective' ||
            node.type === 'containerDirective'
          ) {
            const data = node.data || (node.data = {})
            const hast = h(node.name, node.attributes)

            data.hName = hast.tagName
            data.hProperties = hast.properties
          }
        })
      }
    })
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeHighlight, highlightConfig)
    .use(rehypeKatex)
    .use(rehypeStringify)
    .process(text)

  return { html, frontmatter }
}
