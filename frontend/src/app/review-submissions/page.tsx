'use client';
import type { NextPage } from 'next';
import { useEffect, useState } from 'react';
import {
  PresentationReviewInfo,
  SubmittedPresentationReviewCard
} from '@/Components/SubmittedPresentationReviewCard';

const ReviewSubmissionsPage: NextPage = () => {
  const [submittedPresentations, setSubmittedPresentations] = useState<
    PresentationReviewInfo[]
  >([]);
  useEffect(() => {
    fetch('/api/presentation_submissions').then((res) => {
      res.json().then((jsonValue) => {
        const { presentationSubmissions } = jsonValue as {
          presentationSubmissions: PresentationReviewInfo[];
        };
        setSubmittedPresentations(presentationSubmissions);
      });
    });
  }, []);

  const listElems = submittedPresentations
    .sort((a, b) => {
      return (
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    })
    .map((p) => {
      return (
        <SubmittedPresentationReviewCard
          presentationInfo={p}
          key={p.presentation_id}
        />
      );
    });

  return (
    <div className='mx-auto mt-4'>
      <p className='prose text-center'>
        {`Here's a list of ${submittedPresentations.length} presentations!!!`}
      </p>
      <div className='flex flex-col space-y-1'>{listElems}</div>
    </div>
  );
};

export default ReviewSubmissionsPage;
