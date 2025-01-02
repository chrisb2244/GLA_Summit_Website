import { createRouteHandlerClient } from '@/lib/supabaseServer';
import { fullUrlToIconUrl } from '@/lib/utils';
import sharp from 'sharp';
import { NextResponse } from 'next/server';

type ResponseType =
  | {
      iconUrl: string;
    }
  | {
      error: string;
    };

export async function POST(req: Request): Promise<NextResponse<ResponseType>> {
  const supabase = await createRouteHandlerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const cookieUserId = data.user.id;
  const { userId, remoteFilePath } = await req.json();
  if (cookieUserId !== userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (typeof userId !== 'string' || typeof remoteFilePath !== 'string') {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  try {
    const { data: fullSizeImage, error: downloadError } = await supabase.storage
      .from('avatars')
      .download(remoteFilePath);
    if (downloadError) {
      return NextResponse.json(
        { error: 'Could not fetch the uploaded image' },
        { status: 404 }
      );
    }
    const fullSizeBuffer = await fullSizeImage.arrayBuffer();

    const iconSizeImage = await sharp(fullSizeBuffer)
      .resize(128, 128)
      .webp()
      .toBuffer();
    const iconPath = fullUrlToIconUrl(remoteFilePath);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(iconPath, iconSizeImage, {
        contentType: 'image/webp',
        upsert: true
      });
    if (uploadError) {
      return NextResponse.json(
        { error: 'Could not upload the icon image' },
        { status: 500 }
      );
    }
    return NextResponse.json({
      iconUrl: uploadData.path
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: 'internal server error' },
      { status: 500 }
    );
  }
}
