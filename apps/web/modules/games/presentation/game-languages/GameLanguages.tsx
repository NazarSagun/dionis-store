import { GameLanguage } from '../../integration/repository'

interface GameLanguagesProps {
  languages: GameLanguage[]
}

const COLUMNS = [
  { key: 'interface', label: 'Interface' },
  { key: 'audio', label: 'Audio' },
  { key: 'subtitles', label: 'Subtitles' },
] as const

export const GameLanguages = ({ languages }: GameLanguagesProps) => {
  if (languages.length === 0) return null

  return (
    <section data-testid='game-languages' className='flex max-w-[720px] flex-col gap-3'>
      <h2 className='border-l-4 border-primary pl-3 font-display text-xl leading-tight text-foreground'>Languages</h2>
      <div className='overflow-x-auto rounded-md border border-ink'>
        <table className='w-full font-mono text-sm'>
          <thead className='bg-panel-alt text-left text-muted-foreground'>
            <tr>
              <th scope='col' className='px-4 py-2 font-normal'>
                Language
              </th>
              {COLUMNS.map((column) => (
                <th key={column.key} scope='col' className='px-4 py-2 text-center font-normal'>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {languages.map((row) => (
              <tr key={row.language} data-testid='language-row' className='border-t border-ink text-foreground'>
                <th scope='row' className='px-4 py-2 text-left font-normal'>
                  {row.language}
                </th>
                {COLUMNS.map((column) => (
                  <td key={column.key} className='px-4 py-2 text-center'>
                    {row[column.key] ? (
                      <span className='text-primary'>
                        ✓<span className='sr-only'>Yes</span>
                      </span>
                    ) : (
                      <span className='text-muted-foreground'>
                        –<span className='sr-only'>No</span>
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
