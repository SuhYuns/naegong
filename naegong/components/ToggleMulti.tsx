'use client';
import React from 'react';
import clsx from 'clsx';

type Props = {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  columns?: 2 | 3 | 4;
};

export default function ToggleMulti({ options, value, onChange, columns = 2 }: Props) {
  const toggle = (opt: string) => {
    const exists = value.includes(opt);
    onChange(exists ? value.filter(v => v !== opt) : [...value, opt]);
  };

  const gridCols =
    columns === 4 ? 'grid-cols-4' :
    columns === 3 ? 'grid-cols-3' : 'grid-cols-2';

  return (
    <div className={clsx('grid gap-2', gridCols)}>
      {options.map(opt => {
        const active = value.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={clsx(
              'px-3 py-2 text-sm rounded-full border transition',
              active
                ? 'bg-yellow-500 text-white border-yellow-500'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
