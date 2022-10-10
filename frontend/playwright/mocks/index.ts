export const initMocks = async () => {
  if (typeof window === 'undefined') {
    console.log('Importing server')
    const { server } = await require('./server') as typeof import('./server')
    console.log('Starting a server')
    server.listen({
      onUnhandledRequest: 'bypass'
    })
    server.printHandlers()
  } else {
    console.log('Starting a worker?')
    const { worker } = await import('./browser')
    worker.start()
  }
}
