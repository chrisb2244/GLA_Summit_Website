import { Header } from '../Header'
import { Footer } from '../Footer'

export const AppFrame = (props: {children: React.ReactNode}) => {
  return (
    <div className='flex flex-col min-h-screen'>
      <Header />

      <div className='flex flex-auto'>
        <div className='max-w-screen-lg w-full md:w-4/5 mx-auto flex flex-col'>
          {props.children}
        </div>
      </div>

      <Footer />
    </div>
  )
}
