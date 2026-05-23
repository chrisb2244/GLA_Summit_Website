'use client';

import { useState } from 'react';
import type { FocusEvent } from 'react';
import type { $ZodErrorTree } from 'zod/v4/core';

type ZodErrorTreeLike = {
  errors?: string[];
  properties?: Record<string, ZodErrorTreeLike | undefined>;
  items?: Array<ZodErrorTreeLike | undefined>;
};

const getNodeAtPath = (
  tree: ZodErrorTreeLike | undefined,
  path: string | undefined
): ZodErrorTreeLike | undefined => {
  if (tree === undefined || path === undefined || path.length === 0) {
    return tree;
  }

  const parts = path.split('.').filter((part) => part.length > 0);
  let node: ZodErrorTreeLike | undefined = tree;

  for (const part of parts) {
    if (node === undefined) {
      return undefined;
    }

    if (/^\d+$/.test(part)) {
      const index = Number(part);
      node = node.items?.[index];
      continue;
    }

    node = node.properties?.[part];
  }

  return node;
};

export const getErrorFromZodTree = (
  tree: ZodErrorTreeLike | undefined,
  path: string | undefined
): string | undefined => {
  const node = getNodeAtPath(tree, path);
  if (
    node === undefined ||
    node.errors === undefined ||
    node.errors.length === 0
  ) {
    return undefined;
  }
  return node.errors.join(', ');
};

type UseTouchedFieldErrorsOptions<FieldName extends string> = {
  validationMessages?: Map<string, string>;
  fieldErrors?: Partial<Record<FieldName, string | undefined>>;
  zodErrors?: $ZodErrorTree<unknown> | ZodErrorTreeLike;
  initialTouched?: Iterable<FieldName>;
};

type GetFieldErrorOptions = {
  zodPath?: string;
  requireTouched?: boolean;
};

export const useTouchedFieldErrors = <FieldName extends string>(
  options: UseTouchedFieldErrorsOptions<FieldName>
) => {
  const { validationMessages, fieldErrors, zodErrors, initialTouched } =
    options;

  const [touchedFields, setTouchedFields] = useState<Set<FieldName>>(
    () => new Set(initialTouched)
  );

  const addField = (field: FieldName) => {
    setTouchedFields((previous) => {
      if (previous.has(field)) {
        return previous;
      }
      const next = new Set(previous);
      next.add(field);
      return next;
    });
  };

  const onBlurFor = (allowedFields?: readonly FieldName[]) => {
    const allowedSet =
      allowedFields === undefined
        ? undefined
        : new Set<FieldName>(allowedFields);

    return (event: FocusEvent<Element>) => {
      const target = event.target;
      if (
        !(target instanceof HTMLInputElement) &&
        !(target instanceof HTMLTextAreaElement) &&
        !(target instanceof HTMLSelectElement)
      ) {
        return;
      }

      const field = target.name as FieldName;
      if (allowedSet !== undefined && !allowedSet.has(field)) {
        return;
      }
      addField(field);
    };
  };

  const getFieldError = (
    field: FieldName,
    options?: GetFieldErrorOptions
  ): string | undefined => {
    const requireTouched = options?.requireTouched ?? true;
    if (requireTouched && !touchedFields.has(field)) {
      return undefined;
    }

    const clientError = validationMessages?.get(field);
    if (typeof clientError === 'string' && clientError.length > 0) {
      return clientError;
    }

    const fieldError = fieldErrors?.[field];
    if (typeof fieldError === 'string' && fieldError.length > 0) {
      return fieldError;
    }

    const zodPath = options?.zodPath ?? field;
    return getErrorFromZodTree(zodErrors, zodPath);
  };

  return {
    touchedFields,
    addField,
    onBlurFor,
    getFieldError
  };
};
