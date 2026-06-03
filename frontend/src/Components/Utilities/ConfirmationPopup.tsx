'use client';
import { CenteredDialog } from '@/Components/CenteredDialog';

export type PopupProps = {
  open: boolean;
  setClosed: () => void;
  onResolve: (response: boolean) => void;
  children?: React.ReactNode;
};

export const ConfirmationPopup: React.FC<
  React.PropsWithChildren<PopupProps>
> = (props) => {
  const resolveFn = (response: boolean) => {
    props.setClosed();
    props.onResolve(response);
  };

  return (
    <CenteredDialog open={props.open} onClose={() => props.setClosed()}>
      {props.children}
      <div className='mt-4 flex flex-col gap-2 md:flex-row md:justify-end'>
        <button
          type='button'
          onClick={() => resolveFn(false)}
          className='rounded border border-gray-300 px-4 py-1 hover:bg-gray-50'
        >
          Cancel
        </button>
        <button
          type='button'
          onClick={() => resolveFn(true)}
          className='rounded bg-primaryc px-4 py-1 text-white hover:bg-primaryc.light'
        >
          Confirm
        </button>
      </div>
    </CenteredDialog>
  );
};
