import {
  join,
  UseFormRegister,
  TypedFieldPath,
  FieldErrors,
  FieldValues
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

export function Person<FV extends FieldValues>(props: {
  register: UseFormRegister<FV>;
  path: TypedFieldPath<FV, PersonProps>;
  errors: FieldErrors<PersonProps> | undefined;
  defaultValue?: PersonProps;
  locked?: boolean;
  heading?: string;
  splitSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | null;
}) {
  const { register, path, defaultValue, locked, heading } = props;
  // Default to 'md' if not specified. Allow null to prevent splitting regardless of size
  const splitSize =
    typeof props.splitSize !== 'undefined' ? props.splitSize : 'md';

  let headElem = null;
  if (typeof heading !== 'undefined') {
    headElem = (
      <div className='mb-2 px-2'>
        <span className='prose-sm prose'>{heading}</span>
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
          registerReturn={register(join(path, 'firstName'), {
            required: 'Required',
            maxLength: 80
          })}
          className={`w-full px-0 ${splitSize}:w-1/2 ${splitSize}:pr-2`}
          {...fieldProps('firstName')}
        />
        <Component
          registerReturn={register(join(path, 'lastName'), {
            required: 'Required',
            maxLength: 100
          })}
          className={`w-full px-0 ${splitSize}:w-1/2 ${splitSize}:pl-2`}
          {...fieldProps('lastName')}
        />
      </div>
      <div>
        <Component
          registerReturn={register(join(path, 'email'), {
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
  path: TypedFieldPath<FV, EmailProps>;
  errors: FieldErrors<PersonProps> | undefined;
  defaultValue?: EmailProps;
  locked?: boolean;
  heading?: string;
}) {
  const { register, path, defaultValue, locked, heading } = props;

  let headElem = null;
  if (typeof heading !== 'undefined') {
    headElem = (
      <div className='px-2'>
        <span className='prose-sm prose'>{heading}</span>
      </div>
    );
  }

  const fieldProps = (field: keyof EmailProps) => {
    const error = props.errors?.[field];
    return {
      defaultValue: defaultValue?.[field],
      label: 'Co-presenter Email',
      fieldError: error,
      helperText: error?.message
    };
  };

  return (
    <div>
      {headElem}
      <div>
        <FormField
          registerReturn={register(join(path, 'email'), {
            required: 'Required',
            pattern: {
              value: /^\S+@\S+\.\S+$/i,
              message: "This email doesn't match the expected pattern"
            }
          })}
          fullWidth
          {...fieldProps('email')}
          readOnly={locked}
        />
      </div>
    </div>
  );
}
