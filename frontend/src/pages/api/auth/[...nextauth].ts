import NextAuth from 'next-auth'
import EmailProvider from 'next-auth/providers/email'
import SequelizeAdapter from '@next-auth/sequelize-adapter'
import { Sequelize } from 'sequelize'
import * as pg from 'pg'
import type { NextApiRequest, NextApiResponse } from 'next/types'

// const sequelize = new Sequelize({
//   dialect: 'mysql',
//   host: 'db',
//   username: 'root',
//   database: 'gla_summit_test',
//   password: process.env.MYSQL_ROOT_PASSWORD
// })

const sequelize = new Sequelize({
  dialect: 'postgres',
  database: process.env.POSTGRES_DB,
  host: process.env.POSTGRES_HOST,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PW,
  port: 5432,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  dialectModule: pg,
  pool: {
    min: 0,
    max: 5
  }
})

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
    adapter: SequelizeAdapter(sequelize, { synchronize: false }),
    session: {
      strategy: 'jwt' // Explicitly use tokens for session management
      // This will reduce the number of calls to the db, which will improve responsiveness
    },
    callbacks: {
      signIn: ({ user, email }) => {
        if (isRegistration(req)) {
          console.log(req.query.registration_data)
          sequelize
        } else {
          if (email.verificationRequest ?? false) {
            const exists = 'emailVerified' in user
            if (exists) {
              return true
            } else {
              return false
            }
          }
        }
        return true
      }
    }
  })
}
