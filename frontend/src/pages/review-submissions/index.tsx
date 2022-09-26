import { StackedBoxes } from '@/Components/Layout/StackedBoxes'
import { Typography } from '@mui/material'
import ErrorIcon from '@mui/icons-material/NoEncryptionGmailerrorredTwoTone';
import type { NextPage } from 'next'
import { useEffect, useState } from 'react';
import { MySubmissionsModel } from '@/lib/databaseModels';
import { SubmittedPresentationReviewCard } from '@/Components/SubmittedPresentationReviewCard';
import { Box } from '@mui/system';

const ReviewSubmissionsPage: NextPage = () => {
  const T: React.FC = ({children}) => <Typography textAlign='center'>{children}</Typography>

  const [submittedPresentations, setSubmittedPresentations] = useState<MySubmissionsModel[]>([])
  useEffect(() => {
    fetch('/api/presentation_submissions').then((res) => {
      res.json().then((jsonValue) => {
        const { presentationSubmissions } = jsonValue as { presentationSubmissions: MySubmissionsModel[]}
        console.log(jsonValue)
        console.log(presentationSubmissions)
        setSubmittedPresentations(presentationSubmissions)
      })
    })
  }, [])

  const listElems = submittedPresentations.map(p => {
    // <ListItem key={p.presentation_id}>
    //   <Typography variant = 'h4'>{p.title}</Typography>
    //   <Typography>{p.abstract}</Typography>
    // </ListItem>
    return <SubmittedPresentationReviewCard presentationInfo={p} key={p.presentation_id} />
  })

  return (
    <StackedBoxes>
      <T><ErrorIcon fontSize='large' sx={{mt: 5}}/></T>
      <T>{`Here's a list of ${submittedPresentations.length} presentations!!!`}</T>
      <Box>
        {listElems}
      </Box>
    </StackedBoxes>
  )
}

export default ReviewSubmissionsPage
