import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

// Workflow disabled: the server actions must refuse before any auth/DB work,
// regardless of token validity (no reliance on token-absence/obscurity).
vi.mock('@/app/configConstants', () => ({
  COPRESENTER_INVITE_WORKFLOW: false
}));

vi.mock('@/lib/supabaseClient', () => ({ createAdminClient: vi.fn() }));
vi.mock('@/lib/supabaseServer', () => ({ createServerActionClient: vi.fn() }));
vi.mock('@/lib/sendMail', () => ({ sendMailApi: vi.fn() }));
vi.mock('@/lib/utils', () => ({ logToDb: vi.fn() }));
vi.mock('@/EmailTemplates/FormSubmissionEmail', () => ({
  CopresenterResponseNotificationEmailFn: vi.fn(() => ({ body: '', bodyPlain: '' }))
}));

import { respondToInvite, submitInviteResponse } from './actions';
import { createServerActionClient } from '@/lib/supabaseServer';
import { createAdminClient } from '@/lib/supabaseClient';

describe('invite server actions when the workflow is disabled', () => {
  it('respondToInvite refuses without touching auth or the database', async () => {
    const result = await respondToInvite('any-token', 'accept');
    expect(result.success).toBe(false);
    expect((result as { success: false; error: string }).error).toMatch(
      /not currently available/i
    );
    expect(createServerActionClient).not.toHaveBeenCalled();
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it('submitInviteResponse (valid form data) is refused via respondToInvite', async () => {
    const formData = new FormData();
    formData.set('token', 'any-token');
    formData.set('action', 'accept');
    const result = await submitInviteResponse(null, formData);
    expect(result.success).toBe(false);
    expect((result as { success: false; error: string }).error).toMatch(
      /not currently available/i
    );
  });
});
