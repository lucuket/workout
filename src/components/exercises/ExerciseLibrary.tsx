'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Dumbbell, X } from 'lucide-react';
import { Exercise, MuscleGroup, Equipment } from '@/lib/types';
import { getAllExercises, getUserPreferences } from '@/lib/db';
import { EQUIPMENT_OPTIONS, MUSCLE_GROUPS } from '@/lib/constants';
import ExerciseDetailModal from './ExerciseDetailModal';
import AddCustomExerciseModal from './AddCustomExerciseModal';

const MUSCLE_FILTERS: (MuscleGroup | 'All')[] = ['All', ...MUSCLE_GROUPS];
const EQUIPMENT_FILTERS: (Equipment | 'All')[] = ['All', ...EQUIPMENT_OPTIONS];

export default function ExerciseLibrary() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | 'All'>('All');
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | 'All'>('All');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [weightUnit, setWeightUnit] = useState('lbs');

  useEffect(() => {
    const load = async () => {
      const [data, prefs] = await Promise.all([getAllExercises(), getUserPreferences()]);
      setExercises(data);
      setWeightUnit(prefs.weight_unit);
    };
    void load();
  }, []);

  const filteredExercises = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return exercises.filter((ex) => {
      const matchesSearch =
        !q ||
        ex.name.toLowerCase().includes(q) ||
        ex.muscle_group.toLowerCase().includes(q) ||
        ex.equipment.toLowerCase().includes(q);

      const matchesMuscle = selectedMuscle === 'All' || ex.muscle_group === selectedMuscle;
      const matchesEquipment = selectedEquipment === 'All' || ex.equipment === selectedEquipment;

      return matchesSearch && matchesMuscle && matchesEquipment;
    });
  }, [exercises, searchQuery, selectedMuscle, selectedEquipment]);

  const handleExerciseClick = (ex: Exercise) => {
    setSelectedExercise(ex);
    setIsDetailOpen(true);
  };

  const handleCustomCreated = (newEx: Exercise) => {
    setExercises((prev) => [newEx, ...prev]);
    setSelectedExercise(newEx);
    setIsDetailOpen(true);
  };

  const handleExerciseDeleted = (id: string) => {
    setExercises((prev) => prev.filter((ex) => ex.id !== id));
    setSelectedExercise(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-zinc-100 tracking-tight">Exercise Library</h1>
          <p className="text-xs text-zinc-400">{exercises.length} exercises & personal records</p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-md shadow-emerald-500/20 active-press"
        >
          <Plus className="w-4 h-4" />
          <span>New Exercise</span>
        </button>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search exercise, muscle, or equipment..."
          className="w-full pl-9 pr-8 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="overflow-x-auto -mx-4 px-4 scrollbar-none flex gap-1.5 pb-1">
        {MUSCLE_FILTERS.map((muscle) => (
          <button
            key={muscle}
            type="button"
            onClick={() => setSelectedMuscle(muscle)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold transition-colors active-press ${
              selectedMuscle === muscle
                ? 'bg-emerald-500 text-zinc-950 font-bold shadow-sm'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {muscle}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto -mx-4 px-4 scrollbar-none flex gap-1.5 pb-1">
        {EQUIPMENT_FILTERS.map((eq) => (
          <button
            key={eq}
            type="button"
            onClick={() => setSelectedEquipment(eq)}
            className={`whitespace-nowrap px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors active-press ${
              selectedEquipment === eq
                ? 'bg-zinc-700 text-zinc-100 border border-zinc-600'
                : 'bg-zinc-950/80 border border-zinc-800/80 text-zinc-400 hover:text-zinc-300'
            }`}
          >
            {eq}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-zinc-400 px-1 pt-1">
        <span>Showing {filteredExercises.length} exercises</span>
      </div>

      <div className="space-y-2">
        {filteredExercises.map((ex) => (
          <button
            key={ex.id}
            type="button"
            onClick={() => handleExerciseClick(ex)}
            className="w-full text-left p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 hover:border-zinc-700 flex items-center justify-between active-press transition-colors"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-zinc-100">{ex.name}</span>
                {ex.is_custom && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    Custom
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-emerald-400 font-medium">{ex.muscle_group}</span>
                <span className="text-zinc-600">•</span>
                <span className="text-zinc-400">{ex.equipment}</span>
              </div>
            </div>

            <div className="w-8 h-8 rounded-xl bg-zinc-800/70 flex items-center justify-center text-zinc-400 flex-shrink-0">
              <Dumbbell className="w-4 h-4" />
            </div>
          </button>
        ))}
      </div>

      <ExerciseDetailModal
        exercise={selectedExercise}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onDeleted={handleExerciseDeleted}
        weightUnit={weightUnit}
      />

      <AddCustomExerciseModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onCreated={handleCustomCreated}
      />
    </div>
  );
}
