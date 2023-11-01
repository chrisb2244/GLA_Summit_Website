import {
  join,
  UseFormRegister,
  TypedFieldPath,
  FieldErrors,
  FieldValues
} from 'react-hook-form';
import { FormField, FormFieldIndicator } from './FormField';
import { cva } from 'class-variance-authority';

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
    const isError = !!error;
    return {
      fieldError: error,
      defaultValue: defaultValue?.[field],
      // placeholder: labels[field],
      label: labels[field],
      error: isError
      // helperText: error?.message,
      // FormHelperTextProps: { role: isError ? 'alert' : undefined }
    };
  };

  const Component = locked ? FormFieldIndicator : FormField;

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
        <Component
          registerReturn={register(join(path, 'firstName'), {
            required: 'Required',
            maxLength: 80
          })}
          className={halfWidthStyles({ splitSize, side: 'left' })}
          {...fieldProps('firstName')}
        />
        <Component
          registerReturn={register(join(path, 'lastName'), {
            required: 'Required',
            maxLength: 100
          })}
          className={halfWidthStyles({ splitSize, side: 'right' })}
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

const halfWidthStyles = cva('pb-1 w-full px-0', {
  variants: {
    side: {
      left: '',
      right: '',
      undefined: '',
      null: ''
    },
    splitSize: {
      xs: '',
      sm: '',
      md: '',
      lg: '',
      xl: ''
    }
  },
  compoundVariants: [
    {
      side: ['left', 'right'],
      splitSize: 'xs',
      class: 'xs:w-1/2'
    },
    {
      side: ['left', 'right'],
      splitSize: 'sm',
      class: 'sm:w-1/2'
    },
    {
      side: ['left', 'right'],
      splitSize: 'md',
      class: 'md:w-1/2'
    },
    {
      side: ['left', 'right'],
      splitSize: 'lg',
      class: 'lg:w-1/2'
    },
    {
      side: ['left', 'right'],
      splitSize: 'xl',
      class: 'xl:w-1/2'
    },
    {
      side: 'left',
      splitSize: 'xs',
      class: 'xs:pr-2'
    },
    {
      side: 'left',
      splitSize: 'sm',
      class: 'sm:pr-2'
    },
    {
      side: 'left',
      splitSize: 'md',
      class: 'md:pr-2'
    },
    {
      side: 'left',
      splitSize: 'lg',
      class: 'lg:pr-2'
    },
    {
      side: 'left',
      splitSize: 'xl',
      class: 'xl:pr-2'
    },
    {
      side: 'right',
      splitSize: 'xs',
      class: 'xs:pl-2'
    },
    {
      side: 'right',
      splitSize: 'sm',
      class: 'sm:pl-2'
    },
    {
      side: 'right',
      splitSize: 'md',
      class: 'md:pl-2'
    },
    {
      side: 'right',
      splitSize: 'lg',
      class: 'lg:pl-2'
    },
    {
      side: 'right',
      splitSize: 'xl',
      class: 'xl:pl-2'
    }
  ]
});
