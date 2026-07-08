import { generateAvatarIcon } from '@/actions/generateAvatarIcon';
import { createRouteHandlerClient } from '@/lib/supabaseServer';
import { logToDb } from '@/lib/utils';
import { NextResponse } from 'next/server';

type ResponseType =
  | {
      iconUrl: string;
    }
  | {
      error: string;
    };

type RequestBody = {
  userId?: unknown;
  remoteFilePath?: unknown;
  originalProfileURL?: unknown;
};

const jsonError = (error: string, status: number) => {
  return NextResponse.json({ error }, { status });
};

const parseBody = (body: RequestBody) => {
  const { userId, remoteFilePath, originalProfileURL } = body;
  if (typeof userId !== 'string' || typeof remoteFilePath !== 'string') {
    return null;
  }
  if (originalProfileURL != null && typeof originalProfileURL !== 'string') {
    return null;
  }
  return { userId, remoteFilePath, originalProfileURL: originalProfileURL ?? null };
};

export async function POST(req: Request): Promise<NextResponse<ResponseType>> {
  const supabase = await createRouteHandlerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    return jsonError('unauthorized', 401);
  }

  const parsedBody = parseBody(await req.json());
  if (parsedBody == null) {
    return jsonError('invalid body', 400);
  }

  const cookieUserId = data.user.id;
  const { userId, remoteFilePath, originalProfileURL } = parsedBody;
  if (cookieUserId !== userId) {
    return jsonError('unauthorized', 401);
  }

  try {
    const iconPath = await generateAvatarIcon(remoteFilePath, originalProfileURL);
    if (iconPath == null) {
      return jsonError('Could not generate the icon image', 500);
    }
    return NextResponse.json({ iconUrl: iconPath });
  } catch (e) {
    await logToDb('error', 'Avatar icon generation failed', 'api/avatar-update', {
      userId: cookieUserId,
      context: { message: e instanceof Error ? e.message : String(e) }
    });
    return jsonError('internal server error', 500);
  }
}
