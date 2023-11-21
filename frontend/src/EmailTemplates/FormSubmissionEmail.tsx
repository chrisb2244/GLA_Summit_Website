import { EmailProps } from '@/Components/Form/Person';
import type { FormData } from '@/Components/Forms/PresentationSubmissionForm_old';
import { LogoImg, UnexpectedEmail } from './emailComponents';

const OtherPresenterRowsFn = (presenters: EmailProps[], tdStyle: string) => {
  const nRows = presenters.length;
  if (nRows === 0) {
    return `<tr>
    <td style="padding:8px 8px 8px 0;vertical-align:middle;font-size:10px;text-transform:uppercase;width:100px" rowSpan="${nRows}">Other Presenters</td>
    <td style="${tdStyle}">None</td>
    </tr>
    `;
  }
  const otherRows = presenters.slice(1);
  return `
      <tr>
        <td style="padding:8px 8px 8px 0;vertical-align:middle;font-size:10px;text-transform:uppercase;width:100px" rowSpan="${nRows}">Other Presenters</td>
        <td style="${tdStyle}">${presenters[0].email}</td>
      </tr>
      ${otherRows.map(({ email }) => {
        return `<tr>
            <td style="${tdStyle}">${email}</td>
          </tr>
          `;
      })}
    `;
};

export const FormSubmissionEmailFn = (formData: FormData) => {
  const {
    title,
    abstract,
    presentationType,
    learningPoints,
    otherPresenters,
    submitter: { firstName, lastName, email }
  } = formData;
  const nameString = `${firstName} ${lastName}`;
  let typeText = '';
  switch (presentationType) {
    case '7x7': {
      typeText = '7x7 (7 minutes)';
      break;
    }
    case '15 minutes': {
      typeText = 'Short Length (15 minutes)';
      break;
    }
    case 'full length': {
      typeText = 'Full Length (45 minutes)';
      break;
    }
    case 'panel': {
      typeText = 'Panel Discussion';
      break;
    }
  }
  const parsedAbstract = abstract; // Consider handling line-end chars
  const parsedLearningPoints = learningPoints; // Consider handling line-end chars
  const tdStyle = 'padding:8px 0px;vertical-align:middle;word-wrap:break-word';
  const labelStyle =
    'padding:8px 8px 8px 0;vertical-align:middle;font-size:10px;text-transform:uppercase;width:100px';

  return `
  <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <html lang="en">
    <head></head>
    <div id="__react-email-preview" style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">Thank you for submitting a presentation</div>

    <body style="background-color:#fff;font-family:Roboto,sans-serif">
      <table align="center" width="100%" role="presentation" cellSpacing="0" cellPadding="0" border="0" style="max-width:37.5em;background-color:#fff;border:1px solid #eee;border-radius:5px;box-shadow:0 5px 10px rgba(20,50,70,.2);margin-top:20px;width:360px;margin:0 auto;padding:68px 0 130px">
        <tbody>
          <tr style="width:100%">
            <td>${LogoImg}
              <h1 style="color:#444;font-size:32px;font-weight:700;text-align:center">GLA Summmit 2024</h1>
              <table align="center" width="100%" role="presentation" cellSpacing="0" cellPadding="0" border="0" style="max-width:37.5em;width:324px">
                <tbody>
                  <tr style="width:100%">
                    <td>
                      <p style="font-size:14px;line-height:24px;margin:16px 0">Dear ${nameString},</p>
                      <p style="font-size:14px;line-height:24px;margin:16px 0">Thank you for submitting a presentation for GLA Summit 2024!</p>
                      <p style="font-size:14px;line-height:24px;margin:16px 0">The data you submitted is shown below.</p>
                      <table style="border-spacing:0px;border-collapse:collapse;color:#444;width:100%;table-layout:fixed">
                        <tr>
                          <td style="${labelStyle}">Type</td>
                          <td style="${tdStyle}">${typeText}</td>
                        </tr>
                        <tr style="border-width:1px;border-style:solid;border-color:#aaa"></tr>
                        <tr>
                          <td style="${labelStyle}">Title</td>
                          <td style="${tdStyle}">${title}</td>
                        </tr>
                        <tr style="border-width:1px;border-style:solid;border-color:#ddd"></tr>
                        <tr>
                          <td style="${labelStyle}">Abstract</td>
                          <td style="${tdStyle}">${parsedAbstract}</td>
                        </tr>
                        <tr style="border-width:1px;border-style:solid;border-color:#ddd"></tr>
                        <tr>
                          <td style="${labelStyle}">Learning points</td>
                          <td style="${tdStyle}">${parsedLearningPoints}</td>
                        </tr>
                        <tr style="border-width:1px;border-style:solid;border-color:#aaa"></tr>
                        <tr>
                          <td style="${labelStyle}">Submitter Name</td>
                          <td style="${tdStyle}">${nameString}</td>
                        </tr>
                        <tr style="border-width:1px;border-style:solid;border-color:#ddd"></tr>
                        <tr>
                          <td style="${labelStyle}">Submitter Email</td>
                          <td style="${tdStyle}">${email}</td>
                        </tr>
                        <tr style="border-width:1px;border-style:solid;border-color:#aaa"></tr>
                        ${OtherPresenterRowsFn(otherPresenters, tdStyle)}
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
              ${UnexpectedEmail}
            </td>
          </tr>
        </tbody>
      </table>
    </body>
  </html>
  `;
};
