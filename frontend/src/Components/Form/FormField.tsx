import { TextField } from '@mui/material'
import type { Control, UseControllerProps, Path } from 'react-hook-form'
import { Controller } from 'react-hook-form'

//  extends Record<Path<FormValues>,string>
export const FormField = <FormValues,>(props: {
  name: Path<FormValues>
  control: Control<FormValues>
  rules?: UseControllerProps<FormValues>['rules']
}): JSX.Element => {
  const { name, control, rules } = props

  return (
    <Controller
      control={control}
      name={name}
      rules={{ ...rules }}
      // defaultValue=''
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
