import { Box, Stack } from '@mui/material'

export const StackedBoxes: React.FC<{stackSpacing?: number}> = ({ children, stackSpacing = 3 }) => {
  const isArray = Array.isArray(children)
  const childArray = isArray ? children : [children]
  return (
    <Stack marginBottom={2} maxWidth='lg'>
      {childArray.map((child, idx) => (
        <Box marginX={3} key={idx} marginBottom={stackSpacing}>
          {child}
        </Box>
      ))}
    </Stack>
  )
}
