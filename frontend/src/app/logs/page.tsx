import { Database } from '@/lib/sb_databaseModels'
import { redirect } from 'next/navigation'
import LogsPage from './LogsPage'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const SvrLogsPage = async () => {
  const supabase = createServerComponentClient<Database>({ cookies })
  const user = (await supabase.auth.getUser()).data.user

  const { data, error } = await supabase.from('log_viewers').select('user_id')
  if (error || user === null) {
    redirect('/access-denied')
  }
  const allowedIds: string[] = data.map((value) => value.user_id)
  if (!allowedIds.includes(user.id)) {
    redirect('/access-denied')
  }

  const { data: initialLogs, error: logError } = await supabase
    .from('log')
    .select()

  return <LogsPage serverLogs={initialLogs ?? []} />
}

export default SvrLogsPage
