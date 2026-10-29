import { parseSectionBody } from '../../domain/section-body'
import { GameSection } from '../../integration/repository'

interface GameSectionsProps {
  sections: GameSection[]
}

export const GameSections = ({ sections }: GameSectionsProps) => {
  if (sections.length === 0) return null

  return (
    <div className='flex max-w-[720px] flex-col gap-10'>
      {sections.map((section) => (
        <section key={section.kind} data-testid='game-section' data-kind={section.kind} className='flex flex-col gap-3'>
          <h2
            data-testid='game-section-title'
            className='border-l-4 border-primary pl-3 font-display text-xl leading-tight text-foreground'
          >
            {section.title}
          </h2>
          <div
            data-testid='game-section-body'
            className='flex flex-col gap-3 font-mono text-base leading-relaxed text-muted-foreground'
          >
            {parseSectionBody(section.body).map((block) =>
              block.type === 'paragraph' ? (
                <p key={block.text}>{block.text}</p>
              ) : (
                <ul key={block.items.join('\n')} className='flex flex-col gap-2'>
                  {block.items.map((item) => (
                    <li key={item} className="flex gap-3 before:text-primary before:content-['▸']">
                      {item}
                    </li>
                  ))}
                </ul>
              ),
            )}
          </div>
        </section>
      ))}
    </div>
  )
}
