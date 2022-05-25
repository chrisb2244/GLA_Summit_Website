import { Box, TextField, Typography } from '@mui/material'
import type { Breakpoint, SxProps, Theme } from '@mui/material'
import {
  join,
  UseFormRegister,
  TypedFieldPath,
  FieldErrors
} from 'react-hook-form'

export type PersonProps = {
  firstName: string
  lastName: string
  email: string
}

export function Person<FieldValues>(props: {
  register: UseFormRegister<FieldValues>
  path: TypedFieldPath<FieldValues, PersonProps>
  errors: FieldErrors<PersonProps> | undefined
  defaultValue?: PersonProps
  locked?: boolean
  heading?: string
  splitSize?: Breakpoint | null
  sx?: SxProps<Theme>
}) {
  const { register, path, defaultValue, locked, heading } = props
  // Default to 'md' if not specified. Allow null to prevent splitting regardless of size
  const splitSize =
    typeof props.splitSize !== 'undefined' ? props.splitSize : 'md'

  const halfWidthSx = (side: 'left' | 'right', pVal = '5px') => {
    if (splitSize === null) {
      return {
        width: '100%',
        paddingBottom: 1
      }
    } else {
      return {
        width: { xs: '100%', [splitSize]: '50%' },
        paddingInlineEnd: { xs: 0, [splitSize]: side === 'left' ? pVal : 0 },
        paddingInlineStart: { xs: 0, [splitSize]: side === 'right' ? pVal : 0 },
        paddingBottom: { xs: 1, [splitSize]: 0 }
      }
    }
  }

  let headElem = null
  if (typeof heading !== 'undefined') {
    headElem = (
      <Box px={1}>
        <Typography variant='body2'>{heading}</Typography>
      </Box>
    )
  }
  let displayProps = {}
  if (locked ?? false) {
    displayProps = {
      ...displayProps,
      variant: 'filled',
      InputProps: { readOnly: true }
    }
  }

  const labels = {
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email'
  }

  const fieldProps = (field: keyof PersonProps) => {
    const error = props.errors?.[field]
    const isError = !!error
    return {
      defaultValue: defaultValue?.[field],
      placeholder: labels[field],
      label: labels[field],
      error: isError,
      helperText: error?.message,
      FormHelperTextProps: { role: isError ? 'alert' : undefined }
    }
  }

  return (
    <Box sx={props.sx}>
      {headElem}
      <Box
        flexDirection={
          splitSize === null ? 'column' : { xs: 'column', [splitSize]: 'row' }
        }
        pb={splitSize === null ? 0 : { xs: 0, [splitSize]: 1 }}
      >
        <TextField
          {...register(join(path, 'firstName'), {
            required: 'Required',
            maxLength: 80
          })}
          sx={halfWidthSx('left')}
          {...fieldProps('firstName')}
          {...displayProps}
        />
        <TextField
          {...register(join(path, 'lastName'), {
            required: 'Required',
            maxLength: 100
          })}
          sx={halfWidthSx('right')}
          {...fieldProps('lastName')}
          {...displayProps}
        />
      </Box>
      <Box>
        <TextField
          {...register(join(path, 'email'), {
            required: 'Required',
            pattern: {
              value: /^\S+@\S+\.\S+$/i,
              message: "This email doesn't match the expected pattern"
            }
          })}
          fullWidth
          {...fieldProps('email')}
          {...displayProps}
        />
      </Box>
    </Box>
  )
}

export type EmailProps = {
  email: string
}

export function EmailFormComponent<FieldValues>(props: {
  register: UseFormRegister<FieldValues>
  path: TypedFieldPath<FieldValues, EmailProps>
  errors: FieldErrors<PersonProps> | undefined
  defaultValue?: EmailProps
  locked?: boolean
  heading?: string
  sx?: SxProps<Theme>
}) {
  const { register, path, defaultValue, locked, heading } = props

  let headElem = null
  if (typeof heading !== 'undefined') {
    headElem = (
      <Box px={1}>
        <Typography variant='body2'>{heading}</Typography>
      </Box>
    )
  }
  let displayProps = {}
  if (locked ?? false) {
    displayProps = {
      ...displayProps,
      variant: 'filled',
      InputProps: { readOnly: true }
    }
  }

  const fieldProps = (field: keyof EmailProps) => {
    const error = props.errors?.[field]
    const isError = !!error
    return {
      defaultValue: defaultValue?.[field],
      placeholder: 'Co-presenter Email',
      label: 'Co-presenter Email',
      error: isError,
      helperText: error?.message,
      FormHelperTextProps: { role: isError ? 'alert' : undefined }
    }
  }

  return (
    <Box sx={props.sx}>
      {headElem}
      <Box>
        <TextField
          {...register(join(path, 'email'), {
            required: 'Required',
            pattern: {
              value: /^\S+@\S+\.\S+$/i,
              message: "This email doesn't match the expected pattern"
            }
          })}
          fullWidth
          {...fieldProps('email')}
          {...displayProps}
        />
      </Box>
    </Box>
  )
}
