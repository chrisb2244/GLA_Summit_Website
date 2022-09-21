import type {
  FieldError,
  FieldErrors,
  FieldValues,
  TypedFieldPath,
  UseFormRegister
} from 'react-hook-form'
import { join } from 'react-hook-form'
import { Person } from './Person'
import type { PersonProps } from './Person'
import { Box, Button, Paper } from '@mui/material'

type PersonArrayProps<FV extends FieldValues> = {
  personArray: PersonProps[]
  arrayPath: TypedFieldPath<FV, PersonProps[]>
  errors: Merge<FieldError, (Merge<FieldError, FieldErrors<PersonProps>> | undefined)[]> | undefined
  register: UseFormRegister<FV>
  removePresenter: (idx: number) => void
}

export function PersonArrayFormComponent<FV extends FieldValues>
  (props: PersonArrayProps<FV>) {
  const { personArray, errors, register, removePresenter, arrayPath } = props

  return (
    <>
      {personArray.map((p, idx) => (
        <Box pb={1} key={`person-${idx}`}>
          <Paper>
            <Box px={1} py={2}>
              <OtherPerson
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

const OtherPerson = <FV extends FieldValues,>(props: {
  idx: number
  path: TypedFieldPath<FV, PersonProps[]>
  errors: FieldErrors<PersonProps> | undefined
  register: UseFormRegister<FV>
  remove: (idx: number) => void
}) => {
  return (
    <Box
      flexDirection={{ xs: 'column', sm: 'row' }}
      display='flex'
      alignItems='center'
      justifyContent='space-between'
    >
      <Box width={{ xs: '100%', sm: '89%' }}>
        <Person
          path={join(props.path, `${props.idx}`)}
          register={props.register}
          errors={props.errors}
        />
      </Box>
      <Box width={{ xs: '100%', sm: '10%' }} textAlign='center'>
        <Button onClick={() => props.remove(props.idx)} variant='outlined'>
          Remove
        </Button>
      </Box>
    </Box>
  )
}

type Merge<A, B> = {
  [K in keyof A | keyof B]?: K extends keyof A ? K extends keyof B ? [A[K], B[K]] extends [object, object] ? Merge<A[K], B[K]> : A[K] | B[K] : A[K] : K extends keyof B ? B[K] : never;
};