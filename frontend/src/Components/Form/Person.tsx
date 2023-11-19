import {
  UseFormRegister,
  FieldErrors,
  FieldValues,
  Path
} from 'react-hook-form';
import { FormField, FormFieldIndicator } from './FormField';

export type PersonProps = {
  firstName: string;
  lastName: string;
  email: string;
};

// Statically include these values
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const dummyClassNames = `
xs:w-1/2 xs:pr-2 xs:pl-2 xs:mr-2 xs:ml-2 xs:before:ml-[6px] xs:pl-[10px] xs:flex-row
sm:w-1/2 sm:pr-2 sm:pl-2 sm:mr-2 sm:ml-2 sm:before:ml-[6px] sm:pl-[10px] sm:flex-row
md:w-1/2 md:pr-2 md:pl-2 md:mr-2 md:ml-2 md:before:ml-[6px] md:pl-[10px] md:flex-row
lg:w-1/2 lg:pr-2 lg:pl-2 lg:mr-2 lg:ml-2 lg:before:ml-[6px] lg:pl-[10px] lg:flex-row
xl:w-1/2 xl:pr-2 xl:pl-2 xl:mr-2 xl:ml-2 xl:before:ml-[6px] xl:pl-[10px] xl:flex-row
`;

type SharedProps = {
  errors: FieldErrors<PersonProps> | undefined;
  defaultValue?: PersonProps;
  locked?: boolean;
  heading?: string;
  splitSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | null;
};

type PropsInNestedPerson<KeyName, FV extends FieldValues> = {
  register: UseFormRegister<FV>;
  path: KeyName;
} & SharedProps;

type PropsInStandalonePerson = {
  register: UseFormRegister<PersonProps>;
  path?: undefined;
} & SharedProps;

/* prettier-ignore */
type PersonTypeProps<FV extends FieldValues, K = keyof FV> =
  FV extends PersonProps
    ? PropsInStandalonePerson
    : K extends keyof FV
      ? FV[K] extends PersonProps
        ? PropsInNestedPerson<K, FV>
        : never
      : never

export function Person<FV extends FieldValues>(props: PersonTypeProps<FV>) {
  const { defaultValue, locked, heading } = props;
  const register = props.register as UseFormRegister<FV>;
  const path =
    typeof props.path !== 'undefined' ? `${String(props.path)}.` : '';
  // Default to 'md' if not specified. Allow null to prevent splitting regardless of size
  const splitSize =
    typeof props.splitSize !== 'undefined' ? props.splitSize : 'md';

  let headElem = null;
  if (typeof heading !== 'undefined') {
    headElem = (
      <div className='mb-2 px-2'>
        <span className='prose prose-sm'>{heading}</span>
      </div>
    );
  }

  const labels = {
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email'
  };

  const fieldProps = (field: keyof PersonProps) => {
    const error = props.errors?.[field];
    return {
      fieldError: error,
      defaultValue: defaultValue?.[field],
      label: labels[field]
    };
  };

  const Component = locked ? FormFieldIndicator : FormField;

  return (
    <div>
      {headElem}
      <div className={`flex flex-col ${splitSize}:flex-row`}>
        <Component
          registerReturn={register(`${path}firstName` as Path<FV>, {
            required: 'Required',
            maxLength: 80
          })}
          className={`w-full px-0 ${splitSize}:w-1/2 ${splitSize}:pr-2`}
          {...fieldProps('firstName')}
        />
        <Component
          registerReturn={register(`${path}lastName` as Path<FV>, {
            required: 'Required',
            maxLength: 100
          })}
          className={`w-full px-0 ${splitSize}:w-1/2 ${splitSize}:pl-2`}
          {...fieldProps('lastName')}
        />
      </div>
      <div>
        <Component
          registerReturn={register(`${path}email` as Path<FV>, {
            required: 'Required',
            pattern: {
              value: /^\S+@\S+\.\S+$/i,
              message: "This email doesn't match the expected pattern"
            }
          })}
          fullWidth
          {...fieldProps('email')}
        />
      </div>
    </div>
  );
}

export type EmailProps = {
  email: string;
};

export function EmailFormComponent<FV extends FieldValues>(props: {
  register: UseFormRegister<FV>;
  path?: string;
  errors: FieldErrors<EmailProps> | undefined;
  defaultValue?: EmailProps;
  locked?: boolean;
  heading?: string;
  label?: string;
}) {
  const { register, defaultValue, locked, heading, label } = props;
  const path = props.path ? `${props.path}.` : '';

  let headElem = null;
  if (typeof heading !== 'undefined') {
    headElem = (
      <div className='px-2'>
        <span className='prose prose-sm'>{heading}</span>
      </div>
    );
  }

  return (
    <div className='flex flex-1'>
      {headElem}
      <div className='flex flex-1'>
        <FormField
          registerReturn={register(`${path}email` as Path<FV>, {
            required: 'Required',
            pattern: {
              value: /^\S+@\S+\.\S+$/i,
              message: "This email doesn't match the expected pattern"
            }
          })}
          fullWidth
          fieldError={props.errors?.email}
          label={label}
          defaultValue={defaultValue?.email}
          readOnly={locked}
        />
      </div>
    </div>
  );
}
