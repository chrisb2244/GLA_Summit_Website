import { calculatePositioningInfo } from '@/Components/Agenda/AgendaCalculations';

describe('calculatePlottingAreas', () => {
  const now = new Date(Date.UTC(2022, 10, 11, 10, 0, 0));
  beforeAll(() => {
    jest.useFakeTimers('modern');
    jest.setSystemTime(now);
  });
  afterAll(() => {
    jest.useRealTimers();
  });

  const start = new Date(Date.UTC(2022, 10, 14, 12, 0, 0));
  const end = new Date(Date.UTC(2022, 10, 15, 12, 0, 0));
  const startCount = start.getTime();
  const durationMinutes = (end.getTime() - start.getTime()) / (60 * 1000);

  const fullDurationPresentation = {
    startTime: start,
    endTime: end,
    durationMinutes: (end.getTime() - start.getTime()) / (60 * 1000),
    link: '/presentations/0123-4567-890a',
    title: 'A title',
    id: '0123-4567-890a'
  };

  const halfDurationPresentation = (idx: number) => {
    const duration = (end.getTime() - start.getTime()) / 2;
    return {
      startTime: new Date(start.getTime() + idx * duration),
      endTime: new Date(start.getTime() + (idx + 1) * duration),
      durationMinutes: duration / (60 * 1000),
      link: '/a-link',
      title: 'A title',
      id: '0123-4567-abcdef'
    };
  };

  const thirdDurationPresentation = (idx: number) => {
    const duration = (end.getTime() - start.getTime()) / 3;
    return {
      startTime: new Date(start.getTime() + idx * duration),
      endTime: new Date(start.getTime() + (idx + 1) * duration),
      durationMinutes: duration / (60 * 1000),
      link: '/a-link',
      title: 'A title',
      id: '0123-4567-890a'
    };
  };

  it('gives full width to a single presentation', () => {
    const plottingHint = calculatePositioningInfo(
      [fullDurationPresentation],
      startCount
    );

    expect(plottingHint).toHaveLength(1);
    expect(plottingHint[0].leftFraction).toEqual(0);
    expect(plottingHint[0].widthFraction).toEqual(1);
    expect(plottingHint[0].startOffsetMinutes).toEqual(0);
    expect(plottingHint[0].durationMinutes).toEqual(durationMinutes);
  });

  it('gives half width to two full-length presentations', () => {
    const plottingHints = calculatePositioningInfo(
      [
        fullDurationPresentation,
        { ...fullDurationPresentation, id: '5421-214-abcd' }
      ],
      startCount
    );

    expect.assertions(9);
    expect(plottingHints).toHaveLength(2);
    plottingHints.forEach((h, idx) => {
      expect(h.leftFraction).toEqual(0.5 * idx); // 0, 0.5
      expect(h.widthFraction).toEqual(0.5);
      expect(h.startOffsetMinutes).toEqual(0);
      expect(h.durationMinutes).toEqual(durationMinutes);
    });
  });

  it('gives one third width for three full-duration presentations', () => {
    const plottingHints = calculatePositioningInfo(
      [
        fullDurationPresentation,
        { ...fullDurationPresentation, id: '5421-214-abcd' },
        { ...fullDurationPresentation, id: '5421-214-abcde2' }
      ],
      startCount
    );

    expect.assertions(13);
    expect(plottingHints).toHaveLength(3);
    plottingHints.forEach((h, idx) => {
      expect(h.leftFraction).toBeCloseTo(0.3333 * idx, 2);
      expect(h.widthFraction).toBeCloseTo(0.3333, 2);
      expect(h.startOffsetMinutes).toEqual(0);
      expect(h.durationMinutes).toEqual(durationMinutes);
    });
  });

  // Simple overlaps here means that there are no cases where the number of overlaps varies in time for a specific presentation
  it('calculates for different duration presentations correctly with only simple overlaps', () => {
    const plottingHints = calculatePositioningInfo(
      [
        fullDurationPresentation,
        { ...halfDurationPresentation(0), id: '1234' },
        { ...halfDurationPresentation(1), id: '5678' }
      ],
      startCount,
      [
        {
          title: '',
          abstract: '',
          container_id: 'c12345',
          year: '2022',
          presentation_ids: ['1234', '5678']
        }
      ]
    );

    expect.assertions(11);
    expect(plottingHints).toHaveLength(3);
    const fullLengthIsLeft =
      plottingHints.find((hint) => hint.durationMinutes === durationMinutes)
        ?.leftFraction === 0;

    let allowedPositions = [
      { start: 0, duration: durationMinutes },
      { start: 0, duration: durationMinutes / 2 },
      { start: durationMinutes / 2, duration: durationMinutes / 2 }
    ];

    plottingHints.forEach((a) => {
      const isFullLength = a.durationMinutes === durationMinutes;
      const position = {
        start: a.startOffsetMinutes,
        duration: a.durationMinutes
      };
      let isRemoved = false;
      allowedPositions = allowedPositions.filter((allowed) => {
        if (
          allowed.start === position.start &&
          allowed.duration === position.duration &&
          !isRemoved
        ) {
          isRemoved = true;
          return false;
        }
        return true;
      });
      expect(isRemoved).toBeTruthy();
      expect(a.widthFraction).toBe(0.5);
      if (fullLengthIsLeft) {
        expect(a.leftFraction).toBeCloseTo(isFullLength ? 0 : 0.5, 2);
      } else {
        expect(a.leftFraction).toBeCloseTo(isFullLength ? 0.5 : 0, 2);
      }
    });
    // All 'allowedPositions' should be consumed (check test is working as intended)
    expect(allowedPositions).toHaveLength(0);
  });

  it('calculates for different duration presentations correctly with only simple overlaps (reordered)', () => {
    const plottingHints = calculatePositioningInfo(
      [
        { ...halfDurationPresentation(1), id: '5678' },
        fullDurationPresentation,
        { ...halfDurationPresentation(0), id: '1234' }
      ],
      startCount,
      [
        {
          title: '',
          abstract: '',
          container_id: 'c12345',
          year: '2022',
          presentation_ids: ['1234', '5678']
        }
      ]
    );

    expect.assertions(11);
    expect(plottingHints).toHaveLength(3);
    const fullLengthIsLeft =
      plottingHints.find((hint) => hint.durationMinutes === durationMinutes)
        ?.leftFraction === 0;

    let allowedPositions = [
      { start: 0, duration: durationMinutes },
      { start: 0, duration: durationMinutes / 2 },
      { start: durationMinutes / 2, duration: durationMinutes / 2 }
    ];

    plottingHints.forEach((a) => {
      const isFullLength = a.durationMinutes === durationMinutes;
      const position = {
        start: a.startOffsetMinutes,
        duration: a.durationMinutes
      };
      let isRemoved = false;
      allowedPositions = allowedPositions.filter((allowed) => {
        if (
          allowed.start === position.start &&
          allowed.duration === position.duration &&
          !isRemoved
        ) {
          isRemoved = true;
          return false;
        }
        return true;
      });
      expect(isRemoved).toBeTruthy();
      expect(a.widthFraction).toBe(0.5);
      if (fullLengthIsLeft) {
        expect(a.leftFraction).toBeCloseTo(isFullLength ? 0 : 0.5, 2);
      } else {
        expect(a.leftFraction).toBeCloseTo(isFullLength ? 0.5 : 0, 2);
      }
    });
    // All 'allowedPositions' should be consumed (check test is working as intended)
    expect(allowedPositions).toHaveLength(0);
  });

  it('calculates correctly a full duration and 2 1/3 duration presentations', () => {
    const plottingHints = calculatePositioningInfo(
      [
        fullDurationPresentation,
        { ...thirdDurationPresentation(0), id: '1234' },
        { ...thirdDurationPresentation(1), id: '5678' }
      ],
      startCount,
      [
        {
          title: '',
          abstract: '',
          container_id: 'c12345',
          year: '2022',
          presentation_ids: ['1234', '5678']
        }
      ]
    );

    expect.assertions(11);
    expect(plottingHints).toHaveLength(3);
    const fullLengthIsLeft =
      plottingHints.find((hint) => hint.durationMinutes === durationMinutes)
        ?.leftFraction === 0;

    let allowedPositions = [
      { start: 0, duration: durationMinutes },
      { start: 0, duration: durationMinutes / 3 },
      { start: durationMinutes / 3, duration: durationMinutes / 3 }
    ];

    plottingHints.forEach((a) => {
      const isFullLength = a.durationMinutes === durationMinutes;
      const position = {
        start: a.startOffsetMinutes,
        duration: a.durationMinutes
      };
      let isRemoved = false;
      allowedPositions = allowedPositions.filter((allowed) => {
        if (
          allowed.start === position.start &&
          allowed.duration === position.duration &&
          !isRemoved
        ) {
          isRemoved = true;
          return false;
        }
        return true;
      });
      expect(isRemoved).toBeTruthy();
      expect(a.widthFraction).toBe(0.5);
      if (fullLengthIsLeft) {
        expect(a.leftFraction).toBeCloseTo(isFullLength ? 0 : 0.5, 2);
      } else {
        expect(a.leftFraction).toBeCloseTo(isFullLength ? 0.5 : 0, 2);
      }
    });
    // All 'allowedPositions' should be consumed (check test is working as intended)
    expect(allowedPositions).toHaveLength(0);
  });
});
