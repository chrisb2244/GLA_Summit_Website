export type PresentationSlot = {
  startTime: Date;
  endTime: Date;
  duration: number;
  title: string;
  link: string;
}

export type AgendaPresentationProps = {
  presentations: PresentationSlot[]
  agendaArea: DOMRect
  currentTime: Date
  offsetFraction: number
  extentInHours: number
}

export const AgendaPresentations = (props: AgendaPresentationProps) => {
  const currentExtent = props.extentInHours * 60 * 60 * 1000
  const itemsToRender = props.presentations
    .map((p, idx, arr) => {
      const tableHeight = props.agendaArea.height
      const tableWidth = props.agendaArea.width

      const timeUntil = p.startTime.getTime() - props.currentTime.getTime()
      const timeSince = props.currentTime.getTime() - p.endTime.getTime()
      if (
        timeUntil > (currentExtent * 11) / 12 ||
        timeSince > (currentExtent * 1) / 12
      ) {
        // Out of view, don't render
        return null
      }
      const relOffset = 1 / 12
      const relStart = timeUntil / currentExtent + relOffset
      const relEnd = (-1 * timeSince) / currentExtent + relOffset
      const presentationHeight = (relEnd - relStart) * tableHeight
      const overlappingPresentations = arr.filter(
        (a) =>
          a.startTime.getTime() < p.endTime.getTime() &&
          a.endTime.getTime() > p.startTime.getTime()
      )
      const width = tableWidth / overlappingPresentations.length
      const thisIndex = overlappingPresentations.findIndex(
        (a) => a.link === p.link
      )
      const left = thisIndex * width
      return (
        <a href={p.link} key={p.link}>
          <div
            className='absolute flex justify-center text-center items-center bg-secondaryc bg-clip-content p-[1px] text-white overflow-clip'
            style={{
              top: relStart * tableHeight,
              left: left,
              width: width,
              height: presentationHeight
            }}
          >
            <span className='m-auto px-[1.5ch] z-10'>
              {p.title}
            </span>
          </div>
        </a>
      )
    })
    .filter((e) => e !== null)

  return <>{itemsToRender}</>
}
