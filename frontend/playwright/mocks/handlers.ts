import FormData from 'form-data'
import { rest } from 'msw'

export const handlers = [
  rest.post('*/admin/generate_link', async (req, res, ctx) => {
    console.log('Caught request for generate link in handler-defined method')
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

  rest.post('https://api.mailgun.net/v3/mg.glasummit.org/messages', async (req, res, ctx) => {
    console.log('Caught email request in handler-defined method')
    let targetEndpoint = null
    const bodyToHolder = req.body as {to: string, subject: string, text: string, html: string, from: string}
    const { to } = bodyToHolder
    
    const attemptedEndpoint = to.match(/test[0-9]+_(.*)_user@glasummit.org/)
    if (attemptedEndpoint !== null) {
      targetEndpoint = attemptedEndpoint[1]
    }

    if(targetEndpoint !== null) {
      console.log('found endpoint: ', targetEndpoint)
      let body = undefined
      try {
        body = JSON.stringify(req.body)
      } catch (err) {
        console.log('err: ', err)
      }

      fetch(targetEndpoint, {
        method: 'POST',
        body,
        headers: req.headers
      })
    }
    return res(ctx.status(200))
  }),

  // rest.all('*', (req, res, ctx) => {
  //   console.log('URL: ', req.url, '\nMETHOD: ', req.method)
  //   return req.passthrough()
  // }),
]
