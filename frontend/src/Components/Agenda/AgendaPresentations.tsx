export type PresentationSlot = {
  startTime: Date;
  endTime: Date;
  duration: number;
  title: string;
  link: string;
  id: string;
}

export type AgendaPresentationProps = {
  presentations: PresentationSlot[]
  agendaArea: DOMRect
  currentTime: Date
  offsetFraction: number
  extentInHours: number
  favourites?: string[]
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
      const matchesPig = overlappingPresentations.map(p => p.title.match(/pig/i)).some(Boolean)
      const matchesWS = overlappingPresentations.map(p => p.title.match(/LabVIEW and Web Services/i)).some(Boolean)
      const matchesQuiz = overlappingPresentations.map(p => p.title.match(/Quiz/)).some(Boolean)
      const forceHalf = matchesPig || matchesWS || matchesQuiz
      
      const width = forceHalf ? tableWidth / 2 : tableWidth / overlappingPresentations.length
      const thisIndex = forceHalf ? overlappingPresentations.length > 2 ? 0 : 1 : overlappingPresentations.findIndex(
        (a) => a.link === p.link
      )
      const left = thisIndex * width

      const favouriteTag = props.favourites?.includes(p.id) ? 'favourite-session' : ''
      return (
        <a href={p.link} key={p.link}>
          <div
            className={`absolute flex justify-center text-center items-center bg-secondaryc bg-clip-content p-[1px] text-white overflow-clip ${favouriteTag}`}
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
