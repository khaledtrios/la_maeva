import { useState } from 'react'

interface PinInputProps {
  value: string
  onChange: (value: string) => void
}

export function PinInput({ value, onChange }: PinInputProps) {
  const [focusedIndex, setFocusedIndex] = useState(0)

  const handleChange = (index: number, digit: string) => {
    if (!/^\d*$/.test(digit)) return

    const newValue = value.split('')
    newValue[index] = digit
    const finalValue = newValue.join('').slice(0, 4)
    onChange(finalValue)

    // Auto-focus following
    if (digit && index < 3) {
      setFocusedIndex(index + 1)
    } else if (!digit && index > 0) {
      setFocusedIndex(index - 1)
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      setFocusedIndex(index - 1)
    } else if (e.key === 'ArrowLeft' && index > 0) {
      setFocusedIndex(index - 1)
    } else if (e.key === 'ArrowRight' && index < 3) {
      setFocusedIndex(index + 1)
    }
  }

  return (
    <div className="flex gap-3 justify-center">
      {[0, 1, 2, 3].map((i) => (
        <input
          key={i}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={() => setFocusedIndex(i)}
          className={`w-14 h-14 text-center text-2xl font-bold border-2 rounded-lg
            ${focusedIndex === i ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'}
          `}
        />
      ))}
    </div>
  )
}
