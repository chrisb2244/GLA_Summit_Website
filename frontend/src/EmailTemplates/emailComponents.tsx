import { TableCell, TableRow, Typography, TypographyProps } from '@mui/material'
import type { FormData } from '@/Components/Form/PresentationSubmissionForm'

export type Recipient = {
  email: string
  firstName?: string
  lastName?: string
}

export const FormRow: React.FC<{ label: string; value: string }> = ({
  label,
  value
}) => {
  return (
    <TableRow>
      <TableCell sx={{ width: '1px', whiteSpace: 'nowrap' }}>
        <Typography>{label}</Typography>
      </TableCell>
      <TableCell>
        <Typography sx={{ whiteSpace: 'pre-line' }}>{value}</Typography>
      </TableCell>
    </TableRow>
  )
}

export const HorizontalDivider: React.FC = () => {
  return (
    <TableRow
      sx={{
        borderWidth: 2,
        // borderColor: 'secondary.main',
        borderStyle: 'solid'
      }}
    />
  )
}

export const P: React.FC<TypographyProps> = ({ children, ...props }) => (
  <Typography {...props}>{children}</Typography>
)

export const buildSubmitterName = (data: FormData) => {
  return `${data.submitter.firstName} ${data.submitter.lastName}`
}