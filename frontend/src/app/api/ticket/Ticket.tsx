// This file must only use elements that can be rendered by next/og.
// See https://github.com/vercel/satori for more information.

import { ticketYear, startDate } from '@/app/configConstants';

type TicketProps = {
  firstName: string;
  lastName: string;
  ticketNumber: number;
  logoData: string;
  isPresenter: boolean;
  titles: string[] | null | undefined;
};

export const Ticket = (props: TicketProps) => {
  const { firstName, lastName, ticketNumber, isPresenter, logoData } = props;

  // Titles as a list if the user is a presenter
  // Return a placeholder div otherwise to ensure spacing.
  const presenterTitleElements = (
    <div tw='flex flex-col items-center text-3xl my-auto'>
      {isPresenter ? (
        <ul tw='flex flex-col'>
          {props.titles?.map((title, idx) => (
            <li key={`${idx}:${title}`}>{title}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );

  const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
  const dateString = `${startDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric'
  })} and ${endDate.toLocaleDateString('en-US', { day: 'numeric' })}`;

  return (
    <div
      tw='flex flex-row  text-white font-black text-2xl w-full h-full'
      style={{
        backgroundColor: '#5837b9',
        fillOpacity: 0.7,
        // backgroundImage: 'radial-gradient(#5837b9, #a25bcd)'
        backgroundImage: 'linear-gradient(90deg, #5837b9, #a25bcd)'
      }}
    >
      {/* Left side, text and user data */}
      <div tw='flex flex-col py-8 my-16 pl-12 pr-8 w-2/3 h-screen my-auto'>
        <div tw='flex flex-col w-full items-center'>
          <h2 tw='my-1'>
            I&apos;M {isPresenter ? 'PRESENTING AT' : 'ATTENDING'} THE
          </h2>
          <h1 tw='my-1'>GLA SUMMIT {ticketYear}</h1>
          <div tw='border-2 border-white w-full h-0.5 my-2' />
          <h4 tw='my-0'>A Global LabVIEW and Automated Test Conference</h4>
        </div>
        {presenterTitleElements}
        <div tw='flex flex-col items-center'>
          <h2 tw='my-1'>{[firstName, lastName].join(' ')}</h2>
          <h3 tw='my-1'>Ticket {ticketNumber.toString(10).padStart(4, '0')}</h3>
        </div>
      </div>

      {/* Right side, image and date */}
      <div tw='flex flex-col w-1/3 items-center justify-center'>
        <div tw='flex w-[320px] h-[320px]'>
          {/* eslint-disable-next-line @next/next/no-img-element -- 
              Must avoid Image component for sharing as a response 
          */}
          <img width={320} height={320} alt='GLA Summit Logo' src={logoData} />
        </div>
        <div tw='flex flex-col items-center justify-center mx-auto pt-8'>
          <p tw='my-0'>{dateString}</p>
          <p tw='my-0'>12:00 UTC for 24 hours</p>
        </div>
        <div tw='flex flex-col items-center mx-auto pt-8'>
          <p tw='my-0'>Get your ticket at</p>
          <p tw='my-0'>https://glasummit.org/ticket</p>
        </div>
      </div>
    </div>
  );
};
