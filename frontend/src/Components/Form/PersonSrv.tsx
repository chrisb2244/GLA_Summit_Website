import { FieldValues } from 'react-hook-form';
import { FormField } from './FormFieldSrv';

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
  defaultValue?: PersonProps;
  locked?: boolean;
  heading?: string;
  splitSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | null;
};

type PropsInNestedPerson<KeyName, FV extends FieldValues> = {
  path: KeyName;
} & SharedProps;

type PropsInStandalonePerson = {
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
    return {
      defaultValue: defaultValue?.[field],
      label: labels[field],
      readOnly: locked
    };
  };

  return (
    <div>
      {headElem}
      <div className={`flex flex-col ${splitSize}:flex-row`}>
        <FormField
          name={`${path}firstName`}
          required={true}
          maxLength={80}
          className={`w-full px-0 ${splitSize}:w-1/2 ${splitSize}:pr-2`}
          {...fieldProps('firstName')}
        />
        <FormField
          name={`${path}lastName`}
          required={true}
          maxLength={100}
          className={`w-full px-0 ${splitSize}:w-1/2 ${splitSize}:pl-2`}
          {...fieldProps('lastName')}
        />
      </div>
      <div>
        <FormField
          name={`${path}email`}
          required={true}
          pattern='^\S+@\S+.\S+$'
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
