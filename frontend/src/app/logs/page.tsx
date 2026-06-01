import { redirect } from 'next/navigation';
import LogsPage from './LogsPage';
import { createServerClient } from '@/lib/supabaseServer';
import { createAdminClient } from '@/lib/supabaseClient';
import { getUser } from '@/lib/supabase/userFunctions';
import { Suspense } from 'react';

const SvrLogsPage = () => {
  return (
    <Suspense fallback={<p>Loading logs...</p>}>
      <SvrLogsPageContent />
    </Suspense>
  );
};

const SvrLogsPageContent = async () => {
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
    .select()
    .order('created_at', { ascending: false })
    .limit(500);
  if (logError) {
    throw logError;
  }

  const logs = initialLogs ?? [];
  const uniqueUserIds = [...new Set(logs.map((l) => l.user_id).filter((id): id is string => id !== null))];
  let userDisplayNames: Record<string, string> = {};
  if (uniqueUserIds.length > 0) {
    const admin = createAdminClient();
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, firstname, lastname')
      .in('id', uniqueUserIds);
    if (profiles) {
      userDisplayNames = Object.fromEntries(
        profiles.map((p) => [p.id, `${p.firstname} ${p.lastname[0] ?? ''}.`.trim()])
      );
    }
  }

  return <LogsPage serverLogs={logs} userDisplayNames={userDisplayNames} />;
};

export default SvrLogsPage;
