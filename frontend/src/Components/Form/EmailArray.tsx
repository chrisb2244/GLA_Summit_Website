import type {
  FieldError,
  FieldErrors,
  TypedFieldPath,
  UseFormRegister
} from 'react-hook-form'
import { join } from 'react-hook-form'
import { EmailFormComponent } from './Person'
import type { EmailProps } from './Person'
import { Box, Button, Paper } from '@mui/material'

type EmailArrayProps<FieldValues> = {
  emailArray: EmailProps[]
  arrayPath: TypedFieldPath<FieldValues, EmailProps[]>
  errors:
    | Merge<
        FieldError,
        (Merge<FieldError, FieldErrors<EmailProps>> | undefined)[]
      >
    | undefined
  register: UseFormRegister<FieldValues>
  removePresenter: (idx: number) => void
}

export function EmailArrayFormComponent<FieldValues>(
  props: EmailArrayProps<FieldValues>
) {
  const {
    emailArray,
    errors,
    register,
    removePresenter,
    arrayPath
  } = props

  return (
    <>
      {emailArray.map((p, idx) => (
        <Box pb={1} key={`email-${idx}`}>
          <Paper>
            <Box px={1} py={2}>
              <OtherEmail
                idx={idx}
                path={arrayPath}
                errors={errors?.[idx]}
                register={register}
                remove={removePresenter}
              />
            </Box>
          </Paper>
        </Box>
      ))}
    </>
  )
}

const OtherEmail = <FieldValues,>(props: {
  idx: number
  path: TypedFieldPath<FieldValues, EmailProps[]>
  errors: FieldErrors<EmailProps> | undefined
  register: UseFormRegister<FieldValues>
  remove: (idx: number) => void
}) => {
  return (
    <Box
      flexDirection={{ xs: 'column', sm: 'row' }}
      display='flex'
      alignItems='center'
      justifyContent='space-between'
    >
      <Box flexGrow={1} width='100%'>
        <EmailFormComponent
          path={join(props.path, `${props.idx}`)}
          register={props.register}
          errors={props.errors}
        />
      </Box>
      <Box flexGrow={0} p={1} textAlign='center'>
        <Button onClick={() => props.remove(props.idx)} variant='outlined'>
          Remove
        </Button>
      </Box>
    </Box>
  )
}

type Merge<A, B> = {
  [K in keyof A | keyof B]?: K extends keyof A
    ? K extends keyof B
      ? [A[K], B[K]] extends [object, object]
        ? Merge<A[K], B[K]>
        : A[K] | B[K]
      : A[K]
    : K extends keyof B
    ? B[K]
    : never
}
