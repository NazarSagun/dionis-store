import { useEffect, useRef, useState } from 'react'
import classes from './Select.module.css'
import clsx from 'clsx'

export interface SelectProps {
  onChange: (number: number) => void
  selectedOption: number
}

export const Select = ({ onChange, selectedOption }: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedNumber, setSelectedOption] = useState(selectedOption || 1)
  const selectRef = useRef<HTMLDivElement>(null)

  const boxStyles = clsx(classes.selectBox, isOpen && classes.open)

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
    <div className={classes.select} ref={selectRef}>
      <div data-testid='select' className={boxStyles} onClick={toggleDropdown}>
        <div className={classes.selectedNumber}>{selectedNumber}</div>
        <div className={classes.arrow}></div>
      </div>
      {isOpen && (
        <div className={classes.options}>
          {options.map((option) => (
            <div
              data-testid={`option-${option}`}
              key={option}
              className={clsx(classes.option, option === selectedNumber && classes.selected)}
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
