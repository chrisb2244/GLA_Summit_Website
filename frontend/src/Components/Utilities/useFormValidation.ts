'use client';

import { useReducer } from 'react';

export function useFormValidation() {
  const [validationMessages, setValidationMessages] = useReducer(
    (
      messages: Map<string, string>,
      changedElem: HTMLInputElement | HTMLTextAreaElement
    ) => {
      const { validity, validationMessage, name } = changedElem;
      const nextMessages = new Map(messages);

      if (validity.valid) {
        nextMessages.delete(name);
      } else {
        nextMessages.set(name, validationMessage);
      }

      return nextMessages;
    },
    new Map<string, string>()
  );

  return {
    validationMessages,
    checkValidity: (element: HTMLInputElement | HTMLTextAreaElement) => {
      setValidationMessages(element);
    }
  };
}
