import { describe, expect, it } from 'vitest';
import {
  applyTimeScaling,
  calculatePositioningInfo,
  type ContainerHint,
  type PresentationSlot
} from './AgendaCalculations';

const windowStart = new Date(Date.UTC(2026, 7, 31, 12, 0, 0));
const windowEnd = new Date(Date.UTC(2026, 8, 1, 12, 0, 0));
const startCount = windowStart.getTime();
const endCount = windowEnd.getTime();

/**
 * Minutes after the start of the agenda window, which is how the hints express
 * offsets. Keeps the fixtures readable next to the real 12:00-UTC start.
 */
const at = (minutesAfterStart: number) =>
  new Date(startCount + minutesAfterStart * 60 * 1000);

const slot = (
  id: string,
  startMinutes: number,
  durationMinutes: number,
  overrides: Partial<PresentationSlot> = {}
): PresentationSlot => ({
  id,
  title: `Session ${id}`,
  link: `/presentations/${id}`,
  kind: 'session',
  speakers: ['A Presenter'],
  startTime: at(startMinutes),
  durationMinutes,
  drawnDurationMinutes: durationMinutes,
  ...overrides
});

const layout = (slots: PresentationSlot[], hints?: ContainerHint[]) =>
  calculatePositioningInfo(slots, startCount, hints, endCount);

/** Hints keyed by id, for assertions that do not care about output order. */
const byId = (slots: PresentationSlot[], hints?: ContainerHint[]) =>
  new Map(layout(slots, hints).map((hint) => [hint.id, hint]));

