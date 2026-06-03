import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CopyableTextBox } from './CopyableTextBox';

beforeAll(() => {
  // jsdom does not implement the async Clipboard API; provide a stub so the
  // component's navigator.clipboard.writeText path is exercised.
  Object.assign(navigator, {
    clipboard: { writeText: () => Promise.resolve() }
  });
});

afterEach(cleanup);

describe('CopyableTextBox', () => {
  it('renders its child text', () => {
    render(
      <CopyableTextBox copyString='This is test text'>
        This is test text
      </CopyableTextBox>
    );
    expect(screen.getByText('This is test text')).toBeDefined();
  });

  it('exposes the copy control with an accessible label', () => {
    render(<CopyableTextBox copyString='Blah blah'>Blah blah</CopyableTextBox>);
    expect(screen.getByRole('button', { name: 'copy' })).toBeDefined();
  });

  it('copies the copyString to the clipboard when clicked', async () => {
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');
    render(<CopyableTextBox copyString='Blah blah'>Blah blah</CopyableTextBox>);

    await userEvent.click(screen.getByRole('button', { name: 'copy' }));

    expect(writeText).toHaveBeenCalledWith('Blah blah');
    writeText.mockRestore();
  });

  it('copies a complex string verbatim, independent of the rendered children', async () => {
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');
    const copyString =
      '<a href="https://glasummit.org"> <img src="http://localhost:3000/my/file/image.png" height="100" width="300" alt="I\'m attending the GLA Summit!"> </a>';

    render(
      <CopyableTextBox copyString={copyString}>
        a rendered, human-friendly description of the snippet
      </CopyableTextBox>
    );

    await userEvent.click(screen.getByRole('button', { name: 'copy' }));

    expect(writeText).toHaveBeenCalledWith(copyString);
    writeText.mockRestore();
  });
});
