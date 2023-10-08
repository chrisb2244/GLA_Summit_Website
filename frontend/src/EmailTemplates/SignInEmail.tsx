import { Box } from '@mui/material';
import { P } from './emailComponents';

export const SignInEmail: React.FC<{
  link: string;
}> = ({ link }) => {
  const headerText = (
    <>
      <P sx={{ textAlign: 'justify' }}>
        Here&apos;s your sign-in link for the GLA Summit Website. <br />
        <br />
        Please use this link to sign in: <br />
        <a href={link}>Sign In</a>
        <br />
        <br />
        You can also copy and paste this URL into your web browser:
        <br />
        {link}
      </P>
    </>
  );

  return (
    <Box>
      <Box sx={{ maxWidth: '800px' }}>
        <Box>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src='https://iuqlmccpbxtgcluccazt.supabase.co/storage/v1/object/public/public-images/GLA-logo.png?t=2022-05-20T09:06:14.131Z'
            height={80}
            width={80}
            alt='GLA logo'
            style={{ float: 'right', padding: '5px' }}
          />
        </Box>
        {headerText}
      </Box>
      {/* Maybe put a banner here at the bottom? */}
    </Box>
  );
};
