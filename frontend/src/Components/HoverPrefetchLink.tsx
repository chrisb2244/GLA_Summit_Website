'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { ComponentProps } from 'react';
import { useHoverCapability } from './useHoverCapability';

type LinkProps = ComponentProps<typeof Link>;

interface HoverPrefetchLinkProps extends Omit<LinkProps, 'prefetch'> {
  href: Route | string;
}

/**
 * Link component that prefetches a route on hover (desktop only).
 *
 * This component detects if the device supports hover (desktop/laptop) and only
 * enables prefetching on those devices. Mobile/touch devices are excluded to
 * prevent excessive network requests during scrolling.
 *
 * Uses the custom useHoverCapability hook based on React docs patterns:
 * https://react.dev/reference/react/useSyncExternalStore#extracting-the-logic-to-a-custom-hook
 *
 * @param href - The route to navigate to
 * @param children - The link content
 * @param className - Optional CSS classes
 * @param ...props - Other Next Link props
 *
 * @example
 * <HoverPrefetchLink href="/presentations/123" className="link">
 *   View Presentation
 * </HoverPrefetchLink>
 */
export function HoverPrefetchLink({
  href,
  children,
  className,
  ...props
}: HoverPrefetchLinkProps) {
  const router = useRouter();
  const isHoverDevice = useHoverCapability();

  const handleMouseEnter = () => {
    if (isHoverDevice) {
      router.prefetch(href as string);
    }
  };

  return (
    <Link
      href={href}
      className={className}
      onMouseEnter={handleMouseEnter}
      prefetch={false}
      {...props}
    >
      {children}
    </Link>
  );
}
