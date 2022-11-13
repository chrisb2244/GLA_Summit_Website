import { StackedBoxes } from '@/Components/Layout/StackedBoxes'
import { Typography, Button } from '@mui/material'

const LabVIEW_Python_Page = () => {
  /*
    Jesper Kjær Sørensen
    Jim Kring
    Tatiana Boyé
    Ajay MV
    Ching-Hwa Yu
    Ajay MV

    We'll talk about LabVIEW and text-based tools like Python. 
    How to determine the best tool for the job. 
    How LabVIEW can work together with other languages. 
    And things LabVIEW developers need to be aware of when using text-based languages.
  */
  const panelists = (
    <div className='prose'>
      <ul>
        <li>Tatiana Boyé</li>
        <li>Jim Kring</li>
        <li>Ajay MV</li>
        <li>Jesper Kjær Sørensen</li>
        <li>Ching-Hwa Yu</li>
        <li>With Sam Taggart moderating discussion</li>
      </ul>
    </div>
  )

  // The Box here prevents going to the very edge on smaller screens
  return (
    <StackedBoxes>
      <Typography variant='h3' textAlign={'center'}>
        LabVIEW and Python - A Discussion
      </Typography>
      <div className='prose max-w-screen-lg mx-auto'>
        <p>
          In recent years, LabVIEW has gained better and better support for
          interoperability with some text-based languages, such as Python and
          MATLAB. At the same time, there has been public discussion around
          moving either chunks of functionality, or entire applications, into
          languages like Python.
        </p>
        <p>
          This panel will feature discussion of both LabVIEW and text-based
          languages or tools, particularly Python, and:
        </p>
        <ul>
          <li>How to determine the best tool for the job</li>
          <li>How LabVIEW can work with other languages</li>
          <li>
            Things &ldquo;LabVIEW developers&rdquo; should be aware of when
            using Python
          </li>
          <li>The experience of moving code from LabVIEW to Python</li>
        </ul>
        <p>
          To find out more, come and hear our panelists discuss these topics!
        </p>
      </div>
      {panelists}

      <div className='mx-auto'>
        <a href={'https://hopin.com/events/gla-summit-2022'}>
          <Button fullWidth variant='contained' className='bg-primaryc'>
            <Typography textAlign='center'>
              Go to the Hopin Event page
            </Typography>
          </Button>
        </a>
      </div>
      <div className='mx-auto'>
        <a href={'/full-agenda'}>
          <Button fullWidth variant='contained' className='bg-primaryc'>
            <Typography textAlign='center'>Go to the agenda</Typography>
          </Button>
        </a>
      </div>
    </StackedBoxes>
  )
}

export default LabVIEW_Python_Page
