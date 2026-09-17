import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

export interface SelectProps {
  onChange: (number: number) => void
  selectedOption: number
}

export const Select = ({ onChange, selectedOption }: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedNumber, setSelectedOption] = useState(selectedOption || 1)
  const selectRef = useRef<HTMLDivElement>(null)

  const toggleDropdown = () => {
    setIsOpen(!isOpen)
  }

  const handleOptionClick = (option: number) => {
    setSelectedOption(option)
    onChange(option)
    setIsOpen(false)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [selectRef])

  const options = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  return (
    <div className='relative w-[60px]' ref={selectRef}>
      <div
        data-testid='select'
        className={cn(
          'flex cursor-pointer items-center justify-between rounded border border-[#292b2f] bg-[#292b2f] px-2.5 py-[5px] text-white shadow-[0px_0px_0px_2px_transparent] transition-shadow duration-200 ease-in-out',
          isOpen && 'shadow-[0px_0px_0px_2px_var(--success-color)]'
        )}
        onClick={toggleDropdown}
      >
        <div className='text-sm'>{selectedNumber}</div>
        <div className='h-0 w-0 border-x-[5px] border-t-[5px] border-x-transparent border-t-white' />
      </div>
      {isOpen && (
        <div className='absolute left-0 top-[110%] z-10 flex w-full flex-col gap-[5px] rounded bg-[#333] p-[5px]'>
          {options.map((option) => (
            <div
              data-testid={`option-${option}`}
              key={option}
              className={cn(
                'cursor-pointer rounded-[5px] bg-[#333] px-[5px] text-sm text-white transition-colors duration-200 ease-in-out hover:bg-[#444]',
                option === selectedNumber && 'bg-[var(--success-color)] opacity-60'
              )}
              onClick={() => handleOptionClick(option)}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
