// Builds artifact/page.html + artifact/files.json from dist/ so the app can be published as a claude.ai page.
// (That host blocks service workers, so this version works online only; GitHub Pages is the installable one.)
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs'
const html = readFileSync('dist/index.html', 'utf8')
const tags = [...html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="\.\/assets\/[^"]+"[^>]*>(?:<\/script>)?/g)].map((m) => m[0])
mkdirSync('artifact', { recursive: true })
writeFileSync('artifact/page.html', `<title>Quickfire 9MA0</title>
<meta name="theme-color" content="#0f1420">
<style>html,body{background:#0f1420;color:#e8ecf5;color-scheme:dark}</style>
${tags.filter((t) => t.startsWith('<link')).join('\n')}
<div id="root"><p style="padding:40px;text-align:center;font:16px system-ui;color:#95a0bb">Loading Quickfire…</p></div>
${tags.filter((t) => t.startsWith('<script')).join('\n')}
`)
const files = {}
for (const f of readdirSync('dist/assets')) if (/\.(js|css|woff2)$/.test(f)) files[`assets/${f}`] = `dist/assets/${f}`
for (const f of readdirSync('public/mathlive-fonts')) files[`mathlive-fonts/${f}`] = `public/mathlive-fonts/${f}`
files['icon-192.png'] = 'public/icon-192.png'
writeFileSync('artifact/files.json', JSON.stringify(files, null, 1))
console.log(Object.keys(files).length, 'files'); console.log(readFileSync('artifact/page.html', 'utf8'))