describe('calculatePositioningInfo', () => {
  it('gives a lone session the full width', () => {
    const [hint] = layout([slot('a', 0, 60)]);

    expect(hint.leftFraction).toBe(0);
    expect(hint.widthFraction).toBe(1);
    expect(hint.startOffsetMinutes).toBe(0);
    expect(hint.drawnDurationMinutes).toBe(60);
  });

  it('splits two simultaneous sessions into equal halves', () => {
    const hints = layout([slot('a', 0, 60), slot('b', 0, 60)]);

    expect(hints.map((h) => h.widthFraction)).toEqual([0.5, 0.5]);
    expect(hints.map((h) => h.leftFraction).sort()).toEqual([0, 0.5]);
  });

  it('splits three simultaneous sessions into equal thirds', () => {
    const hints = layout([
      slot('a', 0, 60),
      slot('b', 0, 60),
      slot('c', 0, 60)
    ]);

    for (const hint of hints) {
      expect(hint.widthFraction).toBeCloseTo(1 / 3);
    }
    expect(hints.map((h) => h.leftFraction).sort((x, y) => x - y)).toEqual([
      0,
      expect.closeTo(1 / 3),
      expect.closeTo(2 / 3)
    ]);
  });

  it('gives every entry in a time block the same width when overlaps are staggered', () => {
    // a ------
    //     b ------
    //         c ------
    // `a` and `c` never touch, but `b` chains them into one time block. Sizing
    // each entry from its own overlap count would give `a` and `c` a half and `b` a
    // third, which is not the expected layout.
    const hints = byId([
      slot('a', 0, 60),
      slot('b', 30, 60),
      slot('c', 60, 60)
    ]);

    const widths = [...hints.values()].map((h) => h.widthFraction);
    expect(new Set(widths).size).toBe(1);

    // `a` ends before `c` starts, so they may share a column; `b` must not.
    expect(hints.get('a')!.leftFraction).toBe(hints.get('c')!.leftFraction);
    expect(hints.get('b')!.leftFraction).not.toBe(hints.get('a')!.leftFraction);
  });

  it('never leaves a gap or an overlap between columns', () => {
    const hints = layout([
      slot('a', 0, 60),
      slot('b', 0, 30),
      slot('c', 30, 30),
      slot('d', 0, 60)
    ]);

    const columns = hints
      .map((h) => ({
        left: h.leftFraction,
        right: h.leftFraction + h.widthFraction
      }))
      .sort((x, y) => x.left - y.left);

    expect(columns[0].left).toBe(0);
    expect(columns.at(-1)!.right).toBeCloseTo(1);
  });

  it('packs independent time blocks separately', () => {
    // Two simultaneous sessions, then a single one well after them. The single
    // session is in its own time block, so it must not be squeezed into half the
    // width by the earlier pair.
    const hints = byId([
      slot('a', 0, 60),
      slot('b', 0, 60),
      slot('c', 120, 60)
    ]);

    expect(hints.get('a')!.widthFraction).toBe(0.5);
    expect(hints.get('b')!.widthFraction).toBe(0.5);
    expect(hints.get('c')!.widthFraction).toBe(1);
    expect(hints.get('c')!.leftFraction).toBe(0);
  });

  it('is independent of input order', () => {
    const slots = [slot('a', 0, 60), slot('b', 0, 60), slot('c', 30, 60)];
    const forwards = byId(slots);
    const backwards = byId([...slots].reverse());

    for (const id of ['a', 'b', 'c']) {
      expect(backwards.get(id)!.leftFraction).toBe(
        forwards.get(id)!.leftFraction
      );
      expect(backwards.get(id)!.widthFraction).toBe(
        forwards.get(id)!.widthFraction
      );
    }
  });

  describe('drawn height', () => {
    it('rounds a 45-minute talk up to the hour when nothing follows it', () => {
      const [hint] = layout([slot('a', 0, 45, { drawnDurationMinutes: 60 })]);

      expect(hint.drawnDurationMinutes).toBe(60);
      // The real end is still what labels and aria text report.
      expect(hint.endTime.getTime()).toBe(at(45).getTime());
    });

    it('clamps to the next entry in the same column instead of overlapping it', () => {
      // The 2026 08:00 case: a 45-minute talk followed by a 15-minute one. They
      // do not really overlap, so they fall in separate time blocks that draw in
      // the same column, and the first is trimmed.
      const hints = byId([
        slot('a', 0, 45, { drawnDurationMinutes: 60 }),
        slot('b', 45, 15)
      ]);

      expect(hints.get('a')!.leftFraction).toBe(hints.get('b')!.leftFraction);
      expect(hints.get('a')!.widthFraction).toBe(1);
      expect(hints.get('a')!.drawnDurationMinutes).toBe(45);
    });

    it('clamps to the end of the agenda window', () => {
      const [hint] = layout([
        slot('a', 24 * 60 - 30, 30, { drawnDurationMinutes: 60 })
      ]);

      expect(hint.drawnDurationMinutes).toBe(30);
    });

    it('never shrinks a block below its real duration', () => {
      const [hint] = layout([slot('a', 24 * 60 - 10, 30)]);

      expect(hint.drawnDurationMinutes).toBe(30);
    });
  });

  describe('container hints', () => {
    const container = (
      containerId: string,
      presentationIds: string[]
    ): ContainerHint => ({
      title: `Container ${containerId}`,
      abstract: '',
      container_id: containerId,
      presentation_ids: presentationIds,
      year: '2026'
    });

    it('stacks members in one column beside a parallel session', () => {
      const slots = [
        slot('long', 0, 60),
        slot('s1', 0, 15),
        slot('s2', 15, 15),
        slot('s3', 30, 15)
      ];
      const hints = byId(slots, [container('c1', ['s1', 's2', 's3'])]);

      // Four hints: the container itself is never drawn, only its members.
      expect(hints.size).toBe(4);
      expect(hints.has('c1')).toBe(false);

      const memberLefts = ['s1', 's2', 's3'].map(
        (id) => hints.get(id)!.leftFraction
      );
      expect(new Set(memberLefts).size).toBe(1);
      expect(memberLefts[0]).not.toBe(hints.get('long')!.leftFraction);

      for (const id of ['s1', 's2', 's3', 'long']) {
        expect(hints.get(id)!.widthFraction).toBe(0.5);
      }
    });

    it('keeps two simultaneous short-talk strands apart', () => {
      // The case containers exist for: without them the six talks would
      // interleave across columns instead of reading as two strands.
      const slots = [
        slot('a1', 0, 15),
        slot('a2', 15, 15),
        slot('a3', 30, 15),
        slot('b1', 0, 15),
        slot('b2', 15, 15),
        slot('b3', 30, 15)
      ];
      const hints = byId(slots, [
        container('ca', ['a1', 'a2', 'a3']),
        container('cb', ['b1', 'b2', 'b3'])
      ]);

      const strandA = new Set(
        ['a1', 'a2', 'a3'].map((id) => hints.get(id)!.leftFraction)
      );
      const strandB = new Set(
        ['b1', 'b2', 'b3'].map((id) => hints.get(id)!.leftFraction)
      );

      expect(strandA.size).toBe(1);
      expect(strandB.size).toBe(1);
      expect([...strandA][0]).not.toBe([...strandB][0]);
    });

    it('changes nothing when there are no hints, or none that match', () => {
      const slots = [slot('a', 0, 60), slot('b', 0, 60), slot('c', 90, 30)];
      const expected = layout(slots);

      expect(layout(slots, [])).toEqual(expected);
      expect(layout(slots, undefined)).toEqual(expected);
      // A container for presentations that are not on this agenda.
      expect(layout(slots, [container('c1', ['x', 'y'])])).toEqual(expected);
    });

    it('tolerates a container with no members listed', () => {
      const slots = [slot('a', 0, 60)];

      // Chained reduce() calls without a seed used to throw here.
      expect(() => layout(slots, [container('empty', [])])).not.toThrow();
      expect(layout(slots, [container('empty', [])])).toEqual(layout(slots));
    });

    it('spans only the members that are actually on the agenda', () => {
      const slots = [slot('s1', 0, 15), slot('s2', 15, 15)];
      // 's3' is listed but absent — a different year, or not yet accepted.
      const hints = byId(slots, [container('c1', ['s1', 's2', 's3'])]);

      expect(hints.size).toBe(2);
      expect(hints.get('s1')!.widthFraction).toBe(1);
    });
  });

  describe('entries with no session page', () => {
    it('packs alongside sessions and keeps its null link', () => {
      const hints = byId([
        slot('a', 0, 60),
        slot('ama', 0, 60, {
          kind: 'expert-bar',
          link: null,
          title: 'NI Expert AMA'
        })
      ]);

      expect(hints.get('ama')!.widthFraction).toBe(0.5);
      expect(hints.get('ama')!.link).toBeNull();
      expect(hints.get('a')!.link).toBe('/presentations/a');
    });
  });
});

describe('applyTimeScaling', () => {
  it('converts offsets to pixels and fractions to percentages', () => {
    const [entry] = applyTimeScaling(
      layout([slot('a', 60, 45, { drawnDurationMinutes: 60 })]),
      2
    );

    expect(entry.style.top).toBe(120);
    expect(entry.style.height).toBe(120);
    expect(entry.style.left).toBe('0.0000%');
    expect(entry.style.width).toBe('100.0000%');
  });

  it('emits percentage columns so no width measurement is needed', () => {
    const entries = applyTimeScaling(
      layout([slot('a', 0, 60), slot('b', 0, 60)]),
      2
    );

    expect(entries.map((e) => e.style.width)).toEqual(['50.0000%', '50.0000%']);
    expect(entries.map((e) => e.style.left).sort()).toEqual([
      '0.0000%',
      '50.0000%'
    ]);
  });
});
