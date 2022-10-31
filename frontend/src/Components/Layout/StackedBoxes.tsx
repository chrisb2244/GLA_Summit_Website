import type { ReactNode } from 'react'

export const StackedBoxes: React.FC<{
  children?: ReactNode
  stackSpacing?: 1.5 // fix possible values to constrain dynamic CSS - chosen based on existing use
  child_mx?: 0 | 1 | 2 | 3
}> = ({ children, stackSpacing = 3, child_mx = 3 }) => {
  const isArray = Array.isArray(children)
  const childArray = isArray ? children : [children]
  const mxName =
    child_mx === 0
      ? 'mx-0'
      : child_mx === 1
      ? 'mx-2'
      : child_mx === 2
      ? 'mx-4'
      : child_mx === 3
      ? 'mx-6'
      : ''
  const mbName = stackSpacing === 1.5 ? 'mb-3' : 'mb-6'
  return (
    <div>
      {childArray.map((child, idx) => (
        <div className={`${mbName} ${mxName} `} key={idx}>
          {child}
        </div>
      ))}
    </div>
  )
}
