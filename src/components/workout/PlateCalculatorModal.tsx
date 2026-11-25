'use client';

import React, { useEffect, useState } from 'react';
import { X, Scale, Plus, Minus } from 'lucide-react';
import { calculatePlates } from '@/lib/plate-calculator';

interface PlateCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWeight?: number;
  unit?: 'lbs' | 'kg';
  defaultBarWeight?: number;
}

export default function PlateCalculatorModal({
  isOpen,
  onClose,
  initialWeight = 135,
  unit = 'lbs',
  defaultBarWeight = 45,
}: PlateCalculatorModalProps) {
  const [targetWeight, setTargetWeight] = useState(initialWeight);
  const [barWeight, setBarWeight] = useState(defaultBarWeight);

  // Sync local inputs whenever the modal opens for a different exercise or unit
  useEffect(() => {
    if (isOpen) {
      setTargetWeight(initialWeight);
      setBarWeight(defaultBarWeight);
    }
  }, [isOpen, initialWeight, defaultBarWeight]);

  if (!isOpen) return null;

  const result = calculatePlates(targetWeight, barWeight, unit);
  const stepIncrement = unit === 'kg' ? 2.5 : 5;

  const adjustWeight = (delta: number) => {
    setTargetWeight((prev) => Math.max(barWeight, Math.round((prev + delta) * 10) / 10));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-zinc-100">Plate Calculator</h2>
              <p className="text-xs text-zinc-400">Barbell load per side</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 bg-zinc-800/60 active-press"
            aria-label="Close plate calculator"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Weight Selector */}
        <div className="flex items-center justify-between bg-zinc-950 p-4 rounded-xl border border-zinc-800">
          <div className="space-y-1">
            <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
              Target Weight
            </label>
            <div className="flex items-baseline gap-1.5">
              <input
                type="number"
                inputMode="decimal"
                value={targetWeight || ''}
                onChange={(e) => setTargetWeight(Math.max(0, Number(e.target.value) || 0))}
                className="w-24 bg-transparent text-3xl font-black text-emerald-400 focus:outline-none"
              />
              <span className="text-zinc-400 text-sm font-semibold">{unit}</span>
            </div>
          </div>

          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => adjustWeight(-stepIncrement)}
              className="p-2.5 rounded-xl bg-zinc-800 text-zinc-300 active-press hover:bg-zinc-700"
              aria-label={`Decrease by ${stepIncrement} ${unit}`}
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => adjustWeight(stepIncrement)}
              className="p-2.5 rounded-xl bg-zinc-800 text-zinc-300 active-press hover:bg-zinc-700"
              aria-label={`Increase by ${stepIncrement} ${unit}`}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bar Weight Selector */}
        <div className="flex items-center justify-between text-xs px-1">
          <span className="text-zinc-400">Barbell weight:</span>
          <div className="flex gap-2">
            {[
              { label: unit === 'kg' ? '20 kg' : '45 lbs', value: unit === 'kg' ? 20 : 45 },
              { label: unit === 'kg' ? '15 kg (Women)' : '35 lbs (Women)', value: unit === 'kg' ? 15 : 35 },
              { label: unit === 'kg' ? '10 kg (EZ)' : '25 lbs (EZ)', value: unit === 'kg' ? 10 : 25 },
            ].map((bar) => (
              <button
                key={bar.value}
                type="button"
                onClick={() => setBarWeight(bar.value)}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  barWeight === bar.value
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-zinc-800 text-zinc-400 border border-transparent'
                }`}
              >
                {bar.label}
              </button>
            ))}
          </div>
        </div>

        {/* Visual Barbell Graphic */}
        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex flex-col items-center">
          <div className="text-xs text-zinc-400 mb-3 flex justify-between w-full">
            <span>
              Per Side: <strong className="text-zinc-100">{result.weightPerSide} {unit}</strong>
            </span>
            {result.remainder > 0 && (
              <span className="text-amber-400">Remainder: {result.remainder} {unit}</span>
            )}
          </div>

          <div className="w-full flex items-center justify-center py-4 px-2">
            <div className="h-4 w-12 bg-zinc-700 rounded-l-md border border-zinc-600 flex items-center justify-center">
              <span className="text-[8px] text-zinc-400 font-mono">collar</span>
            </div>

            <div className="flex items-center gap-1 bg-zinc-900/90 px-3 py-2 border-y border-zinc-700 min-h-[90px]">
              {result.platesPerSide.length === 0 ? (
                <span className="text-xs text-zinc-600 italic px-4">No plates needed (Empty bar)</span>
              ) : (
                result.platesPerSide.map((plate) => (
                  <div key={plate.weight} className="flex gap-1">
                    {Array.from({ length: plate.count }).map((_, idx) => {
                      const heightPx = Math.max(36, Math.min(84, 30 + plate.weight * 1.2));
                      return (
                        <div
                          key={idx}
                          style={{
                            backgroundColor: plate.color,
                            height: `${heightPx}px`,
                            color: plate.textColor || '#fff',
                          }}
                          className="w-5 rounded flex items-center justify-center font-black text-[10px] shadow-md border border-black/20"
                          title={`${plate.weight} ${unit}`}
                        >
                          <span className="-rotate-90 whitespace-nowrap">{plate.weight}</span>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            <div className="h-3 flex-1 bg-zinc-600 rounded-r-md border border-zinc-500 flex items-center justify-center">
              <span className="text-[9px] text-zinc-300 font-mono font-semibold">BAR</span>
            </div>
          </div>
        </div>

        {/* Plate Count Summary Breakdown */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
            Plates Required (Each Side)
          </div>
          <div className="grid grid-cols-3 gap-2">
            {result.platesPerSide.map((plate) => (
              <div
                key={plate.weight}
                className="flex items-center justify-between p-2 rounded-lg bg-zinc-800/80 border border-zinc-700/60"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: plate.color }}
                  />
                  <span className="text-xs font-bold text-zinc-200">
                    {plate.weight} {unit}
                  </span>
                </div>
                <span className="text-xs font-mono font-black text-emerald-400">
                  × {plate.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-zinc-800 text-zinc-200 hover:bg-zinc-700 font-semibold text-sm active-press"
        >
          Done
        </button>
      </div>
    </div>
  );
}
