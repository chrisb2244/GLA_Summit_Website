import { StackedBoxes } from '@/Components/Layout/StackedBoxes'
import { Typography } from '@mui/material'
import ErrorIcon from '@mui/icons-material/NoEncryptionGmailerrorredTwoTone'
import type { NextPage } from 'next'
import { useEffect, useState } from 'react'
import {
  PresentationReviewInfo,
  SubmittedPresentationReviewCard
} from '@/Components/SubmittedPresentationReviewCard'
import { Box } from '@mui/system'

const ReviewSubmissionsPage: NextPage = () => {
  const T = (props: { children: React.ReactNode }) => (
    <Typography textAlign='center'>{props.children}</Typography>
  )

  const [submittedPresentations, setSubmittedPresentations] = useState<
    PresentationReviewInfo[]
  >([])
  useEffect(() => {
    fetch('/api/presentation_submissions').then((res) => {
      res.json().then((jsonValue) => {
        const { presentationSubmissions } = jsonValue as {
          presentationSubmissions: PresentationReviewInfo[]
        }
        setSubmittedPresentations(presentationSubmissions)
      })
    })
  }, [])

  const listElems = submittedPresentations
    .sort((a, b) => {
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    })
    .map((p) => {
      return (
        <SubmittedPresentationReviewCard
          presentationInfo={p}
          key={p.presentation_id}
        />
      )
    })

  return (
    <StackedBoxes>
      <T>
        <ErrorIcon fontSize='large' sx={{ mt: 5 }} />
      </T>
      <T>{`Here's a list of ${submittedPresentations.length} presentations!!!`}</T>
      <Box sx={{ '> *': { m: 0.5, p: 0.5 } }}>{listElems}</Box>
    </StackedBoxes>
  )
}

export default ReviewSubmissionsPage
