import { Box, Typography } from '@mui/material';
import type { BoxProps, TypographyProps } from '@mui/material';
import GLA_Logo from '@/media/GLA-logo.svg';
import NextImage from 'next/image';

export const MaintenancePage: React.FC<
  React.PropsWithChildren<unknown>
> = () => {
  const TextElem: React.FC<React.PropsWithChildren<TypographyProps>> = ({
    children,
    ...other
  }) => {
    return (
      <Typography textAlign='center' color='text.secondary' {...other}>
        {children}
      </Typography>
    );
  };

  const PurpleBox: React.FC<React.PropsWithChildren<BoxProps>> = ({
    children,
    ...other
  }) => {
    return (
      <Box
        bgcolor='secondary.main'
        maxWidth={{ md: 'lg', xs: '90%' }}
        mx='auto'
        p={3}
        mb={3}
        borderRadius={'25px'}
        {...other}
      >
        {children}
      </Box>
    );
  };

  const imageProps = {
    'aria-label': 'logo'
  };

  const logo = (
    <>
      <Box py={4}>
        <NextImage
          src={GLA_Logo}
          {...imageProps}
          height={200}
          style={{ pointerEvents: 'none' }}
          alt='GLA Logo'
        />
      </Box>
    </>
  );

  return (
    <>
      <Box
        flexDirection='column'
        display='flex'
        minHeight='100vh'
        justifyContent='center'
        bgcolor='primary.main'
        alignItems='center'
      >
        {logo}
        <PurpleBox>
          <TextElem variant='h1'>GLA Summit 2022</TextElem>
          <TextElem variant='h4'>14th - 15th November 2022</TextElem>
        </PurpleBox>
        <PurpleBox>
          <TextElem variant='body1' sx={{ fontSize: '28px !important' }}>
            We&apos;re excited to be preparing a new page for GLA Summit 2022!
          </TextElem>
          <TextElem variant='body1' sx={{ fontSize: '28px !important' }}>
            Check back soon for updates
          </TextElem>
        </PurpleBox>
      </Box>
    </>
  );
};
