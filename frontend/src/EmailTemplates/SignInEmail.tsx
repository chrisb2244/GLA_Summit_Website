const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : '';

export const SignInEmailFn = (nameString: string, otpValue: string) => {
  const logoSrc = `${baseUrl}/logo.png`;
  return `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>GLA Summit 2024 - Verification Email</title>
    <html lang="en">
    <head>
    </head>
    <body>
      <table align="center" width="100%" role="presentation" cellSpacing="0" cellPadding="0" border="0" style="max-width:37.5em;background-color:#ffffff;border:1px solid #eee;border-radius:5px;box-shadow:0 5px 10px rgba(20,50,70,.2);margin-top:20px;width:400px;margin:0 auto;padding:12px 0 36px">
        <tbody>
          <tr style="width:100%">
            <td><img alt="GLA Summit Logo" src="${logoSrc}" width="123" height="123" style="display:block;outline:none;border:none;text-decoration:none;margin:0 auto" />
              <h1 style="color:#5837b9;font-size:32px;font-weight:700;text-align:center">GLA Summit 2024</h1>
              <table align="center" width="100%" role="presentation" cellSpacing="0" cellPadding="0" border="0" style="max-width:37.5em;color:#333;padding:0 48px 24px 48px">
                <tbody>
                  <tr style="width:100%">
                    <td>
                      <p style="font-size:14px;line-height:24px;margin:16px 0">Dear ${nameString},</p>
                      <p style="font-size:14px;line-height:24px;margin:16px 0">Your one-time passcode token is:</p>
                      <table align="center" width="100%" style="background:rgba(0,0,0,.05);border-radius:4px;margin:16px auto 14px;vertical-align:middle;width:220px" border="0" cellPadding="0" cellSpacing="0" role="presentation">
                        <tbody>
                          <tr>
                            <td>
                              <p style="font-size:32px;line-height:40px;margin:0 auto;color:#000;display:inline-block;font-family:HelveticaNeue-Bold;font-weight:700;letter-spacing:6px;padding-bottom:8px;padding-top:8px;width:100%;text-align:center">${otpValue}</p>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      <p style="font-size:14px;line-height:24px;margin:16px 0">If the dialog box on the GLA Summit website has closed, you can enter the code at <a href="https://glasummit.org/validateLogin" target="_blank" style="color:#a25bcd;text-decoration:underline">https://glasummit.org/validateLogin</a>.</p>
                    </td>
                  </tr>
                </tbody>
              </table>
              <p style="font-size:12px;line-height:23px;margin:0;color:#444;letter-spacing:0;padding:0 32px;text-align:center">Not expecting this email?</p>
              <p style="font-size:12px;line-height:23px;margin:0;color:#444;letter-spacing:0;padding:0 32px;text-align:center">Contact <a href="mailto:web@glasummit.org" target="_blank" style="color:#a25bcd;text-decoration:underline">web@glasummit.org</a> if you did not request this code.</p>
            </td>
          </tr>
        </tbody>
      </table>
    </body>
    </html>
    `;
};
