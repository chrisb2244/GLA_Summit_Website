const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : '';
const logoSrc = `${baseUrl}/logo.png`;

export const LogoImg = `<img alt="GLA Summit Logo" src="${logoSrc}" width="123" height="123" style="display:block;outline:none;border:none;text-decoration:none;margin:0 auto" />`;

export const UnexpectedEmail = `
<p style="font-size:12px;line-height:23px;margin:0;color:#444;letter-spacing:0;padding:0 32px;text-align:center">Not expecting this email?</p>
<p style="font-size:12px;line-height:23px;margin:0;color:#444;letter-spacing:0;padding:0 32px;text-align:center">Contact <a href="mailto:web@glasummit.org" target="_blank" style="color:#a25bcd;text-decoration:underline">web@glasummit.org</a> if you did not request this code.</p>
`;

export const UnexpectedPresentationEmail = `
<p style="font-size:12px;line-height:23px;margin:0;color:#444;letter-spacing:0;padding:0 32px;text-align:center">Not expecting this email?</p>
<p style="font-size:12px;line-height:23px;margin:0;color:#444;letter-spacing:0;padding:0 32px;text-align:center">Contact <a href="mailto:web@glasummit.org" target="_blank" style="color:#a25bcd;text-decoration:underline">web@glasummit.org</a> if you did not submit this presentation.</p>
`;
