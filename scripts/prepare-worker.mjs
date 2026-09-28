import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

let page = readFileSync('dist/index.html', 'utf8')
const cssMatch = page.match(/<link rel="stylesheet"[^>]+href="([^"]+)"[^>]*>/)
const jsMatch = page.match(/<script[^>]*src="([^"]+)"[^>]*><\/script>/)
if (cssMatch) page = page.replace(cssMatch[0], `<style>${readFileSync(`dist/${cssMatch[1].replace(/^\//, '')}`, 'utf8')}</style>`)
if (jsMatch) page = page.replace(jsMatch[0], `<script>${readFileSync(`dist/${jsMatch[1].replace(/^\//, '')}`, 'utf8')}</script>`)
page = page.replaceAll('</script>', '<\\/script>').replaceAll('</style>', '<\\/style>')

mkdirSync('dist/server', { recursive: true })
const worker = readFileSync('worker/index.js', 'utf8').replace('"__INLINED_PAGE__"', JSON.stringify(page))
writeFileSync('dist/server/index.js', worker)
