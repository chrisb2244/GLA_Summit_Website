import { Dialog } from '@mui/material'
import { useForm } from 'react-hook-form'

type UserRegistrationProps = {
  open: boolean
  setClosed: () => void
}

export const NewUserRegistration: React.FC<UserRegistrationProps> = (props) => {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm()
  const onSubmit = (data: any) => console.log(data)
  // console.log(errors)

  return (
    <Dialog open={props.open} onClose={props.setClosed}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input
          type="text" aria-label='First name'
          placeholder="First name"
          {...register('First name', { required: true, maxLength: 80 })}
        />
        <input
          type="text"
          placeholder="Last name"
          {...register('Last name', { required: true, maxLength: 100 })}
        />
        <input
          type="text"
          placeholder="Email"
          {...register('Email', { required: true, pattern: /^\S+@\S+$/i })}
        />

        <input type="submit" />
      </form>
    </Dialog>
  )
}
