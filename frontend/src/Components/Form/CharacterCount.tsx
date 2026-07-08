type CharacterCountProps = {
  current: number;
  max?: number;
  min?: number;
};

export const CharacterCount = ({ current, max, min }: CharacterCountProps) => {
  const overMax = typeof max !== 'undefined' && current > max;
  const underMin = typeof min !== 'undefined' && current < min && current > 0;
  // orange-700/red-700 (not -600) so the counter clears WCAG AA contrast
  // (4.5:1) against the form's bg-gray-100; the -600 shades sit at ~3.3/4.3:1.
  const colorClass = overMax
    ? 'text-red-700'
    : underMin
    ? 'text-orange-700'
    : 'text-gray-600';

  const countLabel =
    typeof max !== 'undefined' ? `${current} / ${max}` : `${current}`;

  const rangeLabel =
    typeof min !== 'undefined' && typeof max !== 'undefined'
      ? ` (${min}–${max})`
      : typeof min !== 'undefined'
      ? ` (min ${min})`
      : '';

  const label = `${countLabel}${rangeLabel}`;
  const ariaStatus = overMax
    ? 'too many characters'
    : underMin
    ? 'too few characters'
    : 'within the allowed range';

  const ariaLabel = `Character count: ${current}${
    typeof max !== 'undefined' ? ` of ${max}` : ''
  }${typeof min !== 'undefined' ? `; minimum ${min}` : ''}. ${ariaStatus}.`;

  // A small negative top margin closes the visual gap between the field and the
  // counter. The value matches the mb-5 wrapper in FormFieldSrv's wrapperStyles.
  return (
    <span
      className={`block text-right text-xs ${colorClass} -mt-4 mb-1`}
      aria-live='polite'
      aria-label={ariaLabel}
    >
      {label}
    </span>
  );
};
