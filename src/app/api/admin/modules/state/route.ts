import { ApiResponse } from '@/lib/utils/api-response'
import { getModuleState } from '@/lib/module-state'


/**
 * get modules state
 * @description get modules state
 * @tag Admin - modules
 * @auth bearerAuth
 */
export async function GET() {
  const state = getModuleState()
  return ApiResponse.success({ ...state })
}
