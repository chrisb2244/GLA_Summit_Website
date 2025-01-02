import { type FieldError, UseFormRegisterReturn } from 'react-hook-form';
import type { HTMLInputTypeAttribute, HTMLProps } from 'react';
import {
  FormField as FormFieldSrv,
  FormFieldIndicator as FormFieldIndicatorSrv,
  TextArea as TextAreaSrv,
  type VariantPropTypes
} from './FormFieldSrv';
import React from 'react';

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
  const { registerReturn, fieldError, ...inputProps } = props;
  const { name, ...otherRegisterProps } = registerReturn;

  return (
    <FormFieldSrv
      name={name}
      error={fieldError?.message}
      {...otherRegisterProps}
      {...inputProps}
    />
  );
};

type IndicatorProps = Omit<FormFieldProps, 'registerReturn'> & {
  registerReturn: Partial<Pick<FormFieldProps, 'registerReturn'>> & {
    name: string;
  };
};

export const FormFieldIndicator: React.FC<IndicatorProps> = (props) => {
  const { registerReturn, fieldError, ...inputProps } = props;
  const { name } = registerReturn;

  return (
    <FormFieldIndicatorSrv
      {...inputProps}
      name={name}
      error={fieldError?.message}
    />
  );
};

type TextAreaProps = FormProps &
  VariantPropTypes &
  HTMLProps<HTMLTextAreaElement>;

export const TextArea: React.FC<TextAreaProps> = (props) => {
  const { registerReturn, fieldError, ...otherInputProps } = props;
  const { name, ...otherRegisterProps } = registerReturn;

  return (
    <TextAreaSrv
      name={name}
      error={fieldError?.message}
      {...otherRegisterProps}
      {...otherInputProps}
    />
  );
};
