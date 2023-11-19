import type {
  FieldError,
  FieldErrors,
  UseFormRegister,
  FieldValues
} from 'react-hook-form';
import { EmailFormComponent } from './Person';
import type { EmailProps } from './Person';
import { Button } from './Button';

type EmailArrayProps<
  KeyName extends keyof FV,
  FV extends Record<KeyName, EmailProps[]>
> = {
  emailArray: EmailProps[];
  arrayPath: KeyName;
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

type EmailArrayTypeProps<
  FV extends FieldValues,
  K = keyof FV
> = K extends keyof FV
  ? FV[K] extends EmailProps[]
    ? EmailArrayProps<K, FV>
    : never
  : never;

export function EmailArrayFormComponent<FV extends FieldValues>(
  props: EmailArrayTypeProps<FV>
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
        <div className='pb-2' key={`email-${idx}`}>
          <div className='bg-gray-300 p-2 shadow-md'>
            <OtherEmail
              idx={idx}
              path={arrayPath}
              errors={errors?.[idx]}
              register={register}
              remove={removePresenter}
              defaultValue={p}
              locked={locked}
            />
          </div>
        </div>
      ))}
    </>
  );
}

const OtherEmail = <
  KeyName extends keyof FV,
  FV extends Record<KeyName, EmailProps[]>
>(props: {
  idx: number;
  path: KeyName;
  errors: FieldErrors<EmailProps> | undefined;
  register: UseFormRegister<FV>;
  remove: (idx: number) => void;
  defaultValue?: EmailProps;
  locked?: boolean;
}) => {
  const hiddenIfLocked = props.locked ? 'hidden' : '';

  return (
    <div className='flex flex-col items-start justify-between sm:flex-row'>
      <div className='flex w-full flex-grow'>
        <EmailFormComponent
          path={`${String(props.path)}.[${props.idx}]`}
          register={props.register}
          errors={props.errors}
          defaultValue={props?.defaultValue}
          locked={props.locked}
        />
      </div>
      <div
        className={`ml-auto flex w-1/2 text-center sm:ml-0 sm:w-auto sm:flex-grow-0 sm:p-2 ${hiddenIfLocked}`}
      >
        <Button onClick={() => props.remove(props.idx)} fullWidth>
          Remove
        </Button>
      </div>
    </div>
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
