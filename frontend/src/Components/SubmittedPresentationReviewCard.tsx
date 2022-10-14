import { Database } from '@/lib/sb_databaseModels'
import {
  Card,
  CardActionArea,
  CardContent,
  Collapse,
  Typography
} from '@mui/material'
import { useState } from 'react'

export type PersonInfo = {
  id: string,
  firstname: string,
  lastname: string
}

export type PresentationReviewInfo = {
  title: string,
  abstract: string,
  submitter: PersonInfo,
  presenters: PersonInfo[],
  learning_points: string,
  presentation_id: string,
  presentation_type: Database['public']['Enums']['presentation_type'],
  updated_at: string
}

type SubmittedPresentationReviewCardProps = {
  presentationInfo: PresentationReviewInfo
}

export const SubmittedPresentationReviewCard: React.FC<
  SubmittedPresentationReviewCardProps
> = (props) => {
  const getName = (person: PersonInfo) => {
    return [person.firstname, person.lastname].filter(s => s.trim().length !== 0).join(' ')
  }

  const p = props.presentationInfo
  const [expanded, setExpanded] = useState(false)
  return (
    <Card>
      <CardActionArea onClick={() => setExpanded(!expanded)}>
        <Typography>{p.title}</Typography>
        <Typography>{`Submitter: ${getName(p.submitter)}`}</Typography>
      </CardActionArea>
      <Collapse in={expanded}>
        <CardContent>
          <Typography>{`Presenters: ${p.presenters.map(getName).join(', ')}`}</Typography>
          <Typography>{p.abstract}</Typography>
        </CardContent>
      </Collapse>
    </Card>
  )
}
