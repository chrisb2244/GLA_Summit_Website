import { PageIntro } from '@/Components/Typography';
import { YearNav } from '@/Components/YearNav';
import React from 'react';

const PresenterListLayout = async ({
  children
}: {
  children: React.ReactNode;
}) => {
  return (
    <div>
      <PageIntro>
        Presenters below are grouped by year, and sorted by surname.
      </PageIntro>

      <YearNav basePath='/presenter-list' />
      <div className='shadow'>{children}</div>
    </div>
  );
};

export default PresenterListLayout;
