import createCache from '@emotion/cache'
import type { EmotionCache } from '@emotion/react'

export default function createEmotionCache (nonce?: string): EmotionCache {
  return createCache({
    key: 'css',
    prepend: true,
    nonce
  })
}
