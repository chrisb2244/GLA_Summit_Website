import { redirect } from 'next/navigation';
import LogsPage from './LogsPage';
import { createServerClient } from '@/lib/supabaseServer';
import { getUser } from '@/lib/supabase/userFunctions';

const SvrLogsPage = async () => {
  const user = await getUser();

  const supabase = await createServerClient();
  const { data, error } = await supabase.from('log_viewers').select('user_id');
  if (error || user === null) {
    redirect('/access-denied');
  }
  const allowedIds: string[] = data.map((value) => value.user_id);
  if (!allowedIds.includes(user.id)) {
    redirect('/access-denied');
  }

  const { data: initialLogs, error: logError } = await supabase
    .from('log')
    .select();
  if (logError) {
    throw logError;
  }

  return <LogsPage serverLogs={initialLogs ?? []} />;
};

export default SvrLogsPage;
