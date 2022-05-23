import { PresentationSubmissionsModel } from '@/lib/databaseModels'
import {
  Card,
  CardContent,
  CardHeader,
  Collapse,
  IconButton,
  IconButtonProps,
  Typography
} from '@mui/material'
import { useState } from 'react'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

type PresentationEditorProps = {
  presentation: PresentationSubmissionsModel
}

export const PresentationEditor: React.FC<PresentationEditorProps> = ({
  presentation
}) => {
  const [expanded, setExpanded] = useState(false)
  const handleExpandClick = () => setExpanded(!expanded)

  return (
    <Card>
      <CardHeader
        title={presentation.title}
        action={
          <ExpandMore
            expand={expanded}
            onClick={handleExpandClick}
            aria-expanded={expanded}
            aria-label='show more'
          >
            <ExpandMoreIcon />
          </ExpandMore>
        }
      />
      <Collapse in={expanded} timeout='auto' unmountOnExit>
        <CardContent>
          <Typography>Abstract: {presentation.abstract}</Typography>
        </CardContent>
      </Collapse>
    </Card>
  )
}

interface ExpandMoreProps extends IconButtonProps {
  expand: boolean
}

const ExpandMore: React.FC<ExpandMoreProps> = ({ expand, ...other }) => {
  return (
    <IconButton
      {...other}
      sx={{
        transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
        marginLeft: 'auto'
      }}
    />
  )
}
