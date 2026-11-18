// Publishes dist/ to the gh-pages branch (GitHub Pages serves it).
// It works from a short temporary folder because Windows git can't handle very long paths.
// Run via `npm run deploy`, which first runs every check and rebuilds.
import { cpSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'

const git = (args, cwd) => execFileSync('git', args, { cwd, stdio: ['ignore', 'pipe', 'inherit'] }).toString().trim()
const remote = git(['remote', 'get-url', 'origin'], process.cwd())
const name = git(['config', 'user.name'], process.cwd())
const email = git(['config', 'user.email'], process.cwd())
const dir = mkdtempSync(join(tmpdir(), 'qfpages-'))
cpSync('dist', dir, { recursive: true })
writeFileSync(join(dir, '.nojekyll'), '')
git(['init', '-q', '-b', 'gh-pages'], dir)
git(['config', 'core.autocrlf', 'false'], dir)
git(['add', '-A'], dir)
git(['-c', `user.name=${name}`, '-c', `user.email=${email}`, 'commit', '-q', '-m', `Deploy ${new Date().toISOString()}`], dir)
git(['push', '-q', '-f', remote, 'gh-pages'], dir)
const m = remote.match(/github\.com[/:]([^/]+)\/([^/.]+)/)
console.log(`Deployed. Live in about a minute at https://${m ? `${m[1].toLowerCase()}.github.io/${m[2]}/` : '<your Pages URL>'}`)
