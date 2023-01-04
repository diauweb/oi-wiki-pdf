import { visit } from 'unist-util-visit'
import { toString } from 'mdast-util-to-string'
import { remark } from 'remark'
import assert from 'assert'
import remarkMath from 'remark-math'

function trim (str, ch) {
  let start = 0
  let end = str.length

  while (start < end && str[start] === ch) { ++start }
  while (end > start && str[end - 1] === ch) { --end }

  return (start > 0 || end < str.length) ? str.substring(start, end) : str
}

export default function attacher () {
  // const processor = this
  return function transformer (ast) {
    // remove frontmatters
    const pruneFields = ['disqus:', 'title:', 'author:', '=== "']
    function prunePredicate (e) {
      if (e.type !== 'paragraph') return true

      const str = toString(e)
      for (const field of pruneFields) {
        if (str.startsWith(field)) return false
      }

      return true
    }

    ast.children = ast.children.filter(prunePredicate)
    visit(ast, 'detailsContainer', function (node) {
      node.children = node.children.filter(prunePredicate)
    })

    visit(ast, 'code', function (node, _index, _parent) {
      if (node.value.startsWith('```') && node.value.endsWith('```') && node.lang === null) {
        const cb = node.value.split('\n')
        node.value = cb.slice(1, -1).join('\n')
        node.lang = cb[0].slice(3)
      }
    })

    // cleanup details
    visit(ast, 'detailsContainerSummary', function (node) {
      const processor = remark().use(remarkMath)
      const md = processor.stringify({ type: 'paragraph', children: node.children })
      const removeMduiMd = md.replace(/mdui-shadow-\d+\s+/g, '')
      const removeNewlineMd = trim(trim(removeMduiMd, ' '), '\n')
      const newMd = trim(removeNewlineMd, '"')
      node.children = processor.parse(newMd).children[0].children
    })

    // convert details
    visit(ast, 'detailsContainer', function (node, _index, _parent) {
      assert.equal(node.children[0].type, 'detailsContainerSummary')

      node.type = 'containerDirective'
      node.name = 'details'
      node.attributes = { open: true }

      node.children[0].type = 'leafDirective'
      node.children[0].name = 'summary'
    })
  }
}
