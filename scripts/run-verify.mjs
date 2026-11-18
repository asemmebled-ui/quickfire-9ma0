// Runs verify/verify.py on verify/bank-export.json.
// The Python and the project files are copied to the OS temp folder first, because a packaged
// (Microsoft Store / install-manager) Python cannot read files under AppData\Roaming on Windows.
// Needs: pip install sympy mpmath
import { copyFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const dir = mkdtempSync(join(tmpdir(), 'qf-verify-'))
copyFileSync('verify/verify.py', join(dir, 'verify.py'))
copyFileSync('verify/bank-export.json', join(dir, 'bank-export.json'))
const py = process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3')
const r = spawnSync(py, [join(dir, 'verify.py'), join(dir, 'bank-export.json')], { stdio: 'inherit', env: process.env })
process.exit(r.status ?? 1)
