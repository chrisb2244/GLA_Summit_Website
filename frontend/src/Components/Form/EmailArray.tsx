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
import { Button } from './Button';

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

const OtherEmail = <FV extends FieldValues>(props: {
  idx: number;
  path: TypedFieldPath<FV, EmailProps[]>;
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
          path={join(props.path, `${props.idx}`)}
          register={props.register}
          errors={props.errors}
          defaultValue={props?.defaultValue}
          locked={props.locked}
        />
      </div>
      <div className={`flex flex-grow-0 p-2 text-center ${hiddenIfLocked}`}>
        <Button onClick={() => props.remove(props.idx)}>Remove</Button>
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
