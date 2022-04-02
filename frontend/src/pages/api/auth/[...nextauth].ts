import NextAuth from 'next-auth'
import EmailProvider from 'next-auth/providers/email'
import { PrismaClient } from '@prisma/client'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import type { NextApiRequest, NextApiResponse } from 'next/types'

const prisma = new PrismaClient()

const isRegistration = (req: NextApiRequest): boolean => {
  if (
    req.query.nextauth &&
    req.query.nextauth.length === 2 &&
    req.query.nextauth[0] === 'signin' &&
    req.query.nextauth[1] === 'email'
  ) {
    return req.query.signin_type === 'registration'
  }
  return false
}

export default (req: NextApiRequest, res: NextApiResponse<any>) => {
  return NextAuth(req, res, {
    providers: [
      EmailProvider({
        server: {
          host: process.env.EMAIL_SERVER_HOST,
          port: process.env.EMAIL_SERVER_PORT,
          auth: {
            user: process.env.EMAIL_SERVER_USER,
            pass: process.env.EMAIL_SERVER_PASSWORD
          }
        },
        from: process.env.EMAIL_FROM
      })
    ],
    // adapter: SequelizeAdapter(sequelize, { synchronize: false }),
    adapter: PrismaAdapter(prisma),
    session: {
      strategy: 'jwt' // Explicitly use tokens for session management
      // This will reduce the number of calls to the db, which will improve responsiveness
    },
    callbacks: {
      signIn: ({ user, email }) => {
        if (isRegistration(req)) {
          console.log(req.query.registration_data)
          return true
        } else {
          if (email.verificationRequest ?? false) {
            const exists = 'emailVerified' in user
            if (exists) {
              console.log("Found email, logging in")
              return true
            } else {
              console.log("Email not found, blocking login")
              return false
            }
          }
        }
        return true
      }
    }
  })
}
