import type { MyPresentationSubmissionType } from '@/lib/databaseModels';

type Props = {
  presentation: MyPresentationSubmissionType;
};

const statusBadge = (status: string) => {
  if (status === 'accepted') {
    return (
      <span className='ml-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700'>
        Accepted
      </span>
    );
  }
  if (status === 'declined') {
    return (
      <span className='ml-1 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700'>
        Declined
      </span>
    );
  }
  return (
    <span className='ml-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700'>
      Pending
    </span>
  );
};

export const CopresenterStatusList = ({ presentation }: Props) => {
  const {
    all_presenters_ids,
    all_presenter_emails,
    all_presenter_statuses,
    all_firstnames,
    all_lastnames,
    submitter_id
  } = presentation;

  const copresenters = all_presenters_ids
    .map((id, i) => ({
      id,
      email: all_presenter_emails?.[i] ?? '',
      status: all_presenter_statuses?.[i] ?? 'pending',
      firstname: all_firstnames?.[i] ?? null,
      lastname: all_lastnames?.[i] ?? null
    }))
    .filter((p) => p.id !== submitter_id);

  if (copresenters.length === 0) return null;

  return (
    <div className='mt-1'>
      <p className='text-xs font-semibold uppercase text-gray-500'>Co-presenters</p>
      <ul className='mt-0.5 space-y-0.5'>
        {copresenters.map((cp) => {
          const name =
            cp.status === 'accepted' && (cp.firstname || cp.lastname)
              ? `${cp.firstname ?? ''} ${cp.lastname ?? ''}`.trim()
              : null;
          return (
            <li key={cp.id} className='flex items-center text-sm'>
              {name ? (
                <span>
                  {name} <span className='text-gray-500'>({cp.email})</span>
                </span>
              ) : (
                <span className='text-gray-700'>{cp.email}</span>
              )}
              {statusBadge(cp.status)}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
