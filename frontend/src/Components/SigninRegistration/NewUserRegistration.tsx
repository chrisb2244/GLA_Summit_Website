import {
  Dialog,
  Button,
  TextField,
  Typography,
  Box,
  Container,
  Link
} from '@mui/material'
import type { TypographyProps } from '@mui/material'
import {
  useForm,
  FieldErrors,
  SubmitHandler,
  Controller,
  Control,
  UseControllerProps
} from 'react-hook-form'

type UserRegistrationProps = {
  open: boolean
  setClosed: () => void
  switchToSignIn: () => void
}

type FormValues = {
  'First name': string
  'Last name': string
  Email: string
}

const SmallCenteredText: React.FC<TypographyProps> = ({
  children,
  ...typographyProps
}) => {
  return (
    <Typography
      variant='body2'
      fontSize='small'
      align='center'
      {...typographyProps}
    >
      {children}
    </Typography>
  )
}

const FormField = (props: {
  name: keyof FormValues
  control: Control<FormValues, any>
  rules?: UseControllerProps<FormValues>['rules']
}) => {
  const { name, control, rules } = props

  return (
    <Controller
      control={control}
      name={name}
      rules={{ ...rules }}
      defaultValue=''
      render={({
        field: { name, ref, ...fProps },
        fieldState: { error, isTouched }
      }) => {
        let hasError = false
        let errorText = ''
        let helperProps
        if (isTouched) {
          hasError = typeof error !== 'undefined'
          errorText = hasError ? error?.type ?? 'Oops, error but no text' : ''
          helperProps = hasError ? { role: 'alert' } : undefined
        }
        return (
          <TextField
            label={name}
            error={hasError}
            helperText={errorText}
            id={name}
            type='text'
            fullWidth
            aria-label={name}
            inputRef={ref}
            FormHelperTextProps={helperProps}
            {...fProps}
          />
        )
      }}
    />
  )
}

export const NewUserRegistration: React.FC<UserRegistrationProps> = (props) => {
  const { control, handleSubmit, reset } = useForm<FormValues>({
    mode: 'onBlur'
  })
  const onSubmit: SubmitHandler<FormValues> = (data: FormValues, event) => {
    console.log(data)
    reset()
    props.setClosed()
  }
  const onError = (err: FieldErrors<FormValues>) => console.log(err)

  return (
    <Dialog open={props.open} onClose={props.setClosed}>
      <form
        onSubmit={handleSubmit(onSubmit, onError)}
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        <Container maxWidth='md' sx={{ pb: 2 }}>
          <Box mb={2}>
            <FormField
              control={control}
              name='First name'
              rules={{ required: true, maxLength: 80 }}
            />
            <FormField
              control={control}
              name='Last name'
              rules={{ required: true, maxLength: 100 }}
            />
            <FormField
              control={control}
              name='Email'
              rules={{ required: true, pattern: /^\S+@\S+$/i }}
            />
            <Button type='submit' variant='outlined' fullWidth>
              Register
            </Button>
            <SmallCenteredText sx={{ pt: 2 }}>
              Already registered?{' '}
              <Link
                onClick={(ev) => {
                  ev.preventDefault()
                  props.switchToSignIn()
                }}
                component='button'
              >
                Sign In
              </Link>
            </SmallCenteredText>
          </Box>
        </Container>
      </form>
    </Dialog>
  )
}
