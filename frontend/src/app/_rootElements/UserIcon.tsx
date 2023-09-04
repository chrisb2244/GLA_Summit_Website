'use client'

import { SignInUpButton } from '@/Components/SigninRegistration/SignInUpButton'
import {
  User,
  createClientComponentClient
} from '@supabase/auth-helpers-nextjs'
import { WaitingIndicator } from '@/Components/Utilities/WaitingIndicator'
import { UserMenu } from '@/Components/User/UserMenu'
import { Database } from '@/lib/sb_databaseModels'
import { useEffect, useState } from 'react'
import {
  getIsOrganizer,
  getUser,
  signOut
} from '@/Components/SigninRegistration/SignInUpActions'
import { useRouter } from 'next/navigation'

export function UserIcon() {
  const [isLoading, setIsLoading] = useState(true)

  const [user, setUser] = useState<User | null>()
  const [isOrganizer, setIsOrganizer] = useState(false)

  const supabase = createClientComponentClient()
  const router = useRouter()

  const signOutClient = async () => {
    await signOut().then(() => {
      setUser(null)
      router.refresh()
    })
  }

  const updateUserClient = async () => {
    getUser()
      .then(setUser)
      .then(() => {
        setIsLoading(false)
        router.refresh()
      })
  }

  useEffect(() => {
    updateUserClient()
  }, [supabase, router])

  useEffect(() => {
    if (typeof user === 'undefined' || user === null) {
      setIsOrganizer(false)
      return
    }
    getIsOrganizer(user).then(setIsOrganizer)
  }, [user])

  const idleSpinner = <WaitingIndicator />
  const button = isLoading ? null : user == null ? (
    <SignInUpButton waitingSpinner={idleSpinner} onSignInComplete={updateUserClient}/>
  ) : (
    <UserMenu user={user} isOrganizer={isOrganizer} signOut={signOutClient} />
  )

  return (
    <div id='user' className='flex h-full flex-grow-0 pr-2'>
      {button}
    </div>
  )
}
