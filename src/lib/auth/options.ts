import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GithubProvider from 'next-auth/providers/github'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/db/prisma'
import { verifyPassword } from '@/lib/utils/password'
import { getApiTranslations } from '@/lib/i18n/config'
import { settingsService } from '@/lib/settings/service'

/**
 * Utility to record login attempts
 */
async function recordLoginAttempt({
  email,
  successful,
  ipAddress,
  userAgent,
  userId,
}: {
  email: string
  successful: boolean
  ipAddress: string
  userAgent: string
  userId?: string
}) {
  const authSettings = await settingsService.getAuthSettings()

  if (!authSettings.loginLimitsEnabled) return

  await prisma.loginAttempt.create({
    data: {
      email,
      successful,
      ipAddress,
      userAgent,
      userId,
    },
  })
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      allowDangerousEmailAccountLinking: true,
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
          scope: 'openid email profile',
        },
      },
    }),
    GithubProvider({
      allowDangerousEmailAccountLinking: true,
      clientId: process.env.GITHUB_ID || '',
      clientSecret: process.env.GITHUB_SECRET || '',
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        const t = await getApiTranslations()

        if (!credentials?.email || !credentials?.password) {
          throw new Error(t('login.email_password_required'))
        }

        const email = credentials.email
        const password = credentials.password

        // Get IP address and user agent
        const ipAddress = (
          req.headers?.['x-forwarded-for'] ||
          req.headers?.['x-real-ip'] ||
          ''
        ).toString()
        const userAgent = (req.headers?.['user-agent'] || '').toString()

        // Check login attempts in last window duration if enabled
        const authSettings = await settingsService.getAuthSettings()

        if (authSettings.loginLimitsEnabled) {
          const windowMs = authSettings.loginLimitsWindowMinutes * 60 * 1000
          const windowStart = new Date(Date.now() - windowMs)
          const recentFailedAttempts = await prisma.loginAttempt.count({
            where: {
              email,
              successful: false,
              createdAt: {
                gte: windowStart,
              },
            },
          })

          if (recentFailedAttempts >= authSettings.loginLimitsMaxAttempts) {
            throw new Error(t('login.rate_limit'))
          }
        }

        // Find user
        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user || !user.password) {
          await recordLoginAttempt({
            email,
            successful: false,
            ipAddress,
            userAgent,
          })
          throw new Error(t('login.invalid_credentials'))
        }

        if (!user.isActive) {
          throw new Error(t('login.account_disabled'))
        }

        // Verify password
        const isValid = await verifyPassword(password, user.password)

        if (!isValid) {
          await recordLoginAttempt({
            email,
            successful: false,
            ipAddress,
            userAgent,
            userId: user.id,
          })
          throw new Error(t('login.invalid_credentials'))
        }

        // Record successful attempt
        await recordLoginAttempt({
          email,
          successful: true,
          ipAddress,
          userAgent,
          userId: user.id,
        })

        // Successful login
        return {
          id: user.id,
          email: user.email!,
          name: user.name,
          image: user.image,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt', // jwt or database
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Check if user is active
      if (user?.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { isActive: true },
        })
        if (dbUser && !dbUser.isActive) {
          return '/auth/error?error=AccountDisabled'
        }
      }

      // Allow sign in
      if (account?.provider === 'google') {
        const googleProfile = profile as { email_verified?: boolean }
        return googleProfile.email_verified === true
      }
      return true
    },
    async jwt({ token, user, account, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.picture = user.image
      }

      // Handle session update
      if (trigger === 'update' && session) {
        if (session.name !== undefined) token.name = session.name
        if (session.image !== undefined) token.picture = session.image
        if (session.picture !== undefined) token.picture = session.picture

        // Also support nested user object if passed that way
        if (session.user) {
          if (session.user.name !== undefined) token.name = session.user.name
          if (session.user.image !== undefined) token.picture = session.user.image
        }
      }

      // Store access token if available
      if (account) {
        token.accessToken = account.access_token
        token.provider = account.provider
      }

      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.image = token.picture as string
      }
      return session
    },
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      console.log(`User signed in: ${user.email} via ${account?.provider}`)

      // Update lastLoginAt for all forms of sign in
      if (user.id) {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          })
        } catch (error) {
          console.error('Failed to update lastLoginAt in signIn event:', error)
          // Don't fail the sign in just for this
        }
      }

      if (isNewUser) {
        console.log(`New user created: ${user.email}`)
      }
    },
    async signOut({ token }) {
      console.log(`User signed out: ${token?.email}`)
    },
  },
  debug: process.env.NODE_ENV === 'development',
}
