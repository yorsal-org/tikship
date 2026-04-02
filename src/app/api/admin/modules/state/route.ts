import { ApiResponse } from '@/lib/utils/api-response'
import { getModuleState } from '@/lib/module-state'

export async function GET() {
  const state = getModuleState()
  return ApiResponse.success({ ...state })
}
