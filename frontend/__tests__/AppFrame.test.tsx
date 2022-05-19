import { render, screen } from '@testing-library/react'
import { AppFrame } from '@/Components/Layout/AppFrame'
import { useSession } from '@/lib/sessionContext'

const longIpsum = (
  <p data-testid='test-paragraph'>
    Lorem ipsum dolor sit amet consectetur adipisicing elit. Quas eveniet non
    alias in reprehenderit fugiat minus, suscipit eligendi provident rerum qui
    sapiente praesentium blanditiis ullam tempora, perspiciatis voluptatum
    facere repudiandae! Iure reprehenderit esse consequatur ullam tempore porro
    illo illum accusantium temporibus laboriosam earum numquam, blanditiis
    dignissimos qui enim at, animi sequi cumque. Cupiditate, vel perspiciatis.
    Deserunt aliquid maxime iusto? Doloribus? Pariatur doloribus porro
    voluptatibus laboriosam aliquid quo necessitatibus! Repellat inventore id
    culpa eveniet laboriosam magnam atque, consequuntur quidem obcaecati!
    Veritatis eius minus animi modi cumque provident dolore unde enim
    repudiandae! Sint, tempore sapiente quisquam nihil cupiditate laboriosam
    consectetur ea vitae aliquam ducimus ab accusamus quas, voluptatibus et
    earum minima praesentium placeat fuga? Delectus itaque et facere veniam sunt
    tempore ipsam. In placeat reprehenderit obcaecati eveniet aut reiciendis
    perspiciatis, eius eos magnam temporibus, veniam quisquam commodi ab,
    explicabo totam modi. Culpa vel facilis accusamus quos reprehenderit. Vitae
    est dolore quis placeat? Quia, dolores consequuntur delectus consequatur
    odio reiciendis iure hic officiis illo dolor nam soluta exercitationem velit
    facere tempore officia facilis. Quibusdam, illum fuga error quia adipisci
    voluptate ipsam deleniti iusto. Beatae obcaecati quae consectetur quam
    dolorum a expedita asperiores impedit velit! Quibusdam sapiente esse harum
    magni ad nulla illo dolore eaque recusandae quia eum, eius non quod
    assumenda ducimus ut. Consectetur quo non quasi temporibus hic, nemo
    voluptate optio perferendis. Facilis expedita aspernatur rem incidunt minima
    maiores sapiente! Nemo consectetur alias id ex ipsum neque! Corporis
    suscipit quae fugit debitis? Perspiciatis, nemo. Earum officia, tempora
    perferendis porro cumque rerum dolorum accusantium maxime officiis
    consequatur. Beatae necessitatibus ea dignissimos, laboriosam culpa quis
    aliquid sit, minus quibusdam magnam possimus ratione minima architecto?
    Saepe ab sapiente, labore ipsa accusantium laborum quasi sint. Eius esse
    vitae dignissimos sed facilis minima iusto sunt id nam ipsum eum vero,
    blanditiis doloribus voluptatum similique suscipit unde debitis. Tenetur
    molestiae praesentium impedit expedita maiores dolorum aliquam neque eaque
    minima nam? Sed, minima ad! Minus, magnam illum. Atque tempore nemo optio
    necessitatibus inventore maiores odit ea iure et eos. Harum dignissimos
    voluptas vitae quaerat autem quidem corporis veniam quibusdam et voluptatum
    dolores sequi alias, ducimus aliquid beatae amet doloribus ex inventore
    numquam, eum nostrum exercitationem explicabo. Pariatur, impedit eum. Totam
    voluptate cumque quidem commodi porro quam fuga libero corrupti laborum,
    perspiciatis adipisci iure numquam voluptatibus exercitationem repellendus.
    Mollitia laboriosam debitis reiciendis ullam labore earum in iure, quisquam
    fugit qui! Corporis esse voluptate doloremque exercitationem assumenda
    consectetur recusandae. Iure ex repellendus fugit repudiandae veritatis
    fugiat quod nobis sequi exercitationem asperiores quia nemo quas unde amet
    esse ad, similique sapiente vel! Pariatur cum itaque accusamus quasi odio
    corporis fugiat repellendus nihil, consectetur veniam harum ipsum, numquam
    fugit voluptatum repudiandae quam laboriosam! Sapiente laborum deserunt
    minima doloremque autem consequatur, vero quis architecto. Amet a tempora
    autem ut labore mollitia, repellat non veritatis assumenda enim beatae eum
    iste, similique debitis quisquam excepturi impedit eos. Nihil consectetur
    iure, dolorem ab possimus dolores impedit ipsum? Autem reprehenderit
    repellat sint magni consectetur, soluta voluptates rerum ratione iusto.
    Pariatur fuga officiis veritatis maxime ex. Voluptatibus laudantium libero,
    accusantium quisquam corrupti voluptates dignissimos doloribus obcaecati,
    veniam neque alias! Tempora inventore excepturi accusantium adipisci,
    dolorum officia molestias, quas obcaecati esse cumque fugiat doloremque ex
    in. Velit illo quae rem tenetur asperiores minima quam, repellat dicta,
    voluptas amet optio et! Libero, inventore, ducimus officiis assumenda animi
    iusto quae praesentium sit velit dicta quaerat minima magnam iste! Vel
    dolore, sed culpa quia, dignissimos molestiae, consectetur hic quo illo
    magnam ratione porro? Aliquid harum labore dolor rem, voluptas corrupti
    blanditiis hic, odit mollitia voluptatibus fugit perferendis placeat ab
    perspiciatis accusantium possimus adipisci facere maiores esse voluptates,
    omnis nihil asperiores. Ratione, ea aperiam?
  </p>
)

jest.mock('@/lib/sessionContext')
const mockedSession = useSession as jest.MockedFunction<typeof useSession>
mockedSession.mockReturnValue({
  isOrganizer: false,
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  profile: null,
  session: null,
  timezoneInfo: {
    timeZone: 'Asia/Tokyo',
    timeZoneName: 'Japan Standard Time',
    use24HourClock: false
  },
  isLoading: false
})

describe('AppFrame', () => {
  it('contains the title when not scrolled', () => {
    const basicFrame = (
      <AppFrame>
        <p>Some content</p>
      </AppFrame>
    )
    render(basicFrame)
    const heading = screen.getByRole('heading', {
      name: /GLA Summit.*/
    })
    expect(heading).toBeDefined()
  })
})
