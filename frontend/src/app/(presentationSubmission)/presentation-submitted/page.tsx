import Link from 'next/link';

const PresentationSubmittedPage = () => {
  return (
    <div className='prose mx-auto pt-4 text-center'>
      <h3>Your presentation was submitted successfully</h3>
      <p>
        Thank you for your submission. You should expect to receive an email
        shortly.
      </p>
      <Link href='/my-presentations' className='link'>
        Go back to My Presentations
      </Link>
    </div>
  );
};

export default PresentationSubmittedPage;
