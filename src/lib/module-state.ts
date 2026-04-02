// Server-side module state detection
// This file can only be imported in Server Components or API Routes

import fs from 'fs'
import path from 'path'

export interface ModuleState {
  content: boolean
  commerce: boolean
  user: boolean
}

// Key files to check for each module
const moduleKeyFiles: Record<keyof ModuleState, string> = {
  content: 'src/app/admin/articles/page.tsx',
  commerce: 'src/app/admin/products/page.tsx',
  user: 'src/app/admin/members/page.tsx',
}

export function getModuleState(): ModuleState {
  const projectRoot = path.join(process.cwd())

  return {
    content: fs.existsSync(path.join(projectRoot, moduleKeyFiles.content)),
    commerce: fs.existsSync(path.join(projectRoot, moduleKeyFiles.commerce)),
    user: fs.existsSync(path.join(projectRoot, moduleKeyFiles.user)),
  }
}

// Filter menu groups based on module state
export function getEnabledMenuGroups(groups: { groupKey: string; items: unknown[] }[]): typeof groups {
  const state = getModuleState()

  return groups.filter(group => {
    if (group.groupKey === 'group_content' && !state.content) return false
    if (group.groupKey === 'group_commerce' && !state.commerce) return false
    if (group.groupKey === 'group_user' && !state.user) return false
    return true
  })
}
