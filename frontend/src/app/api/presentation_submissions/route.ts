import { submissionsForYear } from '@/lib/databaseModels';
import { redirect } from 'next/navigation';

export function GET() {
  // Default to 'this' year
  redirect('/api/presentation_submissions/' + submissionsForYear);
}
