import type { ReactNode } from 'react'

type spacing = 0 | 1 | 2 | 3;

export const StackedBoxes: React.FC<{
  children?: ReactNode
  stackSpacing?: 1.5 // fix possible values to constrain dynamic CSS - chosen based on existing use
  child_mx?: spacing | { xs?: spacing, sm?: spacing, md?: spacing, lg?: spacing, xl?: spacing }
}> = ({ children, stackSpacing = 3, child_mx = 3 }) => {
  const isArray = Array.isArray(children)
  const childArray = isArray ? children : [children]
  const spacingToString = (s: spacing) => {
    return s === 0 
      ? 'mx-0'
      : s === 1
      ? 'mx-2'
      : s === 2
      ? 'mx-4'
      : s === 3
      ? 'mx-6'
      : ''
  }
  const structSpacingToString = (s: { xs?: spacing, sm?: spacing, md?: spacing, lg?: spacing, xl?: spacing }) => {
    const xsStr = s.xs ? 'xs:' + spacingToString(s.xs) : '';
    const smStr = s.sm ? 'xs:' + spacingToString(s.sm) : '';
    const mdStr = s.md ? 'xs:' + spacingToString(s.md) : '';
    const lgStr = s.lg ? 'xs:' + spacingToString(s.lg) : '';
    const xlStr = s.xl ? 'xs:' + spacingToString(s.xl) : '';
    return [xsStr, smStr, mdStr, lgStr, xlStr].join(' ');
  }
  const mxName =
    typeof child_mx === 'object'
      ? structSpacingToString(child_mx)
      : spacingToString(child_mx)

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
