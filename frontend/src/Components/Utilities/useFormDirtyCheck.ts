'use client';
import { useReducer } from 'react';

export function useFormDirtyCheck() {
  const [dirtyElems, dispatchDirtyElems] = useReducer(
    (
      prevElems,
      changedElem: HTMLInputElement | HTMLTextAreaElement | 'reset'
    ) => {
      if (changedElem === 'reset') {
        return new Set<string>();
      }
      const { name } = changedElem;
      let { value, defaultValue } = changedElem;
      const newElems = new Set(prevElems);
      value = value.replaceAll('\r\n', '\n');
      defaultValue = defaultValue.replaceAll('\r\n', '\n');
      if (value !== defaultValue) {
        newElems.add(name);
      } else {
        newElems.delete(name);
      }
      return newElems;
    },
    new Set<string>()
  );

  return {
    dirtyFields: dirtyElems,
    isDirty: dirtyElems.size > 0,
    updateDirtiness: (element: HTMLInputElement | HTMLTextAreaElement) =>
      dispatchDirtyElems(element),
    reset: () => dispatchDirtyElems('reset')
  };
}
