import { handlers } from './handlers'

const requestInterceptorFactory = (() => {
    console.log('Importing setupServer')
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { setupServer } = require('msw/node') as typeof import('msw/node')
    const requestInterceptor = setupServer(...handlers)
    return requestInterceptor
})

export const server = requestInterceptorFactory()
