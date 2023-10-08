import { CssBaseline, ThemeProvider } from '@mui/material';
import { renderToString } from 'react-dom/server';
import { CacheProvider } from '@emotion/react';
import createEmotionCache from 'src/createEmotionCache';
import createEmotionServer from '@emotion/server/create-instance';
import { theme } from 'src/theme';

export const generateBody = (
  emailComponent: JSX.Element,
  plainText: string
) => {
  const footer =
    `The non-HTML version of this email has reduced content - if you're ` +
    `seeing this and want more content in future emails, please contact ` +
    `web@glasummit.org and let us know that non-HTML-rendered emails are ` +
    `important to you!`;

  return {
    body: generateHTMLBody(emailComponent),
    bodyPlain: plainText + footer
  };
};

function renderFullPage(html: string, css: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        ${css}
      </head>
      <body>
        <div id="root">${html}</div>
      </body>
    </html>
  `;
}

const generateHTMLBody = (emailComponent: JSX.Element) => {
  const cache = createEmotionCache();
  const { extractCriticalToChunks, constructStyleTagsFromChunks } =
    createEmotionServer(cache);

  const renderTarget = (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {emailComponent}
      </ThemeProvider>
    </CacheProvider>
  );
  const html = renderToString(renderTarget);
  const chunks = extractCriticalToChunks(html);
  const styles = constructStyleTagsFromChunks(chunks);

  return renderFullPage(html, styles);
};
