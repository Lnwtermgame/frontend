import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { ChevronDown, Check } from "lucide-react";

const selectTriggerVariants = cva(
  "flex w-full items-center justify-between bg-site-surface border border-site-border text-site-text placeholder:text-site-dim focus-visible:outline-none focus-visible:border-site-accent focus-visible:ring-2 focus-visible:ring-site-accent/20 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
  {
    variants: {
      size: {
        default: "h-11 px-3 text-sm rounded-6",
        sm: "h-9 px-3 text-sm rounded-6",
        lg: "h-12 px-3 text-base rounded-8",
      },
      error: {
        true: "border-status-danger focus-visible:border-status-danger focus-visible:ring-status-danger/20",
        false: "",
      },
    },
    defaultVariants: {
      size: "default",
      error: false,
    },
  },
);

export interface SelectOption {
  label: string;
  value: string | number;
}

export interface SelectProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "onSelect">,
    VariantProps<typeof selectTriggerVariants> {
  label?: React.ReactNode;
  errorText?: string;
  options: SelectOption[];
  value?: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
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
  id,
  ...props
}: SelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const listboxId = React.useId();
  const reactId = React.useId();
  const triggerId = id ?? `select-${reactId}`;
  const labelId = `${triggerId}-label`;
  const hasError = error || !!errorText;

  const selectedOption = options.find(
    (opt) => String(opt.value) === String(value),
  );

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (optionValue: string | number) => {
    onChange(String(optionValue));
    setIsOpen(false);
  };

  return (
    <div className="w-full space-y-1.5" ref={containerRef}>
      {label && (
        <label
          id={labelId}
          htmlFor={triggerId}
          className={cn(
            "text-sm font-medium text-site-text block",
            hasError && "text-status-danger",
          )}
        >
          {label}
        </label>
      )}
      <div className="relative">
        <button
          id={triggerId}
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-labelledby={label ? labelId : undefined}
          aria-controls={isOpen ? listboxId : undefined}
          className={cn(
            selectTriggerVariants({ size, error: hasError }),
            !selectedOption && "text-site-dim",
            className,
          )}
          disabled={disabled}
        >
          <span className="truncate text-left flex-1">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            size={18}
            className={cn(
              "text-site-dim transition-transform ml-2 flex-shrink-0",
              isOpen && "rotate-180",
            )}
          />
        </button>

        {isOpen && (
          <ul
            id={listboxId}
            role="listbox"
            aria-labelledby={label ? labelId : triggerId}
            className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto bg-site-surface border border-site-border rounded-8"
          >
            {options.map((option) => {
              const isSelected = String(option.value) === String(value);
              return (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={0}
                  onClick={() => handleSelect(option.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleSelect(option.value);
                    }
                  }}
                  className={cn(
                    "cursor-pointer flex items-center justify-between px-3 py-2 text-sm hover:bg-site-raised",
                    isSelected && "bg-site-raised text-site-accent",
                  )}
                >
                  <span className="truncate mr-2">{option.label}</span>
                  {isSelected && (
                    <Check size={16} className="text-site-accent flex-shrink-0" />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {errorText && (
        <p role="alert" className="text-sm text-status-danger">
          {errorText}
        </p>
      )}
    </div>
  );
}