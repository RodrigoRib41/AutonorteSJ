"use client";

import { useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

type VehicleComboboxProps = {
  label: string;
  value: string;
  options: string[];
  placeholder: string;
  emptyMessage: string;
  helpText?: string;
  errorMessage?: string;
  required?: boolean;
  disabled?: boolean;
  onChange: (value: string) => void;
};

const triggerClassName =
  "flex h-12 w-full items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white px-4 text-left text-sm text-zinc-950 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/60 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400";

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function VehicleCombobox({
  label,
  value,
  options,
  placeholder,
  emptyMessage,
  helpText,
  errorMessage,
  required = false,
  disabled = false,
  onChange,
}: VehicleComboboxProps) {
  const containerRef = useRef<HTMLLabelElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const filteredOptions = useMemo(() => {
    const normalizedQuery = normalize(query.trim());

    if (!normalizedQuery) {
      return options;
    }

    return options.filter((option) =>
      normalize(option).includes(normalizedQuery)
    );
  }, [options, query]);

  function selectValue(nextValue: string) {
    onChange(nextValue);
    setQuery("");
    setIsOpen(false);
  }

  function blurContainer(nextTarget: EventTarget | null) {
    if (
      nextTarget instanceof Node &&
      containerRef.current?.contains(nextTarget)
    ) {
      return;
    }

    setIsOpen(false);
    setQuery("");
  }

  return (
    <label
      ref={containerRef}
      className="relative space-y-2"
      onBlur={(event) => blurContainer(event.relatedTarget)}
    >
      <span className="text-sm font-medium text-zinc-700">{label}</span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((current) => !current)}
        className={triggerClassName}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={value ? "truncate" : "truncate text-zinc-400"}>
          {value || placeholder}
        </span>
        <ChevronDown className="size-4 shrink-0 text-zinc-500" />
      </button>
      <input type="hidden" value={value} required={required} readOnly />

      {isOpen ? (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-[1.25rem] border border-zinc-200 bg-white shadow-[0_24px_60px_rgba(24,24,27,0.16)]">
          <div className="flex items-center gap-2 border-b border-zinc-100 px-3 py-3">
            <Search className="size-4 text-zinc-400" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-8 min-w-0 flex-1 border-0 bg-transparent text-sm text-zinc-950 outline-none placeholder:text-zinc-400"
              placeholder="Buscar..."
              autoFocus
            />
          </div>
          <div className="max-h-64 overflow-y-auto p-2" role="listbox">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isSelected = option === value;

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => selectValue(option)}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                      isSelected
                        ? "bg-zinc-950 text-white"
                        : "text-zinc-700 hover:bg-zinc-100"
                    }`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <span className="min-w-0 truncate">{option}</span>
                    {isSelected ? <Check className="size-4 shrink-0" /> : null}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-8 text-center text-sm leading-6 text-zinc-500">
                {emptyMessage}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {errorMessage ? (
        <p className="text-sm text-red-600">{errorMessage}</p>
      ) : helpText ? (
        <p className="text-sm text-zinc-500">{helpText}</p>
      ) : null}
    </label>
  );
}
