import type { SummitYear } from '@/lib/databaseModels';
import type { AgendaExtraKind } from '@/app/agendaExtras';

/**
 * A session backed by an accepted presentation submission, or one
 * of the schedule entries without a submission (see `@/app/agendaExtras`).
 * The distinction decides whether the entry has a link.
 */
export type AgendaEntryKind = 'session' | AgendaExtraKind;

export type ContainerHint = {
  title: string;
  abstract: string;
  container_id: string;
  presentation_ids: string[];
  year: SummitYear;
};

export type PresentationSlot = {
  id: string;
  title: string;
  /** `null` for entries with no session page. */
  link: string | null;
  kind: AgendaEntryKind;
  speakers: string[];
  startTime: Date;
  /**
   * True length. Overlap detection uses this, so columns reflect real clashes
   * rather than the rounded-up shape we draw.
   */
  durationMinutes: number;
  /**
   * Preferred drawn length, never less than `durationMinutes`. A 45-minute talk
   * asks for 60 to reflect our usually scheduled spacing (for overruns, many questions,
   * etc), but it is clamped when drawing if another session immediately follows.
   */
  drawnDurationMinutes: number;
};

export type PresentationPlottingHints = {
  id: string;
  title: string;
  link: string | null;
  kind: AgendaEntryKind;
  speakers: string[];
  startTime: Date;
  /** Real end, for labels and aria text — not the drawn extent. */
  endTime: Date;
  startOffsetMinutes: number;
  /** Drawn length, after clamping. */
  drawnDurationMinutes: number;
  leftFraction: number;
  widthFraction: number;
};

export type PlottedEntry = {
  id: string;
  title: string;
  link: string | null;
  kind: AgendaEntryKind;
  speakers: string[];
  startTime: Date;
  endTime: Date;
  style: {
    top: number;
    height: number;
    /** Percentages, so the timeline needs no width measurement to lay out. */
    left: string;
    width: string;
  };
};

const MINUTE = 60 * 1000;

const endCountOf = (slot: PresentationSlot) =>
  slot.startTime.getTime() + slot.durationMinutes * MINUTE;

/**
 * Start, then end, then id. Deterministic ordering makes layout stable.
 */
