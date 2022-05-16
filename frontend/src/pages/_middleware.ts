import { chain, nextSafe, strictDynamic, strictInlineStyles } from '@next-safe/middleware';


// add('default-src', `'none'`)
// add('connect-src', `'self'`, { devOnly: true })

// // Scripts
// add('script-src-elem', `'self'`)
// add('script-src', inlineScriptHash)
// // Allow unsafe-eval scripts in development mode
// add('script-src', `'unsafe-eval'`, { devOnly: true })

// // Fonts
// add('font-src', `'self'`)
// add('font-src', 'https://fonts.gstatic.com/s/roboto/')

// // Images
// add('img-src', `'self'`)
// add('img-src', 'data:')

// // Styles
// add('style-src', `'self'`)
// if (typeof nonce !== 'undefined') {
//   add('style-src', `'nonce-${nonce}'`)
// }
// add('style-src', `'unsafe-inline'`)

// return Object.entries(policy)
//   .map(([key, value]) => `${key} ${value.join(' ')}`)
//   .join('; ')
// }

const isDev = process.env.NODE_ENV === 'development';

const cspMiddleware = nextSafe((req) => ({
  isDev,
  contentSecurityPolicy: {
    "default-src": "'none'",
    "script-src": "'self'",
    "font-src": ["'self'", "https://fonts.gstatic.com/s/roboto/"],
    "img-src": ["'self'", "data:"],
    "style-src": "https://fonts.googleapis.com/"
  }
}))

export default chain(cspMiddleware, strictDynamic(), strictInlineStyles({extendStyleSrc: true}));