'use server';

import { createServerClient } from '@/lib/supabaseServer';
import { joinNames } from '@/lib/utils';
import JSZip from 'jszip';

export const downloadSharableSubmissionContent = async (
  presentationId: string
) => {
  const supabase = await createServerClient();
  const { user } = (await supabase.auth.getUser()).data;
  const isOrganizer = user
    ? (await supabase.from('organizers').select('*').eq('id', user.id))
        .count !== 0
    : false;
  if (!isOrganizer) {
    console.error('User is not an organizer');
    return;
  }

  const { data: presentation, error } = await supabase
    .from('presentation_submissions')
    .select('title, abstract, presentation_type, submitter_id')
    .eq('id', presentationId)
    .single();
  if (error) {
    console.error('Error downloading presentation content:', error);
    return;
  }

  const { data: presenterData, error: presentersError } = await supabase
    .from('presentation_presenters')
    .select('presenter_id')
    .eq('presentation_id', presentationId);
  if (presentersError) {
    console.error('Error downloading presenters:', presentersError);
    return;
  }

  const presenterIds = presenterData.map((p) => p.presenter_id);
  const { data: presenters, error: presentersError2 } = await supabase
    .from('profiles')
    .select('id, firstname, lastname, avatar_url, bio')
    .in('id', presenterIds);
  if (presentersError2) {
    console.error('Error downloading presenters:', presentersError2);
    return;
  }

  const { data: presenterEmails, error: emailsError } = await supabase
    .from('email_lookup')
    .select('*')
    .in('id', presenterIds);

  if (emailsError) {
    console.error('Error downloading presenter emails:', emailsError);
    return;
  }

  const orderedEmails = presenters.map(({ id }) => {
    const email = presenterEmails.find((email) => email.id === id);
    return email ? email.email : '';
  });

  const content =
  'Name:\n' +
  joinNames(presenters[0]) + '\n\n' +
  'Email:\n' +
  orderedEmails[0] + '\n\n' +
  'Title:\n' +
  presentation.title + '\n\n' +
  'Abstract:\n' +
  presentation.abstract;

  const zip = new JSZip();
  const firstPresenterName = joinNames(presenters[0]);
  const rawFileName = `${firstPresenterName}_${presentation.title}`;
  const safeFileName = rawFileName
  .replace(/[^a-z0-9]/gi, '_')
  .replace(/_+/g, '_') 
  .slice(0, 100);   
  zip.file(`${safeFileName}.txt`, content);
  const filePromises = Promise.all(
    presenters.map(async (p) => {
      if (!p.avatar_url) return;
      const imgBlob = await supabase.storage
        .from('avatars')
        .download(p.avatar_url)
        .then(({ data, error }) => {
          if (error) {
            // Can't get the image for some reason
            return null;
          }
          return data;
        });
      if (!imgBlob) return;
      try {
        const [expectedImageString, extn] = imgBlob.type.split('/');
        if (expectedImageString !== 'image') {
          console.error('Image is not of type image/*');
          return;
        }
        zip.file(
          `${p.firstname.trim()}_${p.lastname.trim()}.${extn}`,
          imgBlob.arrayBuffer(), // Promise is accepted here, no need to await
          {
            base64: true
          }
        );
      } catch (e) {
        console.error('Error adding image to zip:', e);
      }
    })
  );
  // Wait for all images to be added to the zip
  await filePromises;
  // Generate the zip file
  const zipBase64 = await zip.generateAsync({ type: 'base64' });

  await supabase.from('review_download_information').upsert({
    presentation_id: presentationId,
    viewer_id: user?.id,
    last_downloaded: new Date().toISOString()
  });

  return zipBase64;
};