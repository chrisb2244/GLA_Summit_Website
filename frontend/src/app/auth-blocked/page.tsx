const BlockedAuthPage = () => {
  return (
    <div className='mx-auto flex flex-col space-y-4 py-12 text-center text-lg'>
      <p>This authentication attempt was blocked.</p>
      <p>
        If you believe this to be in error, please contact one of the GLA Summit
        Organizers.
      </p>
    </div>
  );
};

export default BlockedAuthPage;
