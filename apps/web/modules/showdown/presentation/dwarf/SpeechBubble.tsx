import { Facing } from '../../domain/models'
import { Phrase } from '../../domain/phrases'

// The bubble sits on the side away from the losing card, with its tail at Grumli's helm. On a phone it sits above Grumli.
// Each side sets only the md: `left` or `right` it needs, so no two md: classes set the same property.
const PLACEMENT: Record<Facing, { bubble: string; tail: string }> = {
  1: {
    bubble: 'md:left-auto md:right-[calc(50%+64px)]',
    tail: 'md:left-auto md:-right-2 md:border-b-0 md:border-l-0 md:border-r-[3px] md:border-t-[3px]',
  },
  [-1]: {
    bubble: 'md:left-[calc(50%+64px)]',
    tail: 'md:-left-2 md:border-r-0 md:border-t-0 md:border-b-[3px] md:border-l-[3px]',
  },
}

interface SpeechBubbleProps {
  phrase: Phrase
  isFading: boolean
  facing: Facing
}

// Grumli's shout before the throw, such as "<kept game> WILL BE!" (.claude/specs/showdown-character-spec.md, Feature 3).
export const SpeechBubble = ({ phrase, isFading, facing }: SpeechBubbleProps) => {
  const placement = PLACEMENT[facing]
  return (
    <div
      data-testid='showdown-character-phrase'
      className={`absolute bottom-full left-1/2 mb-2 w-max max-w-[220px] -translate-x-1/2 md:bottom-auto md:top-[12%] md:mb-0 md:max-w-[280px] md:translate-x-0 ${placement.bubble} transition-opacity duration-100 ${isFading ? 'opacity-0' : 'opacity-100'}`}
    >
      <div className='relative animate-showdown-bubble rounded-2xl border-[3px] border-background bg-foreground px-4 py-2'>
        <p className='line-clamp-2 font-display text-sm font-bold uppercase leading-tight text-background md:text-lg'>
          {phrase.before}
          <span className='text-primary'>{phrase.title}</span>
          {phrase.after}
        </p>
        <span
          className={`absolute -bottom-2 left-1/2 h-3.5 w-3.5 -translate-x-1/2 rotate-45 border-b-[3px] border-r-[3px] border-background bg-foreground md:bottom-auto md:top-1/2 md:translate-x-0 md:-translate-y-1/2 ${placement.tail}`}
        />
      </div>
    </div>
  )
}
