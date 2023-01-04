import fse from 'fs-extra'
import Mustache from 'mustache'
import ProgressBar from 'progress'

import klaw from 'klaw'
import path from 'path'
import YAML from 'yaml'
import { renderMd } from './render.js'

const { readFile, writeFile, copy, remove, mkdirp } = fse

const toc = await (async () => {
  const toc = []
  const ctx = YAML.parse((await readFile('./repo/mkdocs.yml')).toString()).nav
  // console.dir(ctx, { depth: 1000 });

  function walk (self, path) {
    const [k, v] = Object.entries(self)[0]
    if (Array.isArray(v)) {
      for (const i of v) {
        walk(i, [...path, k])
      }
    } else {
      toc.push({ name: k, file: v, path })
    }
  }

  for (const k of ctx) {
    walk(k, [])
  }
  return toc
})()

// toc.splice(0, 150)
// toc.splice(5)

const bar = new ProgressBar('Transform [:bar] :percent :current/:total :rate/rps -:eta ', { total: toc.length })
await Promise.all(toc.map(async (i) => {
  const md = (await readFile(`./repo/docs/${i.file}`)).toString()
  i.html = (await renderMd(md)).html.toString()
  bar.tick()
}))

const byChapters = await (async () => {
  const map = new Map()
  for (const i of toc) {
    const arr = map.get(i.path[0])
    if (arr) arr.push(i)
    else map.set(i.path[0], [i])
  }

  const ret = []
  for (const [k, v] of map.entries()) {
    ret.push({ name: k, docs: v })
  }

  return ret
})()

const artifacts = []
for (const chap of byChapters) {
  const outHtml = Mustache.render((await readFile('./src/main.html')).toString(), {
    name: chap.name,
    docs: chap.docs,
    docHtml: function () {
      return this.html
    },
    docName: function () {
      return this.name
    }
  })

  artifacts.push({
    name: chap.name,
    html: outHtml
  })
}

await remove('./public')
await mkdirp('./public/images')
for await (const file of klaw('repo/docs')) {
  if (!file.stats.isDirectory()) continue
  if (path.basename(file.path) !== 'images') continue
  await copy(file.path, './public/images')
}

await copy('./src/assets', './public/')
for (const art of artifacts) {
  await writeFile(`./public/${art.name}.html`, art.html)
}
