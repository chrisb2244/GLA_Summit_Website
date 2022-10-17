import { rest } from 'msw'

const emailToEndpoint = (email: string) => {
  const attemptedEndpoint = email.match(/test[0-9]+_([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)_([0-9]+)_(.*)_user@glasummit.org/)
  if (attemptedEndpoint !== null) {
    const ip = attemptedEndpoint[1]
    const port = attemptedEndpoint[2]
    const path = attemptedEndpoint[3]
    return `http://${ip}:${port}/${path}`
  }
  return null
}

export const handlers = [
  // rest.post('*/admin/generate_link', async (req, res, ctx) => {
  //   console.log('Caught request for generate link in handler-defined method')
  //   const type = await req.json().then(v => v.type)
  //   console.log('type = ', type)
  //   const returnedContent = {
  //     // The link properties
  //     action_link: 'thisistheactionlink',
  //     email_otp: '123456',
  //     hashed_token: 'thisisthehashedlink',
  //     redirect_to: 'http://localhost:3000/',
  //     verification_type: type,
  //     // The "...rest" for the User object
  //     app_metadata: {},
  //     aud: '',
  //     created_at: '',
  //     id: '',
  //     user_metadata: {},
  //   }
  //   return res(ctx.json(returnedContent))
  // }),

  rest.post('*/admin/generate_link', async (req, res, ctx) => {
    console.log('Caught generate link request in handler-defined method')
    const type = await req.json().then(v => v.type)
    if (type === 'signup') {
      const originalResponse = await ctx.fetch(req)
      const jsonObject = await originalResponse.json()
      console.log(jsonObject)
      const userId = jsonObject['id']
      const endpointToNotify = emailToEndpoint(jsonObject['email'])
      if (userId && endpointToNotify) {
        fetch(endpointToNotify, {
          method: 'POST',
          body: JSON.stringify({
            userId,
            type
          })
        })
      }
      return res(ctx.json(jsonObject))
    } else {
      return req.passthrough()
    }
  }),

  rest.post('https://api.mailgun.net/v3/mg.glasummit.org/messages', async (req, res, ctx) => {
    console.log('Caught email request in handler-defined method')
    const bodyToHolder = req.body as {to: string, subject: string, text: string, html: string, from: string}
    const { to } = bodyToHolder
    
    const targetEndpoint = emailToEndpoint(to)

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
      return res(ctx.status(200))
    } else {
      return req.passthrough()
    }
  }),

  // rest.all('*', (req, res, ctx) => {
  //   console.log('URL: ', req.url, '\nMETHOD: ', req.method)
  //   return req.passthrough()
  // }),
]
