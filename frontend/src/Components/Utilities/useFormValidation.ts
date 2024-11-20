'use client';

import { useReducer } from 'react';

export function useFormValidation() {
  const [validationMessages, setValidationMessages] = useReducer(
    (messages, changedElem: HTMLInputElement | HTMLTextAreaElement) => {
      const { validity, validationMessage, name } = changedElem;
      if (validity.valid) {
        messages.delete(name);
      } else {
        messages.set(name, validationMessage);
      }
      return messages;
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
