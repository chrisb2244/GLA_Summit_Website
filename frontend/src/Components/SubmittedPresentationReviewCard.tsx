import { MySubmissionsModel } from '@/lib/databaseModels'
import { Card, Typography } from '@mui/material'

type SubmittedPresentationReviewCardProps = {
  presentationInfo: MySubmissionsModel
}

export const SubmittedPresentationReviewCard: React.FC<SubmittedPresentationReviewCardProps> = (props) => {
  const p = props.presentationInfo
  return (
    <Card>
      <Typography>{p.title}</Typography>
      <Typography>{p.abstract}</Typography>
    </Card>
  )
}
