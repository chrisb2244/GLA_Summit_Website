import { rest } from 'msw'

export const handlers = [
  // rest.post('/api/dummy_api_send_mail_link', (req, res, ctx) => {
  //   console.log('Caught request 1: ', req.url)
  //   req.json().then(data => {
  //     console.log(data)
  //   })
  //   return res(ctx.status(200))
  // }),

  // This is caught in the Docker container, running the "next dev" command with PLAYWRIGHT=1
  rest.post('http://localhost:3000/api/dummy_api_send_mail_link', (req, res, ctx) => {
    console.log('Caught request 2: ', req.url)
    req.json().then(data => {
      console.log(data)
    })
    return res(ctx.status(200))
  }),

  // rest.post('http://localhost:3000/./api/dummy_api_send_mail_link', (req, res, ctx) => {
  //   console.log('Caught request with dot: ', req.url)
  //   req.json().then(data => {
  //     console.log(data)
  //   })
  //   return res(ctx.status(200))
  // }),

  // rest.post(/.*\/api\/dummy_api_send_mail_link/, (req, res, ctx) => {
  //   console.log('Caught request with wildcard: ', req.url)
  //   req.json().then(data => {
  //     console.log(data)
  //   })
  //   return res(ctx.status(200))
  // })
]
