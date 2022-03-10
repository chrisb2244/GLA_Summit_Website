import { render, within } from '@testing-library/react'
import { AppFrame } from '@/Components/Frame/AppFrame'

describe('AppFrame', () => {
  it('restricts child content to centred, not-full-width', () => {
    const frameIpsum = <AppFrame><p data-testid='test-paragraph'>Lorem ipsum dolor, sit amet consectetur adipisicing elit. Repudiandae ex ea itaque magnam blanditiis atque sit qui aspernatur autem rem, incidunt delectus nihil illum numquam! Soluta maiores esse quae vel.
    Quos id commodi veniam asperiores sint. Blanditiis accusantium fuga mollitia nam sed, eveniet nesciunt sunt ex at beatae officiis voluptatum veritatis rem reiciendis voluptates deleniti. Tempora harum ab ipsa fugit.
    Deserunt ut dolorem possimus quos, excepturi atque quisquam consequatur ratione eveniet consectetur corporis autem quod magni aliquid sunt sit a laborum. Eligendi ipsam eius nihil quae rerum amet consequatur impedit!
    Rerum voluptates veritatis eligendi eius natus impedit aspernatur unde ea nostrum sequi porro, totam maiores. Repellat, tenetur. Omnis, aliquam vitae laboriosam iste provident, accusamus illum dolorem, suscipit debitis quisquam inventore.
    Veritatis quisquam qui, similique alias neque quibusdam quos at voluptatibus odio asperiores sapiente architecto aliquid officiis incidunt laboriosam commodi? Maiores praesentium dolore alias! Molestiae corrupti officiis sed alias placeat nihil.
    Recusandae porro expedita numquam voluptatem odit eligendi distinctio corporis ipsa ducimus, vitae id dolorem quas exercitationem sapiente. Sequi tenetur ex facere. Nulla est iste consequatur quis qui! Fugit, dolor odit!
    Molestias obcaecati quas, rerum adipisci reprehenderit eligendi reiciendis cumque, id maxime voluptas doloremque aliquam autem aut earum! Dignissimos, fugiat? Illum laudantium qui voluptatibus, officiis aliquid repellendus cum officia facere voluptate!
    Officia dolore voluptas vero eius, error dolorum, earum molestias fugit ipsum et omnis debitis adipisci obcaecati ut nemo, ducimus ab veniam. Nam culpa obcaecati nemo iste cumque labore eligendi quia?
    Ullam eaque voluptatibus pariatur, rerum, assumenda voluptates suscipit ut architecto cupiditate atque iste reiciendis voluptatem neque reprehenderit sit ipsam inventore impedit necessitatibus odio autem eius! Maxime optio dolorum repellendus nam.
    Quidem porro ex reiciendis sequi vitae molestias nostrum, libero in maiores sapiente officia odio suscipit accusantium illum, ducimus, perferendis atque sed. Facilis ducimus optio beatae temporibus, sunt neque eum reiciendis!</p></AppFrame>

    const content = render(frameIpsum)
    const p = within(content.container).getByTestId('test-paragraph')
    expect(p).toHaveStyle({marginLeft: 'auto', marginRight: 'auto'})
    const maxW = window.getComputedStyle(p).maxWidth
    const percentageW = Number.parseFloat(maxW.match(/([0-9.]*)%/)?.[1] ?? '100')
    expect(percentageW).toBeLessThan(95)
  })


})
