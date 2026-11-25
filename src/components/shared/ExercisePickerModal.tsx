'use client';

import React, { useMemo, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { Exercise, MuscleGroup } from '@/lib/types';
import { MUSCLE_GROUPS } from '@/lib/constants';

interface ExercisePickerModalProps {
  isOpen: boolean;
  title?: string;
  exercises: Exercise[];
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
}

export default function ExercisePickerModal({
  isOpen,
  title = 'Select Exercise',
  exercises,
  onSelect,
  onClose,
}: ExercisePickerModalProps) {
  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | 'All'>('All');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return exercises.filter((ex) => {
      const matchesMuscle = selectedMuscle === 'All' || ex.muscle_group === selectedMuscle;
      if (!matchesMuscle) return false;
      if (!q) return true;
      return (
        ex.name.toLowerCase().includes(q) ||
        ex.muscle_group.toLowerCase().includes(q) ||
        ex.equipment.toLowerCase().includes(q)
      );
    });
  }, [exercises, search, selectedMuscle]);

  if (!isOpen) return null;

  const handleClose = () => {
    setSearch('');
    setSelectedMuscle('All');
    onClose();
  };

  const handlePick = (ex: Exercise) => {
    setSearch('');
    setSelectedMuscle('All');
    onSelect(ex);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="flex-1 max-w-lg mx-auto w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-5 flex flex-col shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <h2 className="font-bold text-base text-zinc-100">{title}</h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-100 active-press"
            aria-label="Close picker"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="pt-3 pb-2 space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${exercises.length} exercises...`}
              className="w-full pl-9 pr-8 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="overflow-x-auto scrollbar-none flex gap-1.5 pb-1">
            {(['All', ...MUSCLE_GROUPS] as const).map((muscle) => (
              <button
                key={muscle}
                type="button"
                onClick={() => setSelectedMuscle(muscle)}
                className={`whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors active-press ${
                  selectedMuscle === muscle
                    ? 'bg-emerald-500 text-zinc-950 font-bold'
                    : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {muscle}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/60 -mx-2 px-2">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500">
              No matching exercises found.
            </div>
          ) : (
            filtered.map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => handlePick(ex)}
                className="w-full py-3 px-2 flex items-center justify-between text-left hover:bg-zinc-800/60 rounded-xl active-press transition-colors"
              >
                <div>
                  <span className="font-bold text-sm text-zinc-100 block">{ex.name}</span>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-400">
                    <span className="text-emerald-400">{ex.muscle_group}</span>
                    <span>•</span>
                    <span>{ex.equipment}</span>
                  </div>
                </div>
                <Plus className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
