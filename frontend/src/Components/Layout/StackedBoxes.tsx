import { Box, BoxProps, Stack } from '@mui/material'

export const StackedBoxes: React.FC<{
  stackSpacing?: number
  child_mx?: BoxProps['mx']
}> = ({ children, stackSpacing = 3, child_mx = 3 }) => {
  const isArray = Array.isArray(children)
  const childArray = isArray ? children : [children]
  return (
    <Stack maxWidth='lg'>
      {childArray.map((child, idx) => (
        <Box marginX={child_mx} key={idx} marginBottom={stackSpacing}>
          {child}
        </Box>
      ))}
    </Stack>
  )
}
