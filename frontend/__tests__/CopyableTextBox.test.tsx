import { fireEvent, render, screen } from '@testing-library/react'
import { CopyableTextBox } from '@/Components/CopyableTextBox'

describe('CopyableTextBox', () => {
  it('has note role', () => {
    render(<CopyableTextBox role='note' fill='lightgrey'/>)
    expect(screen.getByRole('note')).toBeDefined()
  })

  it('contains child text', () => {
    render(
      <CopyableTextBox>
        This is test text
      </CopyableTextBox>
    )
    expect(screen.getByText('This is test text')).toBeVisible()
  })

  it('provides a copy overlay on hover', () => {
    render(<CopyableTextBox>Blah blah</CopyableTextBox>)
    fireEvent.mouseOver(screen.getByText('Blah blah'))

    expect(screen.getByLabelText('copy')).toBeVisible()
  })

  it('does not have overlay without hover', () => {
    render(<CopyableTextBox>Blah blah</CopyableTextBox>)
    expect(screen.queryByLabelText('copy')).not.toBeVisible()
  })

  it('hides the hover when mouse leaves', () => {
    render(<CopyableTextBox>Blah blah</CopyableTextBox>)
    const box = screen.getByText('Blah blah')
    fireEvent.mouseOver(box)
    expect(screen.getByLabelText('copy')).toBeVisible()
    fireEvent.mouseLeave(box)
    expect(screen.getByLabelText('copy')).not.toBeVisible()
  })

  it('calls copy function when clicked', () => {
    // Set up clipboard mock
    Object.assign(navigator, {
      clipboard: {
        writeText: () => {}
      }
    })
    const copyFunction = jest.spyOn(navigator.clipboard, 'writeText')

    render(<CopyableTextBox>Blah blah</CopyableTextBox>)
    const box = screen.getByText('Blah blah')
    fireEvent.mouseOver(box)

    const button = screen.getByLabelText('copy')
    fireEvent.click(button)
    
    expect(copyFunction).toBeCalledWith('Blah blah')
  })

  it('calls copy function when clicked - more complex', () => {
    // Set up clipboard mock
    Object.assign(navigator, {
      clipboard: {
        writeText: () => {}
      }
    })
    const copyFunction = jest.spyOn(navigator.clipboard, 'writeText')

    const hostname = 'http://localhost:3000'
    const SignatureImage = {
      src: '/my/file/image.png'
    }
    const textBox = <CopyableTextBox role='note'>
      &lt;a href=&quot;https://glasummit.org&quot;&gt;
      &lt;img src=&quot;{hostname + SignatureImage.src}&quot;
      height=&quot;100&quot;
      width=&quot;300&quot;
      alt=&quot;I&apos;m attending the GLA Summit!&quot;&gt;
      &lt;/a&gt;
    </CopyableTextBox>

    render(textBox)
    const box = screen.getByRole('note')
    fireEvent.mouseOver(box)

    const button = screen.getByLabelText('copy')
    fireEvent.click(button)
    
    expect(copyFunction).toBeCalledWith('<a href="https://glasummit.org"> <img src="http://localhost:3000/my/file/image.png" height="100" width="300" alt="I\'m attending the GLA Summit!"> </a>')
  })
})
