import { estimateAspectRatio } from '@/lib/utils'

describe('EstimateAspectRatio', () => {
  it('returns a good value for an exact 16:9 match', () => {
    const estimatedRatio = estimateAspectRatio(1600, 900);
    expect(estimatedRatio).toEqual('16:9')
  })

  it('returns a good value for an exact 16:10 match', () => {
    const estimatedRatio = estimateAspectRatio(1600, 1000);
    expect(estimatedRatio).toEqual('16:10')
  })

  it('returns a good value for an exact 4:3 match', () => {
    const estimatedRatio = estimateAspectRatio(1024, 768);
    expect(estimatedRatio).toEqual('4:3')
  })

  it('returns a nice rounded value for a close-to-16:9 ratio', () => {
    const estimatedRatio = estimateAspectRatio(2500, 1407);
    expect(estimatedRatio).toEqual('16:9')
  })

  it('calculates Instagram portrait ratio', () => {
    const estimatedRatio = estimateAspectRatio(1080, 1350);
    expect(estimatedRatio).toEqual('4:5')
  })

  it('calculates Facebook landscape ratio', () => {
    const estimatedRatio = estimateAspectRatio(1200, 630);
    expect(estimatedRatio).toEqual('15:8')
  })

  it('calculates LinkedIn landscape ratio', () => {
    const estimatedRatio = estimateAspectRatio(1200, 627);
    expect(estimatedRatio).toEqual('15:8')
  })

  it('calculates Twitter landscape ratio', () => {
    const estimatedRatio = estimateAspectRatio(1024, 512);
    expect(estimatedRatio).toEqual('2:1')
  })
})
