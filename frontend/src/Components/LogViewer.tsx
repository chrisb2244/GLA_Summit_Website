'use client';

import React, { useState } from 'react';
import { Database } from '@/lib/sb_databaseModels';
import { TimestampSpan } from './Utilities/TimestampSpan';

export type LogEntry = Database['public']['Tables']['log']['Row'];

type LogViewerProps = {
  entries: LogEntry[];
  userDisplayNames?: Record<string, string>;
};

const SEVERITY_COLOURS = {
  severe: 'text-red-600 font-semibold',
  error: 'text-black',
  info: 'text-gray-400'
} as const;

type SeverityFilter = 'all' | 'info' | 'error' | 'severe';

export const LogViewer: React.FC<LogViewerProps> = ({
  entries,
  userDisplayNames = {}
}) => {
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [sourceFilter, setSourceFilter] = useState('');
  const [textSearch, setTextSearch] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const distinctSources = [...new Set(entries.map((e) => e.source).filter((s): s is string => s !== null))].sort();

  const filtered = entries
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .filter((e) => severityFilter === 'all' || e.severity === severityFilter)
    .filter((e) => sourceFilter === '' || e.source === sourceFilter)
    .filter((e) => textSearch === '' || e.message.toLowerCase().includes(textSearch.toLowerCase()));

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const resolveUser = (userId: string | null) => {
    if (!userId) return '—';
    return userDisplayNames[userId] ?? userId.slice(0, 8) + '…';
  };

  const renderContextCell = (entry: LogEntry) => {
    const isExpanded = expandedIds.has(entry.id);
    if (!entry.context) return null;
    if (!isExpanded) return null;
    const pairs = Object.entries(entry.context as Record<string, unknown>).filter(
      ([, v]) => v !== null && v !== undefined && v !== ''
    );
    return (
      <tr key={`${entry.id}_ctx`} className='bg-gray-50'>
        <td />
        <td colSpan={4} className='px-2 pb-2 text-xs text-gray-600'>
          <dl className='grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5'>
            {pairs.map(([k, v]) => (
              <React.Fragment key={k}>
                <dt className='font-mono text-gray-500'>{k}</dt>
                <dd className='font-mono break-all'>{String(v)}</dd>
              </React.Fragment>
            ))}
          </dl>
        </td>
      </tr>
    );
  };

  return (
    <div className='w-full min-w-0'>
      <div className='sticky top-0 z-10 flex flex-wrap items-center gap-3 bg-white px-2 pb-3 pt-16'>
        <div className='flex gap-1'>
          {(['all', 'info', 'error', 'severe'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSeverityFilter(s)}
              className={`rounded px-2 py-1 text-sm capitalize ${
                severityFilter === s
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className='rounded border border-gray-200 px-2 py-1 text-sm'
        >
          <option value=''>All sources</option>
          {distinctSources.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <input
          type='search'
          placeholder='Search messages…'
          value={textSearch}
          onChange={(e) => setTextSearch(e.target.value)}
          className='rounded border border-gray-200 px-2 py-1 text-sm w-48'
        />
        <span className='ml-auto text-xs text-gray-400'>{filtered.length} entries</span>
      </div>
      <table className='w-full table-fixed text-sm'>
        <colgroup>
          <col className='w-[8%]' />
          <col className='w-[47%]' />
          <col className='w-[20%]' />
          <col className='w-[12%]' />
          <col className='w-[13%]' />
        </colgroup>
        <thead>
          <tr>
            {['Severity', 'Message', 'Source', 'User', 'Time'].map((h) => (
              <th key={h} className='bg-white p-2 text-left font-normal text-gray-500'>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((e) => {
            const hasContext = e.context !== null && typeof e.context === 'object';
            const isExpanded = expandedIds.has(e.id);
            return (
              <React.Fragment key={e.id}>
                <tr
                  onClick={hasContext ? () => toggleExpand(e.id) : undefined}
                  className={hasContext ? 'cursor-pointer hover:bg-gray-50' : ''}
                >
                  <td className={`p-2 ${SEVERITY_COLOURS[e.severity]}`}>
                    {e.severity}
                  </td>
                  <td className='p-2 break-words'>
                    <span>{e.message}</span>
                    {hasContext && (
                      <span className='ml-1 text-xs text-gray-400'>
                        {isExpanded ? '▲' : '▼'}
                      </span>
                    )}
                  </td>
                  <td className='p-2 font-mono text-xs text-gray-500 break-all'>{e.source ?? '—'}</td>
                  <td className='p-2 text-xs text-gray-500'>{resolveUser(e.user_id)}</td>
                  <td className='p-2 text-xs text-gray-400'>
                    <TimestampSpan
                      utcValue={e.created_at}
                      dateFormat={{ year: 'numeric', month: '2-digit', day: '2-digit' }}
                    />
                  </td>
                </tr>
                {renderContextCell(e)}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
