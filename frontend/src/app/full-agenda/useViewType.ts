import { useState, useSyncExternalStore } from 'react';
type ViewMode = 'timeline' | 'list';

/** Matches the `md:` breakpoint (900px) used for the default view below. */
const WIDE_QUERY = '(min-width: 900px)';

const subscribeToWidth = (onChange: () => void) => {
  const mq = window.matchMedia(WIDE_QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
};

export const useViewType = () => {
  // `null` means "no explicit choice yet", in which case the default comes from
  // CSS. Both views are rendered and one is hidden, so the first paint is right
  // before any JavaScript runs — no flash of the wrong view on a phone.
  const [chosenView, setChosenView] = useState<ViewMode | null>(null);

  // Read during render rather than written from an effect, so the toggle's
  // aria-pressed can describe what CSS is actually showing. The server snapshot
  // assumes a wide viewport, matching the `md:` default.
  const isWide = useSyncExternalStore(
    subscribeToWidth,
    () => window.matchMedia(WIDE_QUERY).matches,
    () => true
  );
  const shownView: ViewMode = chosenView ?? (isWide ? 'timeline' : 'list');

  const visibility = (view: ViewMode) => {
    if (chosenView === null) {
      return view === 'timeline' ? 'xs:hidden md:block' : 'block md:hidden';
    }
    return chosenView === view ? 'block' : 'hidden';
  };

  return { shownView, setChosenView, visibility };
};
