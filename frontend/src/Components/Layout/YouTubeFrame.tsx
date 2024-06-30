export const YouTubeFrame: React.FC<{
  videoLink: string | undefined | null;
}> = ({ videoLink }) => {
  if (!videoLink) {
    return null;
  }

  let videoSrc = videoLink;
  const isEmbedLink = /^https:\/\/www\.youtube\.com\/embed\//.test(videoLink);
  if (!isEmbedLink) {
    switch (true) {
      case videoLink.includes('youtu.be'):
        videoSrc = videoLink.replace('youtu.be', 'youtube.com/embed');
        break;
      case videoLink.includes('watch?v='):
        videoSrc = videoLink.replace('watch?v=', 'embed/');
        break;
      default:
        return null;
    }
  }

  // Prevent the addition of 3rd-party tracking cookie from YouTube
  videoSrc = videoSrc.replace('youtube.com', 'youtube-nocookie.com');

  return (
    <div className='relative my-4 h-0 w-full pb-[56.5%]'>
      <iframe
        className='absolute left-0 top-0 h-full w-full'
        id='yt_player'
        typeof='text/html'
        src={videoSrc}
        allowFullScreen
        referrerPolicy='strict-origin-when-cross-origin' // This is the default anyway
      />
    </div>
  );
};
