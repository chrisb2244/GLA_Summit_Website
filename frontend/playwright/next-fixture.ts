import { test as base } from '@playwright/test'
import { rest } from 'msw'
import type { SetupServerApi } from 'msw/node'
import { server as requestInterceptor } from './mocks/server'

const test = base.extend<{
  requestInterceptor: SetupServerApi
  rest: typeof rest
}>({
  requestInterceptor: [
    async ({}, use) => {
      // console.log('line before')
      // console.log(requestInterceptor)
      // console.log('line after')
      await use(requestInterceptor)
    }, {
      //@ts-ignore
      scope: 'worker', // test?
    }
  ],
  rest,
})

export default test