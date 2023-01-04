import path from 'path'
import fs from 'fs'

const SNIPPET_TOKEN = '--8<-- '

function resolvePath (snip) {
  let str = snip.substring(SNIPPET_TOKEN.length)
  if ((str.startsWith('"') && str.endsWith('"')) ||
       (str.startsWith('\'') && str.endsWith('\''))) {
    str = str.substring(1, str.length - 1)
  }
  return str.replace(/^docs\//, '')
}
export async function unfoldSnippets(md) {
  const contents = md.split('\n')
  for (const i in contents) {
    const spacesAtStart = contents[i].length - contents[i].trimLeft().length
    const spaceString = ' '.repeat(spacesAtStart)
    const val = contents[i].trim()
    if (val.startsWith(SNIPPET_TOKEN)) {
      const p = resolvePath(val)
      const filePath = path.resolve('.', 'repo', 'docs', p)
      if (!fs.existsSync(filePath)) {
        console.warn(`snippet: no such file ${p} to include`)
        continue
      }
      contents[i] = (await fs.promises.readFile(filePath)).toString()
      contents[i] = contents[i].split('\n').map(l => spaceString + l).join('\n')
    }
  }
  return contents.join('\n')
}
