import { ReactElement } from 'react'
import { Grid, Typography } from '@material-ui/core'
// import '../GLA-generic.css'

export interface OrganizerProps {
  firstName: string
  lastName: string
  description: string | ReactElement
  image?: string
  imageSide?: 'left' | 'right'
}

export const Organizer: React.FC<OrganizerProps> = (props) => {
  const direction = typeof props.imageSide !== 'undefined'
    ? (props.imageSide === 'right' ? 'row' : 'row-reverse')
    : 'row'

  let imageElem = null
  if (typeof props.image !== 'undefined') {
    const path = `/media/${props.image}`
    const image = <img src={path} alt={`${props.lastName} ${props.firstName}`} style={{ width: '90%' }} />
    imageElem = <Grid item xs={12} md={4}>{image}</Grid>
  }

  const hasImage = typeof props.image !== 'undefined'
  return (
    <div style={{ padding: '0 60px' }}>
      <Grid
        container
        key={props.lastName + '.' + props.firstName}
        className='gla-organizer-entry'
        spacing={3}
        direction={direction}
        alignItems='center'
      >
        <Grid item xs={12} md={hasImage ? 8 : 12}>
          <Typography variant='h4' className='gla-organizer-name'>{props.firstName} {props.lastName}</Typography>
          <Typography className='gla-organizer-description' component='div' variant='body1' align='justify'>{props.description}</Typography>
        </Grid>
        {imageElem}
      </Grid>
    </div>
  )
}
