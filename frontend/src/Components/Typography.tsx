import { ReactNode } from 'react';

/**
 * Shared text primitives so list pages (presenter-list, presentation-list, …)
 * keep a uniform look without relying on an ancestral `prose` wrapper.
 *
 * Since Tailwind v4 the typography plugin's `prose` rules live in the
 * utilities layer and out-order plain margin utilities on descendants, so
 * "wrap the page in prose, cancel it with my-0 where unwanted" no longer
 * works. The pattern here is the inverse: page chrome (headings, intros) is
 * styled explicitly, and `prose` is scoped to user-authored content only.
 */

/** Year/section heading, e.g. "2024 Presenters" / "2024 Presentations". */
export const SectionHeading = ({ children }: { children: ReactNode }) => {
  return (
    <h3 className='mb-3 pt-4 pb-1 text-center text-xl font-semibold text-gray-900'>
      {children}
    </h3>
  );
};

/** Centered one-line explainer shown between the menu and the year buttons. */
export const PageIntro = ({ children }: { children: ReactNode }) => {
  return <p className='mx-auto max-w-prose text-center'>{children}</p>;
};
