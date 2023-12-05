import { cva } from 'class-variance-authority';
import {
  forwardRef,
  type ChangeEvent,
  type HTMLProps,
  ForwardedRef
} from 'react';

type CheckboxProps = {
  name: string;
  label?: string;
  onChange?: (ev: ChangeEvent<HTMLInputElement>) => void;
};

// Omit specially-handled properties
// Omit readOnly, which is difficult to handle for a Checkbox
//  (this prevents passing it and being surprised by the results).
type ExtendedCheckboxProps = CheckboxProps &
  Omit<
    HTMLProps<HTMLInputElement>,
    'type' | 'id' | 'label' | 'onChange' | 'readOnly'
  >;

export const Checkbox = forwardRef(
  (props: ExtendedCheckboxProps, ref: ForwardedRef<HTMLInputElement>) => {
    const {
      name: id,
      label,
      className: passedClassName,
      ...inputProps
    } = props;

    return (
      <div
        className={`${
          passedClassName ?? ''
        } flex flex-row items-center space-x-1 hover:outline-primaryc`}
      >
        <input
          type='checkbox'
          id={id}
          name={id}
          className={inputStyles({})}
          ref={ref}
          {...inputProps}
        />
        <label id={`${id}-label`} htmlFor={id} className={'mr-2'}>
          {label ?? id}
        </label>
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';

const inputStyles = cva('h-6 w-6 flex-shrink-0 m-2 accent-secondaryc', {
  variants: {}
});
