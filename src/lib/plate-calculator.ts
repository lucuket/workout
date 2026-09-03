export interface PlateInfo {
  weight: number;
  count: number; // count per side
  color: string;
  textColor?: string;
}

export interface PlateCalculationResult {
  targetWeight: number;
  barWeight: number;
  weightPerSide: number;
  platesPerSide: PlateInfo[];
  achievableWeight: number;
  remainder: number;
}

export const LBS_PLATES = [
  { weight: 45, color: '#ef4444', textColor: '#ffffff' }, // Red
  { weight: 35, color: '#3b82f6', textColor: '#ffffff' }, // Blue
  { weight: 25, color: '#eab308', textColor: '#000000' }, // Yellow
  { weight: 10, color: '#22c55e', textColor: '#ffffff' }, // Green
  { weight: 5, color: '#f3f4f6', textColor: '#000000' },  // White
  { weight: 2.5, color: '#374151', textColor: '#ffffff' }, // Charcoal
];

export const KG_PLATES = [
  { weight: 25, color: '#ef4444', textColor: '#ffffff' }, // Red
  { weight: 20, color: '#3b82f6', textColor: '#ffffff' }, // Blue
  { weight: 15, color: '#eab308', textColor: '#000000' }, // Yellow
  { weight: 10, color: '#22c55e', textColor: '#ffffff' }, // Green
  { weight: 5, color: '#f3f4f6', textColor: '#000000' },  // White
  { weight: 2.5, color: '#374151', textColor: '#ffffff' }, // Black
  { weight: 1.25, color: '#9ca3af', textColor: '#000000' }, // Grey
];

export function calculatePlates(
  targetWeight: number,
  barWeight: number = 45,
  unit: 'lbs' | 'kg' = 'lbs'
): PlateCalculationResult {
  if (targetWeight < barWeight) {
    return {
      targetWeight,
      barWeight,
      weightPerSide: 0,
      platesPerSide: [],
      achievableWeight: barWeight,
      remainder: 0,
    };
  }

  let remainingPerSide = (targetWeight - barWeight) / 2;
  const platesConfig = unit === 'kg' ? KG_PLATES : LBS_PLATES;
  const platesPerSide: PlateInfo[] = [];

  for (const plate of platesConfig) {
    if (remainingPerSide >= plate.weight) {
      const count = Math.floor(remainingPerSide / plate.weight);
      platesPerSide.push({
        weight: plate.weight,
        count,
        color: plate.color,
        textColor: plate.textColor,
      });
      remainingPerSide = Math.round((remainingPerSide - count * plate.weight) * 100) / 100;
    }
  }

  const achievablePerSide = platesPerSide.reduce((sum, p) => sum + p.weight * p.count, 0);
  const achievableWeight = barWeight + achievablePerSide * 2;
  const remainder = Math.round((targetWeight - achievableWeight) * 10) / 10;

  return {
    targetWeight,
    barWeight,
    weightPerSide: achievablePerSide,
    platesPerSide,
    achievableWeight,
    remainder,
  };
}
