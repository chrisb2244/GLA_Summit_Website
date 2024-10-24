import { redirect } from 'next/navigation';
import { currentDisplayYear } from '@/app/configConstants';

export const GET = () => {
  redirect(`/presentation-list/${currentDisplayYear}`);
};
