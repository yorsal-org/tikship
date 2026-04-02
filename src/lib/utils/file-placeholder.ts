/**
 * File placeholder utilities
 * Utility functions for file operations placeholder handling
 * Also serves as a placeholder module when user management is disabled
 */

import type { NextAuthOptions } from 'next-auth'

/**
 * Placeholder auth options when user module is disabled
 * This allows the app to compile without the user module
 */
export const authOptions: NextAuthOptions = {
  providers: [],
  callbacks: {
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.sub as string,
      },
    }),
    jwt: ({ token, user }) => {
      if (user) {
        token.id = user.id
      }
      return token
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
}

/**
 * Check if a file path is a valid placeholder or empty path
 */
export function isPlaceholder(filePath: string | null | undefined): boolean {
  if (!filePath) return true
  const placeholders = ['', 'null', 'undefined', '/placeholder', '/empty']
  return placeholders.includes(filePath.toLowerCase())
}

/**
 * Get placeholder URL for missing images
 */
export function getImagePlaceholder(): string {
  return '/placeholder-image.svg'
}

/**
 * Get placeholder URL for missing avatars
 */
export function getAvatarPlaceholder(): string {
  return '/placeholder-avatar.svg'
}

/**
 * Validate file extension for upload
 */
export function isValidImageExtension(filename: string): boolean {
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'))
  return validExtensions.includes(ext)
}
