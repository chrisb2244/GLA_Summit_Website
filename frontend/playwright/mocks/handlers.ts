import { rest } from 'msw'

export const handlers = [
  rest.post('*/admin/generate_link', async (req, res, ctx) => {
    console.log('caught request for generate link in server...')
    const type = await req.json().then(v => v.type)
    console.log('type = ', type)
    const returnedContent = {
      // The link properties
      action_link: 'thisistheactionlink',
      email_otp: '123456',
      hashed_token: 'thisisthehashedlink',
      redirect_to: 'http://localhost:3000/',
      verification_type: type,
      // The "...rest" for the User object
      app_metadata: {},
      aud: '',
      created_at: '',
      id: '',
      user_metadata: {},
    }
    return res(ctx.json(returnedContent))
  }),

  rest.post('https://api.mailgun.net/v3/mg.glasummit.org/messages', (req, res, ctx) => {
    console.log(req.headers)
    return res(ctx.status(200))
  }),

  // rest.all('*', (req, res, ctx) => {
  //   console.log('URL: ', req.url, '\nMETHOD: ', req.method)
  //   return req.passthrough()
  // }),
]
