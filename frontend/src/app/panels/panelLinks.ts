export const getPanelLink = (title: string) => {
  // TODO - in a future year, fix this rather than being hardcoded
  switch (title) {
    case 'How to make Open-Source more worthwhile?':
      return '/panels/open-source';
    case 'LabVIEW and Python - A Discussion':
      return '/panels/labview-and-python';
    default:
      throw new Error('Unknown panel title: ' + title);
  }
};
