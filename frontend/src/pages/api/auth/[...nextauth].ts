import NextAuth from 'next-auth'
import EmailProvider from 'next-auth/providers/email'
import SequelizeAdapter from '@next-auth/sequelize-adapter'
import { Sequelize } from 'sequelize'

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: 'db',
  username: 'root',
  database: 'gla_summit_test',
  password: process.env.MYSQL_ROOT_PASSWORD
})

const conn = async () => {
  await sequelize
    .authenticate()
    .then(() => {
      console.log('Authenticated successfully')
    })
    .catch((error) => {
      console.log('Unable to connect: ', error)
    })
}
conn()

// Calling sync() is not recommended in production
sequelize.sync()

export default NextAuth({
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
    }),
  ],
  adapter: SequelizeAdapter(sequelize)
})
