import { SummitYear } from '@/lib/databaseModels';
import { myLog } from '@/lib/utils';

export type PresentationPlottingInfo = {
  style: {
    top: number;
    height: number;
    left: number;
    width: number;
  };
  title: string;
  link: string;
  id: string;
};

export type ContainerHint = {
  title: string;
  abstract: string;
  container_id: string;
  presentation_ids: string[];
  year: SummitYear;
};

type PresentationPlottingHints = {
  startOffsetMinutes: number;
  durationMinutes: number;
  leftFraction: number;
  widthFraction: number;
  title: string;
  link: string;
  id: string;
};

export type PresentationSlot = {
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  title: string;
  link: string;
  id: string;
};

type SlotWithContainers = PresentationSlot & {
  container?: boolean;
};

const findOverlappingPresentations = (
  p: SlotWithContainers,
  arr: SlotWithContainers[]
) => {
  const overlappingPresentations = arr.filter(
    (a) =>
      a.startTime.getTime() < p.endTime.getTime() &&
      a.endTime.getTime() > p.startTime.getTime()
  );
  return overlappingPresentations;
};

export const applyTimeScaling = (
  plotAreas: PresentationPlottingHints[],
  pixelsPerMinute: number,
  fullWidth: number
): PresentationPlottingInfo[] => {
  return plotAreas.map((pa) => {
    return {
      title: pa.title,
      link: pa.link,
      id: pa.id,
      style: {
        left: pa.leftFraction * fullWidth,
        width: pa.widthFraction * fullWidth,
        top: pa.startOffsetMinutes * pixelsPerMinute,
        height: pa.durationMinutes * pixelsPerMinute
      }
    };
  });
};

export const calculatePositioningInfo = (
  presentations: PresentationSlot[],
  startTimeCount: number,
  containerHints?: ContainerHint[]
): PresentationPlottingHints[] => {
  // Use containerHints to filter out 7x7, 15 minutes, etc
  let sessionBlocks: SlotWithContainers[] = presentations;
  if (typeof containerHints !== 'undefined' && containerHints.length !== 0) {
    const presentationIdToContainerIdMap = containerHints
      .map((ch) => {
        return ch.presentation_ids
          .map((presId) => {
            return {
              [presId]: ch.container_id
            };
          })
          .reduce((mapVals, entry) => {
            return {
              ...mapVals,
              ...entry
            };
          });
      })
      .reduce((mapVals, entry) => {
        return {
          ...mapVals,
          ...entry
        };
      });

    const usedContainerIds = new Set<string>();
    sessionBlocks = sessionBlocks.filter((presentation) => {
      const thisPresentationIsInAContainer = Object.keys(
        presentationIdToContainerIdMap
      ).includes(presentation.id);
      if (thisPresentationIsInAContainer) {
        usedContainerIds.add(presentationIdToContainerIdMap[presentation.id]);
      }
      return !thisPresentationIsInAContainer;
    });

    usedContainerIds.forEach((containerId) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const container = containerHints.find(
        (ch) => ch.container_id === containerId
      )!;

      const { minStartCount, maxEndCount } = container.presentation_ids.reduce(
        ({ minStartCount, maxEndCount }, current) => {
          const presentation = presentations.find((p) => p.id === current);
          if (typeof presentation === 'undefined') {
            myLog(
              `Unexpected unfound presentationId ${current} in containerId ${container}`
            );
            return {
              minStartCount,
              maxEndCount
            };
          }
          return {
            minStartCount: Math.min(
              minStartCount,
              presentation.startTime.getTime()
            ),
            maxEndCount: Math.max(maxEndCount, presentation.endTime.getTime())
          };
        },
        {
          maxEndCount: 0,
          minStartCount: new Date(Date.UTC(2999, 1, 1)).getTime()
        }
      );

      const startTime = new Date(minStartCount);
      const endTime = new Date(maxEndCount);

      sessionBlocks.push({
        id: containerId,
        durationMinutes: (maxEndCount - minStartCount) / (60 * 1000),
        startTime,
        endTime,
        title: container.title,
        link: '', // fix?
        container: true
      });
    });
  }

  const buildHint = (
    p: PresentationSlot,
    leftFraction: number,
    widthFraction: number
  ): PresentationPlottingHints => {
    return {
      title: p.title,
      link: p.link,
      id: p.id,
      durationMinutes: p.durationMinutes,
      startOffsetMinutes:
        (p.startTime.getTime() - startTimeCount) / (1000 * 60),
      leftFraction,
      widthFraction
    };
  };

  return sessionBlocks
    .map((p) => {
      const overlappingPresentations = findOverlappingPresentations(
        p,
        sessionBlocks
      );
      const widthFraction = 1 / overlappingPresentations.length;
      const colIdx = overlappingPresentations.findIndex((c) => c.id === p.id);
      if (colIdx === -1) {
        return null;
      }
      const leftFraction = colIdx * widthFraction;
      if (p.container && typeof containerHints !== 'undefined') {
        const container = containerHints.find((c) => c.container_id === p.id);
        if (typeof container === 'undefined') {
          // Can't get here - containers are pushed into sessionBlocks
          return null;
        }
        const containedPresentationIds = container.presentation_ids;

        const containedPresentations = containedPresentationIds.map(
          (containedId) =>
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            presentations.find((pres) => pres.id === containedId)!
        );
        return containedPresentations.map((containedP) =>
          buildHint(containedP, leftFraction, widthFraction)
        );
      }
      return buildHint(p, leftFraction, widthFraction);
    })
    .flat()
    .flatMap((v) => (v ? [v] : [])); // filter null values
};
