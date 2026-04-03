/**
 * Social Module Service Index
 * Re-exports all services as a single object for convenient imports
 */
export * from './service'

// Re-export as named exports for API routes
import {
  filterSensitiveWords,
  getSensitiveWords,
  getSettings,
  updateSettings,
  createComment,
  createReply,
  getPublicComments,
  getAdminComments,
  getAdminComment,
  updateCommentStatus,
  updateReplyStatus,
  deleteComment,
  deleteReply,
  getAdminReplies,
  toggleLike,
  getLikeInfo,
  isFeatureEnabled,
} from './service'

export const socialService = {
  filterSensitiveWords,
  getSensitiveWords,
  getSettings,
  updateSettings,
  createComment,
  createReply,
  getPublicComments,
  getAdminComments,
  getAdminComment,
  updateCommentStatus,
  updateReplyStatus,
  deleteComment,
  deleteReply,
  getAdminReplies,
  toggleLike,
  getLikeInfo,
  isFeatureEnabled,
}
