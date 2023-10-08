import { Database } from '@/lib/sb_databaseModels'
import { TimestampSpan } from './Utilities/TimestampSpan'

type LogProps = {
  entries: LogEntry[]
}

export type LogEntry = Database['public']['Tables']['log']['Row']

export const LogViewer: React.FC<React.PropsWithChildren<LogProps>> = ({
  entries
}) => {
  const severityColorMap = {
    severe: 'text-red-600',
    error: 'text-black',
    info: 'text-gray-400'
  } as const

  const createRow = (e: LogEntry) => {
    const c1 = (
      <div className={`${severityColorMap[e.severity]} text-center`}>
        {e.severity}
      </div>
    )
    const c2 = [
      <div key={`${e.id}_c_content_0`} className='text-base'>
        {e.message}
      </div>,
      <div key={`${e.id}_c_content_1`} className='text-sm'>
        {e.user_id}
      </div>
    ]
    const c3 = (
      <TimestampSpan
        utcValue={e.created_at}
        dateFormat={{ year: 'numeric', month: '2-digit', day: '2-digit' }}
      />
    )

    const cells = [c1, c2, c3].flat().map((c, idx) => {
      return <td key={`${e.id}_${idx}`} className='p-2'>{c}</td>
    })
    return (
      <>
        <tr key={e.id}>{cells}</tr>
      </>
    )
  }

  const sourceEntries = entries
  const tableRows = sourceEntries
    .sort((a, b) => {
      const db = new Date(b.created_at).getTime()
      const da = new Date(a.created_at).getTime()
      return db - da
    })
    .map((e) => createRow(e))

  return (
    <table className='relative'>
      <thead>
        <tr>
          {['Severity', 'Message', 'User ID', 'Created At'].map((h, idx) => {
            return <th key={`headercell_${idx}`} className='p-2 font-normal sticky top-0 pt-16 mb-2 bg-white'>{h}</th>
          })}
        </tr>
      </thead>
      <tbody>{tableRows}</tbody>
    </table>
  )
}
