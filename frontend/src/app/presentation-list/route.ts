import { redirect } from 'next/navigation';
import { currentDisplayYear } from '@/lib/databaseModels';

export const GET = () => {
  redirect(`/presentation-list/${currentDisplayYear}`);
};
