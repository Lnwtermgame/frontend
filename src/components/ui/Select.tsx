import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { ChevronDown, Check } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"

const selectTriggerVariants = cva(
  "flex w-full items-center justify-between bg-white border-[2px] border-gray-300 px-3 py-2 text-base ring-offset-white placeholder:text-gray-400 focus:outline-none focus:border-black disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
  {
    variants: {
      size: {
        default: "h-12",
        sm: "h-10",
        lg: "h-14",
      },
      error: {
        true: "border-red-500",
        false: "",
      },
    },
    defaultVariants: {
      size: "default",
      error: false,
    },
  }
)

export interface SelectOption {
  label: string
  value: string | number
}

export interface SelectProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "onSelect">,
    VariantProps<typeof selectTriggerVariants> {
  label?: React.ReactNode
  errorText?: string
  options: SelectOption[]
  value?: string | number
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function Select({
  className,
  size,
  error,
  label,
  errorText,
  options,
  value,
  onChange,
  placeholder = "Select option",
  disabled,
  ...props
}: SelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => String(opt.value) === String(value))
  const hasError = error || !!errorText

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleSelect = (optionValue: string | number) => {
    onChange(String(optionValue))
    setIsOpen(false)
  }

  return (
    <div className="w-full space-y-1.5" ref={containerRef}>
      {label && (
        <label
          className={cn(
            "text-sm font-bold text-gray-700 thai-font block mb-1",
            hasError && "text-red-500"
          )}
        >
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={cn(
            selectTriggerVariants({ size, error: hasError, className }),
            !selectedOption && "text-gray-500",
            isOpen && "border-black"
          )}
          disabled={disabled}
        >
          <span className="truncate text-left flex-1">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            size={20}
            className={cn(
              "text-gray-500 transition-transform duration-200 ml-2 flex-shrink-0",
              isOpen && "rotate-180"
            )}
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto bg-white border-[2px] border-black shadow-lg"
            >
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 text-left text-base hover:bg-gray-100 transition-colors",
                    String(option.value) === String(value) &&
                      "bg-brutal-yellow/20 font-bold"
                  )}
                >
                  <span className="truncate mr-2">{option.label}</span>
                  {String(option.value) === String(value) && (
                    <Check size={16} className="text-black flex-shrink-0" />
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {errorText && (
        <p className="text-sm text-red-500 font-medium thai-font mt-1">
          {errorText}
        </p>
      )}
    </div>
  )
}
