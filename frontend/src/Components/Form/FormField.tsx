import { type FieldError, UseFormRegisterReturn } from 'react-hook-form';
import { type VariantProps, cva } from 'class-variance-authority';
import type { HTMLInputTypeAttribute, HTMLProps } from 'react';
import React from 'react';

// Define separately for use styling the label and the error message
const errorTextColor = 'text-red-700';
const errorTextClassName =
  'text-red-700 absolute top-0 left-2 text-sm sm:text-base';

const inputAlways = [
  'px-4 pt-3 pb-1 peer border focus-visible:outline-none',
  'border-t-0 focus:border-t-0 placeholder-shown:border-t-0',
  'text-lg border-gray-400 box-border'
].join(' ');

const inputFieldStyles = cva(inputAlways, {
  variants: {
    fullWidth: {
      true: 'w-full'
    },
    readOnly: {
      true: 'text-gray-500 bg-gray-100',
      false: 'border-b-4 focus:border-b-secondaryc'
    },
    placeholderVisible: {
      false: 'placeholder-transparent',
      undefined: 'placeholder-transparent',
      true: ''
    }
  }
});

// IMPORTANT:
// The peer selectors require that the input is before the label in the DOM.
const placeholderShownClassNames = [
  'peer-placeholder-shown:text-base',
  'peer-placeholder-shown:top-4',
  'peer-placeholder-shown:left-4',
  'before:peer-placeholder-shown:hidden'
].join(' ');

const labelAlways = [
  'absolute block z-[2] transition-all text-gray-700',
  'text-sm -top-2 left-2 px-1 peer-focus:text-gray-700',
  'peer-focus:text-sm peer-focus:-top-2 peer-focus:left-2',
  'before:w-[105%] before:absolute before:flex before:top-2',
  'before:-left-[2px] before:z-[-1]',
  'before:h-[10px] before:rounded-b before:peer-focus:w-[105%]',
  'before:peer-focus:absolute before:peer-focus:flex',
  'before:peer-focus:top-2 before:peer-focus:-left-[2px]',
  'before:peer-focus:z-[-1] before:peer-focus:bg-white',
  'before:peer-focus:h-[10px] before:peer-focus:rounded-b',
  'peer-placeholder-shown:text-gray-500'
].join(' ');

const labelStyles = cva(labelAlways, {
  variants: {
    isError: {
      true: errorTextColor
    },
    placeholderVisible: {
      true: '',
      false: placeholderShownClassNames,
      undefined: placeholderShownClassNames
    },
    readOnly: {
      true: 'before:bg-gray-100',
      false: 'before:bg-white',
      undefined: 'before:bg-white'
    }
  }
});

const wrapperStyles = cva(
  'inline-flex flex-col relative align-top mt-2 mb-5 bg-inherit overflow-x-clip',
  {
    variants: {
      fullWidth: {
        true: 'w-full'
      },
      hidden: {
        true: 'hidden'
      }
    }
  }
);

const extractSidePadding = (cname?: string) => {
  return cname
    ? cname.match(/(((xs|sm|md|lg|xl):)?p[lr]?\-[0-9]+)/g)?.reduce((s, ns) => {
        return `${s} ${ns}`;
      }, '')
    : '';
};
const calculateBorderMargin = (cname?: string) => {
  return extractSidePadding(cname)?.replaceAll(/p/g, 'm');
};
const calculateLabelPadding = (cname?: string) => {
  const rawPadding = extractSidePadding(cname);

  if (typeof rawPadding === 'undefined') {
    return '';
  }
  return rawPadding.split(' ').reduce((s, ns) => {
    const detectedLeftPaddingScale = ns.match(/((xs|sm|md|lg|xl):)pl-([0-9]+)/);
    // If not a left padding element, just add before:m for each p.
    if (detectedLeftPaddingScale === null) {
      return `${s} ${ns} ${ns.replace(/p/, 'before:m')}`;
    }
    // each scale is worth 4px
    // Need to subtract 2px from this for the before:-left-2px class...
    // and add 2px for the padding-left
    const padScale = Number.parseInt(detectedLeftPaddingScale[3]);
    const sizePrefix = detectedLeftPaddingScale[1];
    return `${s} ${sizePrefix}pl-[${
      4 * padScale + 2
    }px] ${sizePrefix}before:ml-[${4 * padScale - 2}px]`;
  }, '');
};

type VariantPropTypes = VariantProps<typeof inputFieldStyles>;

type FormProps = {
  registerReturn: UseFormRegisterReturn;
  fieldError: FieldError | undefined;
  type?: HTMLInputTypeAttribute;
  placeholder?: string;
  hidden?: boolean;
};

type FormFieldProps = FormProps &
  VariantPropTypes &
  Omit<HTMLProps<HTMLInputElement>, 'type'>;

