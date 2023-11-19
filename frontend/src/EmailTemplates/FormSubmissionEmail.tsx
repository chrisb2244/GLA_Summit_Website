import { EmailProps } from '@/Components/Form/Person';
import type { FormData } from '@/Components/Forms/PresentationSubmissionForm_old';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography
} from '@mui/material';
import {
  FormRow,
  HorizontalDivider,
  buildSubmitterName
} from './emailComponents';

export const FormSubmissionEmail: React.FC<{
  data: FormData;
  headerText: JSX.Element;
}> = ({ data, headerText }) => {
  const submitterName = buildSubmitterName(data);
  let typeText = '';
  switch (data.presentationType) {
    case '7x7': {
      typeText = '7x7 (7 minutes)';
      break;
    }
    case '15 minutes': {
      typeText = 'Short Length (15 minutes)';
      break;
    }
    case 'full length': {
      typeText = 'Full Length (45 minutes)';
      break;
    }
    case 'panel': {
      typeText = 'Panel Discussion';
      break;
    }
  }

  return (
    <Box>
      <Box>
        <Box>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src='https://iuqlmccpbxtgcluccazt.supabase.co/storage/v1/object/public/public-images/GLA-logo.png?t=2022-05-20T09:06:14.131Z'
            height={80}
            width={80}
            alt='GLA logo'
            style={{ float: 'right', padding: '5px' }}
          />
        </Box>
        {headerText}
      </Box>
      <Paper>
        <Box>
          <Table>
            <TableBody>
              <FormRow label='Type:' value={typeText} />
              <HorizontalDivider />
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
  );
};

const OtherPresenterRows: React.FC<{ presenters: EmailProps[] }> = ({
  presenters
}) => {
  const nRows = presenters.length;
  if (nRows === 0) {
    return <FormRow label='Other Presenters:' value='None' />;
  }
  const otherRows = presenters.slice(1);
  return (
    <TableRow>
      <TableCell rowSpan={nRows}>
        <Typography>Other Presenters:</Typography>
      </TableCell>
      <TableCell>
        <Typography>{presenters[0].email}</Typography>
      </TableCell>
      {otherRows.map((p, idx) => {
        return (
          <TableRow key={`otherPresenter-${idx}`}>
            <TableCell>
              <Typography>{p.email}</Typography>
            </TableCell>
          </TableRow>
        );
      })}
    </TableRow>
  );
};
