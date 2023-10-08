import { Button, Typography, Box, Tabs, Tab } from '@mui/material'
import { of, useForm } from 'react-hook-form'
import { useEffect, useState } from 'react'

import { Person } from '@/Components/Form'
import type { PersonProps } from '@/Components/Form'

type FormProps = {
  defaultEntry?: PersonProps
  registered?: RegistrationType | null
  registrationFn: (data: RegistrationData) => void
}

type FormData = {
  person: PersonProps
}

export type RegistrationType = 'mentor' | 'mentee'
export type RegistrationData = {
  person: PersonProps
  type: RegistrationType
}

export const MentoringForm: React.FC<React.PropsWithChildren<FormProps>> = ({
  defaultEntry,
  registered,
  registrationFn
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm<FormData>({ mode: 'onTouched'})

  useEffect(() => {
    if (typeof defaultEntry !== 'undefined') {
      setValue('person', defaultEntry, {
        shouldTouch: true,
        shouldDirty: true
      })
    }
  }, [defaultEntry, setValue])

  const entryTypes = [
    {
      entryType: 'mentor',
      tabLabel: 'I\'d like to be a mentor!',
      confirmationResponse: 'Thank you for offering to be a mentor',
      registeredMessage: 'Thank you - you are already registered to be a mentor'
    }, 
    {
      entryType: 'mentee',
      tabLabel: 'I\'d like to receive mentorship',
      confirmationResponse: 'Thank you for your interest! We will be in touch soon!',
      registeredMessage: 'Thank you - we already received your registration of interest for mentoring'
    }
  ] as const

  const [tabIndex, setTabIndex] = useState(0)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const confirmationResponse = (
    <Box>
      <Typography>{entryTypes[tabIndex].confirmationResponse}</Typography>
    </Box>
  )

  
  const handleChange = (event: React.SyntheticEvent, newIndex: number) => {
    setTabIndex(newIndex)
  }

  if (registered !== null) {
    const msg = entryTypes.filter((eType) => eType.entryType === registered)[0].registeredMessage
    return <Box><Typography>{msg}</Typography></Box>
  } else {
    return (
      <>
      {!showConfirmation && 
        <Box>
          <Tabs value={tabIndex} onChange={handleChange} sx={{pb: 2}} variant='fullWidth'>
            {entryTypes.map((eType) => {
              return <Tab label={eType.tabLabel} key={eType.entryType} />
            })}
          </Tabs>
          <form
            onSubmit={handleSubmit(async (data) => {
              registrationFn({
                person: data.person,
                type: entryTypes[tabIndex].entryType
              })
              setShowConfirmation(true)
            })}
          >
            <Person<FormData>
              register={register}
              path={of('person')}
              errors={errors.person}
              defaultValue={defaultEntry}
              locked={typeof defaultEntry !== 'undefined'}
            />
            <Button variant='contained' type='submit' fullWidth sx={{mt: 2}}>
              Submit
            </Button>
          </form>
        </Box>
      }
      {showConfirmation && confirmationResponse}
      </>
    )
  }
}
