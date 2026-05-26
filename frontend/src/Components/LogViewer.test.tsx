import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LogViewer, LogEntry } from './LogViewer';

vi.mock('./Utilities/TimestampSpan', () => ({
  TimestampSpan: ({ utcValue }: { utcValue: string }) => <span>{utcValue}</span>
}));

const makeEntry = (overrides: Partial<LogEntry> = {}): LogEntry => ({
  id: Math.floor(Math.random() * 100000),
  created_at: '2026-01-15T10:00:00Z',
  severity: 'info',
  message: 'Test message',
  user_id: null,
  source: 'test/source',
  context: null,
  ...overrides
});

const entries: LogEntry[] = [
  makeEntry({ id: 1, severity: 'info', message: 'Info log', source: 'ticket/create', created_at: '2026-01-15T10:00:00Z' }),
  makeEntry({ id: 2, severity: 'error', message: 'Error log', source: 'auth/signin', created_at: '2026-01-15T09:00:00Z' }),
  makeEntry({ id: 3, severity: 'severe', message: 'Severe log', source: 'ticket/create', created_at: '2026-01-15T08:00:00Z' }),
];

describe('LogViewer', () => {
  afterEach(() => cleanup());

  it('renders all entries by default', () => {
    render(<LogViewer entries={entries} />);
    expect(screen.getByText('Info log')).toBeDefined();
    expect(screen.getByText('Error log')).toBeDefined();
    expect(screen.getByText('Severe log')).toBeDefined();
  });

  it('renders severity labels in table cells', () => {
    const { container } = render(<LogViewer entries={entries} />);
    const tds = container.querySelectorAll('td:first-child');
    const severities = [...tds].map((td) => td.textContent);
    expect(severities).toContain('info');
    expect(severities).toContain('error');
    expect(severities).toContain('severe');
  });

  it('renders newest entry first', () => {
    render(<LogViewer entries={entries} />);
    const rows = screen.getAllByRole('row');
    // rows[0] is thead, rows[1] is first data row
    expect(within(rows[1]).getByText('Info log')).toBeDefined();
    expect(within(rows[2]).getByText('Error log')).toBeDefined();
    expect(within(rows[3]).getByText('Severe log')).toBeDefined();
  });

  it('applies severity colour classes', () => {
    const { container } = render(<LogViewer entries={[
      makeEntry({ id: 10, severity: 'severe', message: 'S' }),
      makeEntry({ id: 11, severity: 'error', message: 'E' }),
      makeEntry({ id: 12, severity: 'info', message: 'I' }),
    ]} />);
    const severeCells = container.querySelectorAll('.text-red-600');
    expect(severeCells.length).toBeGreaterThan(0);
  });

  it('filters to error severity only', async () => {
    render(<LogViewer entries={entries} />);
    await userEvent.click(screen.getByRole('button', { name: 'error' }));
    expect(screen.queryByText('Info log')).toBeNull();
    expect(screen.getByText('Error log')).toBeDefined();
    expect(screen.queryByText('Severe log')).toBeNull();
  });

  it('restores all entries when All is clicked', async () => {
    render(<LogViewer entries={entries} />);
    await userEvent.click(screen.getByRole('button', { name: 'error' }));
    await userEvent.click(screen.getByRole('button', { name: 'all' }));
    expect(screen.getByText('Info log')).toBeDefined();
    expect(screen.getByText('Error log')).toBeDefined();
    expect(screen.getByText('Severe log')).toBeDefined();
  });

  it('filters by source', async () => {
    render(<LogViewer entries={entries} />);
    const select = screen.getByRole('combobox');
    await userEvent.selectOptions(select, 'auth/signin');
    expect(screen.queryByText('Info log')).toBeNull();
    expect(screen.getByText('Error log')).toBeDefined();
    expect(screen.queryByText('Severe log')).toBeNull();
  });

  it('filters by text search', async () => {
    render(<LogViewer entries={entries} />);
    const searchInput = screen.getByPlaceholderText('Search messages…');
    await userEvent.type(searchInput, 'Error');
    expect(screen.queryByText('Info log')).toBeNull();
    expect(screen.getByText('Error log')).toBeDefined();
    expect(screen.queryByText('Severe log')).toBeNull();
  });

  it('shows display name when userDisplayNames is provided', () => {
    const entryWithUser = makeEntry({ id: 99, user_id: 'user-uuid-1', message: 'Named user log' });
    render(<LogViewer entries={[entryWithUser]} userDisplayNames={{ 'user-uuid-1': 'Alice B.' }} />);
    expect(screen.getByText('Alice B.')).toBeDefined();
    expect(screen.queryByText('user-uuid-1')).toBeNull();
  });

  it('shows shortened UUID when user has no display name', () => {
    const entryWithUser = makeEntry({ id: 100, user_id: 'abcdef12-9999-0000-0000-000000000000', message: 'Unknown user log' });
    render(<LogViewer entries={[entryWithUser]} userDisplayNames={{}} />);
    expect(screen.getByText('abcdef12…')).toBeDefined();
  });

  it('expands context row when entry with context is clicked', async () => {
    const entryWithCtx = makeEntry({
      id: 200,
      message: 'Has context',
      context: { errorCode: 'DB_001', detail: 'unique violation' } as never
    });
    render(<LogViewer entries={[entryWithCtx]} />);
    expect(screen.queryByText('errorCode')).toBeNull();
    await userEvent.click(screen.getByText('Has context'));
    expect(screen.getByText('errorCode')).toBeDefined();
    expect(screen.getByText('DB_001')).toBeDefined();
  });

  it('collapses context row on second click', async () => {
    const entryWithCtx = makeEntry({
      id: 201,
      message: 'Toggle context',
      context: { key: 'value' } as never
    });
    render(<LogViewer entries={[entryWithCtx]} />);
    await userEvent.click(screen.getByText('Toggle context'));
    expect(screen.getByText('key')).toBeDefined();
    await userEvent.click(screen.getByText('Toggle context'));
    expect(screen.queryByText('key')).toBeNull();
  });

  it('shows entry count', () => {
    render(<LogViewer entries={entries} />);
    expect(screen.getByText(/3.*entries/)).toBeDefined();
  });
});
