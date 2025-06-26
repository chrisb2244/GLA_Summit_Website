'use client';

import { dateToDateArray } from '@/lib/utils';
import { downloadSharableSubmissionContent } from './actions';

type DownloadButtonProps = {
  lastDownloaded: Date | null;
  presentationId: string;
};

export const DownloadButton = (props: DownloadButtonProps) => {
  const lastDownloaded = props.lastDownloaded
    ? dateToDateArray(props.lastDownloaded)
    : null;

  const lastDownloadedString = lastDownloaded
    ? lastDownloaded.slice(0, 3).join('/') +
      ' ' +
      lastDownloaded.slice(3).join(':') +
      ' UTC'
    : 'Never';

  // const downloadAction = downloadSharableSubmissionContent.bind(
  //   null,
  //   props.presentationId
  // );

  const downloadAction2 = async () => {
    const base64String = await downloadSharableSubmissionContent(
      props.presentationId
    );
    if (!base64String) {
      console.log('Error downloading presentation content');
      return;
    }
    const link = document.createElement('a');
    // data:application/zip;base64,
    link.href = `data:application/zip;base64,${base64String}`;
    link.download = `presentation-${props.presentationId}.zip`;
    link.click();
    // document.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  return (
    <form className='flex flex-grow items-center justify-center'>
      <div className='mx-auto flex h-full w-full flex-col items-center justify-center space-y-1'>
        <button
          formAction={downloadAction2}
          type='submit'
          className='rounded-md border bg-gray-100 p-2'
        >
          Download
        </button>
        <p className='text-sm'>Last downloaded: {lastDownloadedString}</p>
      </div>
    </form>
  );
};
