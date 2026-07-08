import { ReactNode } from 'react';

/**
 * Shared card chrome for list-page items (presenter-list, presentation-list)
 * so the two lists keep a uniform look. Extras like flex direction or
 * line-clamping stay at the call site via className.
 */
export const ListCard = ({
  className,
  children
}: {
  className?: string;
  children: ReactNode;
}) => {
  return (
    <div className={`border p-4 shadow-xs ${className ?? ''}`}>{children}</div>
  );
};