const bySchedule = (a: PresentationSlot, b: PresentationSlot) =>
  a.startTime.getTime() - b.startTime.getTime() ||
  endCountOf(a) - endCountOf(b) ||
  (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

type SlotWithMembers = PresentationSlot & {
  members?: PresentationSlot[];
};

/**
 * Collapse container members into a single synthetic entry spanning them.
 *
 * A container is only ever a layout hint: it says "these short talks are one
 * strand, stack them in a single column" so that two simultaneous sets of short
 * talks do not interleave. Nothing about the container itself is drawn.
 *
 * With no hints — or hints that match nothing on this agenda — this returns the
 * input unchanged, so the container path costs nothing in a year that uses none.
 */
const collapseContainers = (
  slots: PresentationSlot[],
  containerHints: ContainerHint[] | undefined
): SlotWithMembers[] => {
  if (!containerHints || containerHints.length === 0) {
    return slots;
  }

  const containerIdByPresentationId = new Map<string, string>();
  for (const hint of containerHints) {
    for (const presentationId of hint.presentation_ids) {
      containerIdByPresentationId.set(presentationId, hint.container_id);
    }
  }
  if (containerIdByPresentationId.size === 0) {
    return slots;
  }

  const membersByContainerId = new Map<string, PresentationSlot[]>();
  const ungrouped: PresentationSlot[] = [];

  for (const slot of slots) {
    const containerId = containerIdByPresentationId.get(slot.id);
    if (containerId === undefined) {
      ungrouped.push(slot);
      continue;
    }
    const members = membersByContainerId.get(containerId);
    if (members) {
      members.push(slot);
    } else {
      membersByContainerId.set(containerId, [slot]);
    }
  }

  const containerEntries = Array.from(membersByContainerId.entries()).map(
    ([containerId, unsortedMembers]): SlotWithMembers => {
      // Members not on this agenda (a different year, or not yet accepted) are
      // simply absent from `slots`; the container spans whatever is present.
      const members = [...unsortedMembers].sort(bySchedule);
      const startCount = members[0].startTime.getTime();
      const endCount = members.reduce(
        (latest, member) => Math.max(latest, endCountOf(member)),
        startCount
      );
      const spanMinutes = (endCount - startCount) / MINUTE;

      return {
        id: containerId,
        title: '',
        link: null,
        kind: 'session',
        speakers: [],
        startTime: new Date(startCount),
        durationMinutes: spanMinutes,
        drawnDurationMinutes: spanMinutes,
        members
      };
    }
  );

  return [...ungrouped, ...containerEntries];
};

type ColumnAssignment = { slot: SlotWithMembers; column: number };

/**
 * Group entries into the time blocks a reader sees on the agenda, then pack
 * each block into columns.
 *
 * A time block is a run of schedule with no gap in it: an entry joins the block
 * it overlaps, and a block closes at the first moment nothing is running. That
 * is usually the nominal slot — back-to-back sessions do not merge: an entry
 * starting exactly as the block ends opens the next one.
 *
 * Block grouping is what makes widths agree. Sizing an entry from its own overlap
 * count lets two overlapping entries disagree: one that sees two overlaps takes
 * a third of the width, while the entry beside it sees only one and takes a
 * half, so they collide or leave a gap. One column count per time block cannot
 * do that.
 *
 * `column` is an index within its block, so it only means anything alongside
 * that block's `columnCount`.
 */
const assignColumns = (slots: SlotWithMembers[]) => {
  const sorted = [...slots].sort(bySchedule);
  const timeBlocks: ColumnAssignment[][] = [];

  let currentBlock: ColumnAssignment[] = [];
  // Latest real end anywhere in the block being built — when the block closes,
  // unless something else starts first.
  let blockEndCount = -Infinity;
  // Last real end time per column, within the block being built.
  let columnEndCounts: number[] = [];

  for (const slot of sorted) {
    const startCount = slot.startTime.getTime();

    // Nothing is still running, so this entry opens a new time block.
    if (startCount >= blockEndCount && currentBlock.length > 0) {
      timeBlocks.push(currentBlock);
      currentBlock = [];
      columnEndCounts = [];
    }

    // Reuse the leftmost column already free at this start, else open one.
    let column = columnEndCounts.findIndex(
      (endCount) => endCount <= startCount
    );
    if (column === -1) {
      column = columnEndCounts.length;
    }
    columnEndCounts[column] = endCountOf(slot);

    currentBlock.push({ slot, column });
    blockEndCount = Math.max(blockEndCount, endCountOf(slot));
  }
  if (currentBlock.length > 0) {
    timeBlocks.push(currentBlock);
  }

  return timeBlocks.map((entries) => ({
    entries,
    columnCount: entries.reduce(
      (widest, entry) => Math.max(widest, entry.column + 1),
      1
    )
  }));
};

const spansOverlap = (a: Placement, b: Placement) =>
  b.leftFraction < a.leftFraction + a.widthFraction &&
  b.leftFraction + b.widthFraction > a.leftFraction;

/**
 * Trim an entry's drawn extent so it never runs into whatever comes next in the
 * same horizontal span, nor past the end of the agenda window.
 */
const clampedDrawnMinutes = (
  placement: Placement,
  placements: Placement[],
  windowEndCount: number | undefined
) => {
  const { slot } = placement;
  const startCount = slot.startTime.getTime();
  const realEndCount = endCountOf(slot);

  let limitCount = startCount + slot.drawnDurationMinutes * MINUTE;
  if (windowEndCount !== undefined) {
    limitCount = Math.min(limitCount, windowEndCount);
  }

  for (const other of placements) {
    if (other.slot.id === slot.id) continue;
    const otherStartCount = other.slot.startTime.getTime();
    if (otherStartCount < realEndCount) continue;
    if (!spansOverlap(placement, other)) continue;
    limitCount = Math.min(limitCount, otherStartCount);
  }

  // Never shrink below the real length: anything sharing this horizontal span
  // starts at or after the real end, so this only guards the window-end clamp.
  return Math.max(slot.durationMinutes, (limitCount - startCount) / MINUTE);
};

type Placement = {
  slot: PresentationSlot;
  leftFraction: number;
  widthFraction: number;
};

export const calculatePositioningInfo = (
  slots: PresentationSlot[],
  startTimeCount: number,
  containerHints?: ContainerHint[],
  windowEndCount?: number
): PresentationPlottingHints[] => {
  const collapsed = collapseContainers(slots, containerHints);

  // Containers are a layout hint only: they claim a column, then hand it to
  // their members. Nothing about the container itself is ever drawn.
  const placements: Placement[] = [];
  for (const { entries, columnCount } of assignColumns(collapsed)) {
    const widthFraction = 1 / columnCount;
    for (const { slot, column } of entries) {
      const leftFraction = column * widthFraction;
      const drawn = slot.members ?? [slot];
      for (const member of drawn) {
        placements.push({ slot: member, leftFraction, widthFraction });
      }
    }
  }

  return placements.map((placement) => {
    const { slot, leftFraction, widthFraction } = placement;
    return {
      id: slot.id,
      title: slot.title,
      link: slot.link,
      kind: slot.kind,
      speakers: slot.speakers,
      startTime: slot.startTime,
      endTime: new Date(endCountOf(slot)),
      startOffsetMinutes: (slot.startTime.getTime() - startTimeCount) / MINUTE,
      drawnDurationMinutes: clampedDrawnMinutes(
        placement,
        placements,
        windowEndCount
      ),
      leftFraction,
      widthFraction
    };
  });
};

const asPercent = (fraction: number) => `${(fraction * 100).toFixed(4)}%`;

export const applyTimeScaling = (
  hints: PresentationPlottingHints[],
  pixelsPerMinute: number
): PlottedEntry[] =>
  hints.map((hint) => ({
    id: hint.id,
    title: hint.title,
    link: hint.link,
    kind: hint.kind,
    speakers: hint.speakers,
    startTime: hint.startTime,
    endTime: hint.endTime,
    style: {
      top: hint.startOffsetMinutes * pixelsPerMinute,
      height: hint.drawnDurationMinutes * pixelsPerMinute,
      left: asPercent(hint.leftFraction),
      width: asPercent(hint.widthFraction)
    }
  }));
