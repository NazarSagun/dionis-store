import Image from 'next/image'

interface LeftContentBlockProps {
  variant: 'login' | 'signup'
}

export const LeftContentBlock = ({ variant }: LeftContentBlockProps) => {
  return (
    <div className='md:pt-[50px]'>
      <h3 className='font-display text-lg leading-relaxed text-neon-cyan'>
        {variant === 'login' ? 'Welcome back!' : 'Welcome to Dionis community!'}
      </h3>
      {variant === 'login' ? (
        <Image alt='Login' src='/images/svg/login.svg' width={500} height={500} />
      ) : (
        <Image alt='Login' src='/images/svg/signup.svg' width={500} height={500} />
      )}
    </div>
  )
}
