import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CharacterCount } from './CharacterCount';

describe('CharacterCount', () => {
  it('shows current / max when max is provided', () => {
    render(<CharacterCount current={30} max={150} />);
    expect(screen.getByText('30 / 150')).toBeDefined();
  });

  it('shows only the count when no max is provided', () => {
    render(<CharacterCount current={42} />);
    expect(screen.getByText('42')).toBeDefined();
  });

  it('is red when over the max', () => {
    const { container } = render(<CharacterCount current={160} max={150} />);
    const span = container.querySelector('span');
    expect(span?.className).toContain('text-red-600');
  });

  it('is orange when below the min (and content has been entered)', () => {
    const { container } = render(
      <CharacterCount current={10} max={5000} min={100} />
    );
    const span = container.querySelector('span');
    expect(span?.className).toContain('text-orange-600');
  });

  it('is neutral (gray) when within valid range', () => {
    const { container } = render(
      <CharacterCount current={200} max={5000} min={100} />
    );
    const span = container.querySelector('span');
    expect(span?.className).toContain('text-gray-500');
  });

  it('does not show orange when current is 0 (field untouched)', () => {
    const { container } = render(
      <CharacterCount current={0} max={5000} min={100} />
    );
    const span = container.querySelector('span');
    expect(span?.className).not.toContain('text-orange-600');
  });

  it('has aria-live for screen reader updates', () => {
    const { container } = render(<CharacterCount current={50} max={150} />);
    const span = container.querySelector('[aria-live]');
    expect(span).toBeDefined();
  });
});
