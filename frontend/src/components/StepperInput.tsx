"use client";

import { Minus, Plus } from "lucide-react";

interface StepperInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  ariaLabel?: string;
}

export default function StepperInput({
  value,
  onChange,
  min = 1,
  max = 99,
  ariaLabel = "Numeric value",
}: StepperInputProps) {
  const decrement = () => {
    if (value > min) onChange(value - 1);
  };

  const increment = () => {
    if (value < max) onChange(value + 1);
  };

  return (
    <div className="flex items-center justify-between px-2 py-[11px] bg-white rounded-full w-[100px] h-[44px]">
      <button
        type="button"
        onClick={decrement}
        disabled={value <= min}
        aria-label={`Decrease ${ariaLabel}`}
        className="w-4 h-4 flex items-center justify-center text-[#dadada] hover:text-[#303030] disabled:opacity-40 transition-colors"
      >
        <Minus size={16} strokeWidth={1.5} />
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const nextValue = Number(e.target.value);
          if (!Number.isNaN(nextValue)) onChange(nextValue);
        }}
        aria-label={ariaLabel}
        className="w-10 bg-transparent text-base font-medium text-[#303030] text-center outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={increment}
        disabled={value >= max}
        aria-label={`Increase ${ariaLabel}`}
        className="w-4 h-4 flex items-center justify-center text-[#dadada] hover:text-[#303030] disabled:opacity-40 transition-colors"
      >
        <Plus size={16} strokeWidth={1.5} />
      </button>
    </div>
  );
}
