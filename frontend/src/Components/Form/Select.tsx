import { VariantProps, cva } from 'class-variance-authority';
import { ForwardedRef, HTMLProps, forwardRef } from 'react';

type Option = {
  key: string;
  description: string;
};

type SelectProps = {
  options: Option[];
};

type ExtendedSelectProps = SelectProps &
  HTMLProps<HTMLSelectElement> &
  VariantProps<typeof selectStyles>;

export const Select = forwardRef(
  (props: ExtendedSelectProps, ref: ForwardedRef<HTMLSelectElement>) => {
    const { options, fullWidth, ...inputProps } = props;
    const optionElements = options.map(({ key, description }) => {
      return (
        <option key={key} value={key}>
          {description}
        </option>
      );
    });
    return (
      <select {...inputProps} className={selectStyles({ fullWidth })}>
        {optionElements}
      </select>
    );
  }
);
Select.displayName = 'Select';

const selectStyles = cva('border border-gray-400 box-border p-2', {
  variants: {
    fullWidth: {
      true: 'w-full'
    }
  }
});
