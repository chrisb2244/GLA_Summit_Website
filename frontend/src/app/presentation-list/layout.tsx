import { Button } from '@/Components/Form/Button'
import { SummitYear } from '@/lib/databaseModels'
import NextLink from 'next/link'
import React from 'react'

const PresentationsLayout = async ({
  children
}: {
  children: React.ReactNode
}) => {
  const showAgendaLink = true

  const years: SummitYear[] = ['2022', '2021']

  return (
    <div>
      <div className='text-center'>
        <p>
          Presentations below are grouped by year, and sorted by the first
          speaker&apos;s name.
        </p>
        {showAgendaLink ? (
          <p>
            For a list by schedule, see our{' '}
            <NextLink href='/full-agenda' className='link'>
              agenda
            </NextLink>
            .
          </p>
        ) : null}
      </div>

      <div className='flex flex-row space-x-4 py-2'>
        {years.map((y) => {
          return (
            <NextLink key={y} href={`/presentation-list/${y}`}>
              <Button type='button'>{y}</Button>
            </NextLink>
          )
        })}
      </div>
      <div className='shadow'>
        {children}
      </div>
    </div>
  )
}

export default PresentationsLayout
