import { EmailProps } from '@/Components/Form/Person'
import type { FormData } from '@/Components/Form/PresentationSubmissionForm'
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography
} from '@mui/material'
import { FormRow, HorizontalDivider, buildSubmitterName } from './emailComponents'

export const FormSubmissionEmail: React.FC<{ data: FormData, headerText: JSX.Element }> = ({ data, headerText }) => {
  const submitterName = buildSubmitterName(data)
  let typeText = ''
  switch (data.presentationType) {
    case '7x7': {
      typeText = '7x7 (7 minutes)'
      break
    }
    case 'full length': {
      typeText = 'Full Length (45 minutes)'
      break
    }
    case 'panel': {
      typeText = 'Panel Discussion'
      break
    }
  }

  return (
    <Box>
      <Table>
        <TableBody>
          <TableRow>
            <TableCell sx={{ p: 0 }}>{headerText}</TableCell>
            <TableCell sx={{ p: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src='https://iuqlmccpbxtgcluccazt.supabase.co/storage/v1/object/public/public-images/GLA-logo.png?t=2022-05-20T09:06:14.131Z'
                height={80}
                width={80}
                alt='GLA logo'
              />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <Paper>
        <Box>
          <Table>
            <TableBody>
              <FormRow label='Type:' value={typeText} />
              <FormRow label='Title:' value={data.title} />
              <FormRow label='Abstract:' value={data.abstract} />
              <FormRow label='Learning points:' value={data.learningPoints} />
              <HorizontalDivider />
              <FormRow label='Submitter Name:' value={submitterName} />
              <FormRow label='Submitter Email:' value={data.submitter.email} />
              <HorizontalDivider />
              <OtherPresenterRows presenters={data.otherPresenters} />
            </TableBody>
          </Table>
        </Box>
      </Paper>
    </Box>
  )
}

const OtherPresenterRows: React.FC<{ presenters: EmailProps[] }> = ({
  presenters
}) => {
  if (presenters.length === 0) {
    return <FormRow label='Other Presenters:' value='None' />
  }
  return (
    <TableRow>
      <TableCell>
        <Typography>Other Presenters:</Typography>
      </TableCell>
      {presenters.map((p, idx) => {
        return (
          <TableRow key={`otherPresenter-${idx}`}>
            <TableCell>
              <Typography>{p.email}</Typography>
            </TableCell>
          </TableRow>
        )
      })}
    </TableRow>
  )
}
