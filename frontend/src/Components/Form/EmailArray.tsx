import type {
  FieldError,
  FieldErrors,
  FieldValues,
  TypedFieldPath,
  UseFormRegister
} from 'react-hook-form';
import { join } from 'react-hook-form';
import { EmailFormComponent } from './Person';
import type { EmailProps } from './Person';
import { Box, Button, Paper } from '@mui/material';

type EmailArrayProps<FV extends FieldValues> = {
  emailArray: EmailProps[];
  arrayPath: TypedFieldPath<FV, EmailProps[]>;
  errors:
    | Merge<
        FieldError,
        (Merge<FieldError, FieldErrors<EmailProps>> | undefined)[]
      >
    | undefined;
  register: UseFormRegister<FV>;
  removePresenter: (idx: number) => void;
  locked?: boolean;
  // defaultValue?: Partial<EmailProps[]>
};

export function EmailArrayFormComponent<FV extends FieldValues>(
  props: EmailArrayProps<FV>
) {
  const {
    emailArray,
    errors,
    register,
    removePresenter,
    arrayPath,
    locked = false
  } = props;

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
                defaultValue={p}
                locked={locked}
              />
            </Box>
          </Paper>
        </Box>
      ))}
    </>
  );
}

const OtherEmail = <FV extends FieldValues>(props: {
  idx: number;
  path: TypedFieldPath<FV, EmailProps[]>;
  errors: FieldErrors<EmailProps> | undefined;
  register: UseFormRegister<FV>;
  remove: (idx: number) => void;
  defaultValue?: EmailProps;
  locked?: boolean;
}) => {
  const hideIfLocked = props.locked ? { display: 'none' } : {};

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
          defaultValue={props?.defaultValue}
          locked={props.locked}
        />
      </Box>
      <Box flexGrow={0} p={1} textAlign='center' {...hideIfLocked}>
        <Button onClick={() => props.remove(props.idx)} variant='outlined'>
          Remove
        </Button>
      </Box>
    </Box>
  );
};

type Merge<A, B> = {
  [K in keyof A | keyof B]?: K extends keyof A
    ? K extends keyof B
      ? [A[K], B[K]] extends [object, object]
        ? Merge<A[K], B[K]>
        : A[K] | B[K]
      : A[K]
    : K extends keyof B
    ? B[K]
    : never;
};
