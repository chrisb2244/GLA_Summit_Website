import { Dialog, Button, TextField, Box } from '@mui/material'
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
}

type FormValues = {
  'First name': string
  'Last name': string
  'Email': string
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
      rules={{...rules}}
      defaultValue=''
      render={({
        field: { name, ref, ...fProps },
        fieldState: { error, isTouched }
      }) => {
        let hasError = false
        let errorText = ''
        let helperProps = undefined
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
            type="text"
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
  const {
    control,
    handleSubmit,
    reset
  } = useForm<FormValues>({mode: 'onBlur'})
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
        <Box sx={{ 'm': 2, '> div.MuiFormControl-root': { p: 1 } }}>
          <FormField
            control={control}
            name="First name"
            rules={{ required: true, maxLength: 80 }}
          />
          <FormField
            control={control}
            name="Last name"
            rules={{ required: true, maxLength: 100 }}
          />
          <FormField
            control={control}
            name="Email"
            rules={{ required: true, pattern: /^\S+@\S+$/i }}
          />
          <Button type="submit" variant="outlined" fullWidth>
            Submit
          </Button>
        </Box>
      </form>
    </Dialog>
  )
}