// This provides a wrapper for the TextField, providing the error behaviour.
export const FormField: React.FC<FormFieldProps> = (props) => {
  const {
    registerReturn,
    fieldError,
    fullWidth,
    className: pCN,
    readOnly = false,
    ...inputProps
  } = props;
  // if (readOnly) {
  //   return <FormFieldIndicator {...props} />;
  // }
  const isError = typeof fieldError !== 'undefined';
  const id = registerReturn.name;
  const placeholderVisible = typeof props.placeholder !== 'undefined';

  const labelPadding = calculateLabelPadding(pCN);
  const borderMargin = calculateBorderMargin(pCN);

  // placeholder-shown implies the field is empty
  // focus should have the non-empty classNames

  // IMPORTANT:
  // The peer selectors require that the input is before the label in the DOM.
  return (
    <div
      className={`${pCN ?? ''} ${wrapperStyles({
        fullWidth,
        hidden: props.hidden
      })}`}
    >
      <input
        id={id}
        type={props.type ?? 'text'}
        className={inputFieldStyles({
          fullWidth,
          readOnly: readOnly,
          placeholderVisible
        })}
        placeholder={props.placeholder ?? id}
        {...registerReturn}
        {...inputProps}
      />
      <TopBorderElement paddingElems={borderMargin} />
      {/* <div className='bg-inherit absolute h-2 -top-2 w-24 left-2 ' aria-hidden></div>
      <div className='bg-white absolute h-2 top-0 w-24 left-2 ' aria-hidden></div> */}
      <label
        id={`${id}-label`}
        htmlFor={id}
        className={`${labelPadding} ${labelStyles({
          isError,
          placeholderVisible,
          readOnly
        })}`}
      >
        {props.label ?? id}
      </label>
      <ErrorMessage error={fieldError} />
    </div>
  );
};

type IndicatorProps = Omit<FormFieldProps, 'registerReturn'> & {
  registerReturn: Partial<Pick<FormFieldProps, 'registerReturn'>> & {
    name: string;
  };
};

export const FormFieldIndicator: React.FC<IndicatorProps> = (props) => {
  const {
    fullWidth,
    registerReturn,
    fieldError,
    className: pCN,
    ...inputProps
  } = props;

  const id = registerReturn.name;

  const labelPadding = calculateLabelPadding(pCN);
  const borderMargin = calculateBorderMargin(pCN);

  return (
    <div
      className={`${pCN} ${wrapperStyles({ fullWidth, hidden: props.hidden })}`}
    >
      <input
        id={id}
        type={props.type ?? 'text'}
        className={inputFieldStyles({
          fullWidth,
          readOnly: true
        })}
        placeholder={props.placeholder ?? id}
        readOnly
        {...registerReturn}
        {...inputProps}
      />
      <TopBorderElement paddingElems={borderMargin} />
      <label
        id={`${id}-label`}
        htmlFor={id}
        className={`${labelPadding} ${labelStyles({ readOnly: true })}`}
      >
        {props.label ?? id}
      </label>
    </div>
  );
};

type TextAreaProps = FormProps &
  VariantPropTypes &
  HTMLProps<HTMLTextAreaElement>;

export const TextArea: React.FC<TextAreaProps> = (props) => {
  const {
    registerReturn,
    fieldError,
    fullWidth,
    readOnly = false,
    ...inputProps
  } = props;
  const isError = typeof fieldError !== 'undefined';
  const id = registerReturn.name;
  const placeholderVisible = typeof props.placeholder !== 'undefined';

  return (
    <div className={wrapperStyles({ fullWidth, hidden: props.hidden })}>
      <textarea
        id={id}
        className={inputFieldStyles({
          fullWidth,
          readOnly: readOnly,
          placeholderVisible
        })}
        placeholder={props.placeholder ?? id}
        {...registerReturn}
        {...inputProps}
      />
      <TopBorderElement />
      <label
        id={`${id}-label`}
        htmlFor={id}
        className={labelStyles({ isError, placeholderVisible, readOnly })}
      >
        {props.label ?? id}
      </label>
      <ErrorMessage error={fieldError} />
    </div>
  );
};

const ErrorMessage = ({ error }: { error: FieldError | undefined }) => {
  const isError = typeof error !== 'undefined';
  return isError ? (
    <div className='relative h-0'>
      <span className={errorTextClassName} role='alert'>
        {error.message}
      </span>
    </div>
  ) : null;
};

// Element to provide a top border when the label moves upwards
const TopBorderElement = (props: { paddingElems?: string }) => {
  const className = `${
    props.paddingElems ?? ''
  } absolute left-0 right-0 top-0 h-[1px] bg-gray-400 peer-focus:block`;
  return <div className={className} aria-hidden />;
};
