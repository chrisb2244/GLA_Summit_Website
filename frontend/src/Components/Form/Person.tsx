import { TextField } from '@mui/material';
import {
  join,
  UseFormRegister,
  TypedFieldPath,
  FieldErrors,
  FieldValues
} from 'react-hook-form';
import { FormField } from './FormField';

export type PersonProps = {
  firstName: string;
  lastName: string;
  email: string;
};

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

  const halfWidthSx = (side: 'left' | 'right', pVal = '5px') => {
    if (splitSize === null) {
      return {
        width: '100%',
        paddingBottom: 1
      };
    } else {
      return {
        width: { xs: '100%', [splitSize]: '50%' },
        paddingInlineEnd: { xs: 0, [splitSize]: side === 'left' ? pVal : 0 },
        paddingInlineStart: { xs: 0, [splitSize]: side === 'right' ? pVal : 0 },
        paddingBottom: 1
      };
    }
  };

  let headElem = null;
  if (typeof heading !== 'undefined') {
    headElem = (
      <div className='mb-2 px-2'>
        <span className='prose-sm prose'>{heading}</span>
      </div>
    );
  }
  let displayProps = {};
  if (locked ?? false) {
    displayProps = {
      ...displayProps,
      variant: 'filled',
      InputProps: { readOnly: true }
    };
  }

  const labels = {
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email'
  };

  const fieldProps = (field: keyof PersonProps) => {
    const error = props.errors?.[field];
    const isError = !!error;
    return {
      defaultValue: defaultValue?.[field],
      placeholder: labels[field],
      label: labels[field],
      error: isError,
      helperText: error?.message,
      FormHelperTextProps: { role: isError ? 'alert' : undefined }
    };
  };

  // prettier-ignore
  const splitSizeClassnames = splitSize === null ? '' : 
    splitSize === "xs" ? "xs:flex-row xs:pb-2" :
    splitSize === "sm" ? "sm:flex-row sm:pb-2" :
    splitSize === "md" ? "md:flex-row md:pb-2" :
    splitSize === "lg" ? "lg:flex-row lg:pb-2" :
    splitSize === "xl" ? "xl:flex-row xl:pb-2" :
    ''

  return (
    <div>
      {headElem}
      <div className={`flex flex-col ${splitSizeClassnames}`}>
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
      </div>
      <div>
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
