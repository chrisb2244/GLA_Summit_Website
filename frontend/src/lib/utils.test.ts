import { describe, it, expect } from 'vitest';
import { estimateAspectRatio } from './utils';

describe('estimateAspectRatio', () => {
  it('returns a good value for an exact 16:9 match', () => {
    expect(estimateAspectRatio(1600, 900)).toEqual('16:9');
  });

  it('returns a good value for an exact 16:10 match', () => {
    expect(estimateAspectRatio(1600, 1000)).toEqual('16:10');
  });

  it('returns a good value for an exact 4:3 match', () => {
    expect(estimateAspectRatio(1024, 768)).toEqual('4:3');
  });

  it('returns a nice rounded value for a close-to-16:9 ratio', () => {
    expect(estimateAspectRatio(2500, 1407)).toEqual('16:9');
  });

  it('calculates Instagram portrait ratio', () => {
    expect(estimateAspectRatio(1080, 1350)).toEqual('4:5');
  });

  it('calculates Facebook landscape ratio', () => {
    expect(estimateAspectRatio(1200, 630)).toEqual('15:8');
  });

  it('calculates LinkedIn landscape ratio', () => {
    expect(estimateAspectRatio(1200, 627)).toEqual('15:8');
  });

  it('calculates Twitter landscape ratio', () => {
    expect(estimateAspectRatio(1024, 512)).toEqual('2:1');
  });
});
