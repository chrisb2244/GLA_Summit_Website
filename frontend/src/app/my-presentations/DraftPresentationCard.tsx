'use client';

import { useState } from 'react';
import { deleteDraftPresentation } from '@/actions/presentationSubmission';
import { CenteredDialog } from '@/Components/CenteredDialog';
import type { MyPresentationSubmissionType } from '@/lib/databaseModels';
import NextLink from 'next/link';

type DraftPresentationCardProps = {
  draft: MyPresentationSubmissionType;
};

const formatDate = (isoString: string) => {
  return new Date(isoString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const DraftPresentationCard = ({
  draft
}: DraftPresentationCardProps) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    const result = await deleteDraftPresentation(draft.presentation_id);
    setDeleting(false);
    if (!result.success) {
      setDeleteError(result.error.message);
    }
    setConfirmOpen(false);
  };

  return (
    <>
      <div className='relative left-4 mr-6 border border-secondaryc p-2'>
        <div className='flex flex-col gap-1 md:flex-row md:items-center'>
          <NextLink
            href={`/my-presentations/edit/${draft.presentation_id}`}
            className='font-medium underline hover:text-primary'
          >
            {draft.title}
          </NextLink>
          <span className='text-sm text-gray-500 md:ml-1'>
            ({draft.presentation_type})
          </span>
          <span className='text-sm italic text-gray-500 md:ml-auto'>
            Last saved:{' '}
            {draft.updated_at ? formatDate(draft.updated_at) : 'Unknown'}
          </span>
          <NextLink
            href={`/my-presentations/edit/${draft.presentation_id}`}
            className='mt-1 rounded border border-blue-400 px-2 py-0.5 text-sm text-blue-600 hover:bg-blue-50 md:ml-2 md:mt-0'
          >
            Edit
          </NextLink>
          <button
            type='button'
            onClick={() => setConfirmOpen(true)}
            className='mt-1 rounded border border-red-400 px-2 py-0.5 text-sm text-red-600 hover:bg-red-50 md:ml-2 md:mt-0'
          >
            Delete Draft
          </button>
        </div>
        {deleteError && (
          <p className='mt-1 text-sm text-red-600' role='alert'>
            {deleteError}
          </p>
        )}
      </div>

      <CenteredDialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <p className='mb-4 font-semibold'>Delete this draft?</p>
        <p className='mb-4 text-gray-700'>
          &ldquo;{draft.title}&rdquo; will be permanently deleted. This cannot
          be undone.
        </p>
        <div className='flex justify-end gap-2'>
          <button
            type='button'
            onClick={() => setConfirmOpen(false)}
            disabled={deleting}
            className='rounded border border-gray-300 px-4 py-1 hover:bg-gray-50 disabled:opacity-50'
          >
            Cancel
          </button>
          <button
            type='button'
            onClick={handleDelete}
            disabled={deleting}
            className='rounded bg-red-600 px-4 py-1 text-white hover:bg-red-700 disabled:opacity-50'
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </CenteredDialog>
    </>
  );
};
