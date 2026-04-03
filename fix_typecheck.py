import re

# Fix SpawnSyncOptionsWithStringEncoding issue
with open('ma-optimizer-electron/electron/ipc/utils.ts', 'r') as f:
    content = f.read()
content = content.replace('SpawnSyncOptionsWithStringEncoding<string>', 'SpawnSyncOptionsWithStringEncoding')
with open('ma-optimizer-electron/electron/ipc/utils.ts', 'w') as f:
    f.write(content)

# Fix powerplan.ts imports and types
with open('ma-optimizer-electron/electron/ipc/powerplan.ts', 'r') as f:
    content = f.read()
if "import { spawn }" not in content and "import { execSync, spawn }" not in content:
    content = content.replace("import { execSync }", "import { execSync, spawn }")
content = content.replace("(d) =>", "(d: any) =>")
content = content.replace("(err) =>", "(err: any) =>")
with open('ma-optimizer-electron/electron/ipc/powerplan.ts', 'w') as f:
    f.write(content)

# Fix driverUpdater.ts imports
with open('ma-optimizer-electron/electron/ipc/driverUpdater.ts', 'r') as f:
    content = f.read()

# Make sure spawnPromise, escapePS are explicitly added if missing
if 'spawnPromise' not in content[:500]:
    content = content.replace("import { spawnSyncChecked } from './utils'", "import { spawnSyncChecked, spawnPromise, escapePS } from './utils'")
if 'spawn' not in content[:500] and 'child_process' in content:
    content = content.replace("import { spawnSync } from 'child_process'", "import { spawnSync, spawn } from 'child_process'")

with open('ma-optimizer-electron/electron/ipc/driverUpdater.ts', 'w') as f:
    f.write(content)
