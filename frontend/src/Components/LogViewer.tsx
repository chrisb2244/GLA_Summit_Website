'use client';

import { Database } from "@/lib/sb_databaseModels"
import { Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material"

type LogProps = {
  entries: LogEntry[]
}

export type LogEntry = Database['public']['Tables']['log']['Row']

export const LogViewer: React.FC<React.PropsWithChildren<LogProps>> = ({entries}) => {

  const severityColorMap = {
    'severe': 'red',
    'error': 'black',
    'info': 'lightgrey'
  } as const

  const createRow = (e: LogEntry) => {
    const c1 = <Typography color={severityColorMap[e.severity]}>{e.severity}</Typography>
    const c2 = [e.message, e.user_id].map((v, idx) => <Typography key={`${e.id}_c_content_${idx}`}>{v}</Typography>)
    const c3 = <Typography>{new Date(e.created_at).toLocaleString()}</Typography>

    const cells = [c1, c2, c3].flat().map((c, idx) => {
      return <TableCell key={`${e.id}_${idx}`}>{c}</TableCell>
    })
    return (
      <TableRow key={e.id}>
        {cells}
      </TableRow>
    )
  }

  // Make the list longer...
  /* const sourceEntries = entries.map((e) => {
    return new Array(20).fill(0).map((_, innerIdx) => {
      return {...e, id: (e.id*20 + innerIdx)}
    })
  })
  .flat() */

  const sourceEntries = entries
  const tableRows = sourceEntries.sort((a, b) => {
    const db = new Date(b.created_at).getTime()
    const da = new Date(a.created_at).getTime()
    return db-da
  }).map(e => createRow(e))

  return (
    <Table>
      <TableHead>
        <TableRow>
          {
            ['Severity', 'Message', 'User ID', 'Created At'].map((h, idx) => {
              return <TableCell key={`headercell_${idx}`}>{h}</TableCell>
            })
          }
        </TableRow>
      </TableHead>
      <TableBody>
        {tableRows}
      </TableBody>
    </Table>
  )
}
