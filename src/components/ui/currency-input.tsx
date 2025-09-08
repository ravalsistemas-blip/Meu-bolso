import React, { forwardRef } from 'react'
import { Input } from './input'
import { cn } from '@/lib/utils'
import { useSimpleCurrencyInput } from '@/hooks/useCurrencyInput'

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value?: number
  onValueChange?: (value: number) => void
  showCurrencySymbol?: boolean
}

/**
 * Componente de input com formatação automática de moeda
 * Remove as setas do input number e aplica formatação brasileira
 */
export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value = 0, onValueChange, showCurrencySymbol = false, className, placeholder = '0,00', ...props }, ref) => {
    const { 
      value: displayValue, 
      setValue, 
      getNumericValue,
      setNumericValue 
    } = useSimpleCurrencyInput(value)

    // Sincroniza com valor externo
    React.useEffect(() => {
      if (value !== getNumericValue()) {
        setNumericValue(value)
      }
    }, [value, getNumericValue, setNumericValue])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value)
      const numericValue = getNumericValue()
      onValueChange?.(numericValue)
    }

    const handleBlur = () => {
      const numericValue = getNumericValue()
      onValueChange?.(numericValue)
    }

    return (
      <div className="relative">
        {showCurrencySymbol && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
            R$
          </div>
        )}
        <Input
          ref={ref}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={cn(
            // Remove setas do input number
            '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
            showCurrencySymbol && 'pl-10',
            className
          )}
          {...props}
        />
      </div>
    )
  }
)

CurrencyInput.displayName = 'CurrencyInput'
