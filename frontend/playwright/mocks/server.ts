// import { setupServer } from 'msw/node'
import { handlers } from './handlers'

const requestInterceptorFactory = (() => {
    console.log('Importing setupServer')
    const { setupServer } = require('msw/node') as typeof import('msw/node')
    console.log(setupServer)
    console.log('req interceptor is being initialized')
    const requestInterceptor = setupServer(...handlers)
    return requestInterceptor
})

export const server = requestInterceptorFactory()
