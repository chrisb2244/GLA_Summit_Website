import { StackedBoxes } from '@/Components/Layout/StackedBoxes'
import { mdiAlertCircle } from '@mdi/js'
import Icon from '@mdi/react'

const AccessDeniedPage = () => {
  const T = (props: { children: string }) => {
    return <p className='text-center'>{props.children}</p>
  }

  return (
    <StackedBoxes>
      <div className='flex justify-center'>
        <Icon path={mdiAlertCircle} size={2} />
      </div>
      <T>You do not have access to this page.</T>
      <T>
        If you believe you should have access, please check you are signed in,
        and with the correct account.
      </T>
      <T>If you still cannot access this page, contact web@glasummit.org</T>
    </StackedBoxes>
  )
}

export default AccessDeniedPage
