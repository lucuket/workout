import { Exercise, RoutineTemplate, Workout, WorkoutExercise, BodyweightEntry } from './types';
import { toLocalDateKey } from './constants';
import { calculateWorkoutStats } from './workout-utils';

export const SEED_EXERCISES: Exercise[] = [
  // Chest (12)
  { id: 'ex-bench-press', name: 'Barbell Bench Press', muscle_group: 'Chest', secondary_muscles: ['Triceps', 'Shoulders'], equipment: 'Barbell', instructions: 'Lie back on a flat bench. Grip barbell slightly wider than shoulder-width. Lower bar to mid-chest, press up explosively.' },
  { id: 'ex-incline-db-press', name: 'Incline Dumbbell Press', muscle_group: 'Chest', secondary_muscles: ['Shoulders', 'Triceps'], equipment: 'Dumbbell', instructions: 'Set bench to 30-45 degrees. Press dumbbells upward, squeezing upper pecs at the peak.' },
  { id: 'ex-decline-bench-press', name: 'Decline Barbell Bench Press', muscle_group: 'Chest', secondary_muscles: ['Triceps'], equipment: 'Barbell', instructions: 'Secured on decline bench. Lower to lower chest, press upward.' },
  { id: 'ex-flat-db-press', name: 'Flat Dumbbell Press', muscle_group: 'Chest', secondary_muscles: ['Triceps', 'Shoulders'], equipment: 'Dumbbell', instructions: 'Dumbbells at chest level. Press up with controlled arc.' },
  { id: 'ex-cable-crossover', name: 'Cable Crossover / Fly', muscle_group: 'Chest', secondary_muscles: ['Shoulders'], equipment: 'Cable', instructions: 'High-to-low or mid-height pulley. Hug arms inward focusing on chest squeeze.' },
  { id: 'ex-pec-deck', name: 'Pec Deck / Chest Fly Machine', muscle_group: 'Chest', equipment: 'Machine', instructions: 'Keep elbows slightly bent. Contract pecs to bring pads/handles together.' },
  { id: 'ex-chest-dip', name: 'Chest Dips', muscle_group: 'Chest', secondary_muscles: ['Triceps', 'Shoulders'], equipment: 'Bodyweight', instructions: 'Lean torso forward 30 degrees, flare elbows slightly, dip down until 90 degree arm angle.' },
  { id: 'ex-push-up', name: 'Push-Up', muscle_group: 'Chest', secondary_muscles: ['Triceps', 'Core'], equipment: 'Bodyweight', instructions: 'Hands shoulder-width apart, rigid core. Lower chest to floor and press.' },
  { id: 'ex-incline-barbell-press', name: 'Incline Barbell Bench Press', muscle_group: 'Chest', secondary_muscles: ['Shoulders', 'Triceps'], equipment: 'Barbell', instructions: 'Set bench to 30 degrees. Lower to upper chest, press vertically.' },
  { id: 'ex-smith-bench-press', name: 'Smith Machine Bench Press', muscle_group: 'Chest', secondary_muscles: ['Triceps'], equipment: 'Smith Machine', instructions: 'Fixed bar path allows maximal isolation of pectoralis major.' },
  { id: 'ex-machine-chest-press', name: 'Machine Chest Press', muscle_group: 'Chest', secondary_muscles: ['Triceps', 'Shoulders'], equipment: 'Machine', instructions: 'Adjust seat so handles align with mid-chest. Press smoothly without locking elbows.' },
  { id: 'ex-incline-db-fly', name: 'Incline Dumbbell Fly', muscle_group: 'Chest', secondary_muscles: ['Shoulders'], equipment: 'Dumbbell', instructions: 'Maintain soft elbow bend. Open arms wide for a deep upper-chest stretch, then arc together.' },

  // Back (13)
  { id: 'ex-deadlift', name: 'Conventional Barbell Deadlift', muscle_group: 'Back', secondary_muscles: ['Hamstrings', 'Glutes', 'Forearms'], equipment: 'Barbell', instructions: 'Feet hip-width, grip just outside knees. Hips back, neutral spine, pull floor away.' },
  { id: 'ex-barbell-row', name: 'Bent-Over Barbell Row', muscle_group: 'Back', secondary_muscles: ['Biceps', 'Forearms'], equipment: 'Barbell', instructions: 'Hinge forward 45-70 degrees. Row bar to lower ribcage pulling with elbows.' },
  { id: 'ex-pull-up', name: 'Pull-Up', muscle_group: 'Back', secondary_muscles: ['Biceps'], equipment: 'Bodyweight', instructions: 'Overhand grip wider than shoulders. Pull chin over bar by engaging lats.' },
  { id: 'ex-chin-up', name: 'Chin-Up', muscle_group: 'Back', secondary_muscles: ['Biceps'], equipment: 'Bodyweight', instructions: 'Underhand shoulder-width grip. Great lat sweep and bicep activation.' },
  { id: 'ex-lat-pulldown', name: 'Lat Pulldown', muscle_group: 'Back', secondary_muscles: ['Biceps'], equipment: 'Cable', instructions: 'Wide grip. Pull bar to upper chest while maintaining upright posture.' },
  { id: 'ex-seated-cable-row', name: 'Seated Cable Row', muscle_group: 'Back', secondary_muscles: ['Biceps'], equipment: 'Cable', instructions: 'Use V-bar or neutral grip. Pull to navel, squeeze shoulder blades together.' },
  { id: 'ex-one-arm-db-row', name: 'One-Arm Dumbbell Row', muscle_group: 'Back', secondary_muscles: ['Biceps', 'Core'], equipment: 'Dumbbell', instructions: 'Support knee on bench. Row dumbbell towards hip keeping back flat.' },
  { id: 'ex-t-bar-row', name: 'T-Bar Row', muscle_group: 'Back', secondary_muscles: ['Biceps'], equipment: 'Machine', instructions: 'Chest supported or standing landmine. Pull handle towards sternum.' },
  { id: 'ex-face-pull', name: 'Cable Face Pull', muscle_group: 'Back', secondary_muscles: ['Shoulders'], equipment: 'Cable', instructions: 'Rope attachment at eye level. Pull towards face while rotating hands outward.' },
  { id: 'ex-straight-arm-pulldown', name: 'Straight-Arm Lat Pulldown', muscle_group: 'Back', equipment: 'Cable', instructions: 'Arms extended with slight elbow bend. Push bar in arc down to thighs.' },
  { id: 'ex-back-extension', name: 'Hyperextension / Back Extension', muscle_group: 'Back', secondary_muscles: ['Glutes', 'Hamstrings'], equipment: 'Bodyweight', instructions: 'Hinge at hips on 45-degree roman chair. Contract lower back and glutes.' },
  { id: 'ex-chest-supported-row', name: 'Chest-Supported Dumbbell Row', muscle_group: 'Back', secondary_muscles: ['Biceps', 'Shoulders'], equipment: 'Dumbbell', instructions: 'Lie chest-down on an incline bench. Row dumbbells to hips without lower back strain.' },
  { id: 'ex-pendlay-row', name: 'Pendlay Row', muscle_group: 'Back', secondary_muscles: ['Biceps', 'Forearms'], equipment: 'Barbell', instructions: 'Torso parallel to floor. Pull bar explosively from dead stop on floor to lower chest.' },

  // Shoulders (11)
  { id: 'ex-overhead-press', name: 'Overhead Barbell Press (OHP)', muscle_group: 'Shoulders', secondary_muscles: ['Triceps', 'Core'], equipment: 'Barbell', instructions: 'Standing tall with tight glutes. Press bar vertically overhead, locking out.' },
  { id: 'ex-seated-db-shoulder-press', name: 'Seated Dumbbell Shoulder Press', muscle_group: 'Shoulders', secondary_muscles: ['Triceps'], equipment: 'Dumbbell', instructions: 'Sit on upright bench. Press dumbbells overhead with neutral or pronated grip.' },
  { id: 'ex-lateral-raise', name: 'Dumbbell Lateral Raise', muscle_group: 'Shoulders', equipment: 'Dumbbell', instructions: 'Raise arms out to sides until parallel to floor. Lead with elbows, control descent.' },
  { id: 'ex-cable-lateral-raise', name: 'Cable Lateral Raise', muscle_group: 'Shoulders', equipment: 'Cable', instructions: 'Continuous tension on lateral deltoid throughout the movement range.' },
  { id: 'ex-rear-delt-fly', name: 'Reverse Pec Deck / Rear Delt Fly', muscle_group: 'Shoulders', secondary_muscles: ['Back'], equipment: 'Machine', instructions: 'Target posterior deltoid by pulling handles outward horizontally.' },
  { id: 'ex-front-raise', name: 'Dumbbell Front Raise', muscle_group: 'Shoulders', equipment: 'Dumbbell', instructions: 'Raise dumbbell in front of you to eye level. Controlled tempo.' },
  { id: 'ex-arnold-press', name: 'Arnold Press', muscle_group: 'Shoulders', secondary_muscles: ['Triceps'], equipment: 'Dumbbell', instructions: 'Start with palms facing chest; rotate outward as you press overhead.' },
  { id: 'ex-shrug', name: 'Barbell Shrug', muscle_group: 'Shoulders', secondary_muscles: ['Back'], equipment: 'Barbell', instructions: 'Elevate traps straight up towards ears. Hold peak squeeze for 1 second.' },
  { id: 'ex-db-shrug', name: 'Dumbbell Shrug', muscle_group: 'Shoulders', equipment: 'Dumbbell', instructions: 'Hold dumbbells by sides. Shrug upward without rolling shoulders.' },
  { id: 'ex-machine-shoulder-press', name: 'Machine Shoulder Press', muscle_group: 'Shoulders', secondary_muscles: ['Triceps'], equipment: 'Machine', instructions: 'Press handles vertically with controlled eccentric phase.' },
  { id: 'ex-upright-row', name: 'Cable Upright Row', muscle_group: 'Shoulders', secondary_muscles: ['Biceps'], equipment: 'Cable', instructions: 'Pull bar vertically along torso leading with elbows to chest height.' },

  // Quads (11)
  { id: 'ex-barbell-squat', name: 'Barbell Back Squat', muscle_group: 'Quads', secondary_muscles: ['Glutes', 'Hamstrings', 'Core'], equipment: 'Barbell', instructions: 'Bar rested on traps. Break at hips and knees, descend below parallel, drive up.' },
  { id: 'ex-front-squat', name: 'Barbell Front Squat', muscle_group: 'Quads', secondary_muscles: ['Core', 'Glutes'], equipment: 'Barbell', instructions: 'Bar in front rack position. Upright torso, deep knee flexion.' },
  { id: 'ex-leg-press', name: 'Leg Press', muscle_group: 'Quads', secondary_muscles: ['Glutes'], equipment: 'Machine', instructions: 'Feet shoulder-width on carriage. Lower weight until 90 degrees knee bend, press.' },
  { id: 'ex-hack-squat', name: 'Hack Squat Machine', muscle_group: 'Quads', secondary_muscles: ['Glutes'], equipment: 'Machine', instructions: 'Great quad recruitment with back fully stabilized.' },
  { id: 'ex-leg-extension', name: 'Leg Extension', muscle_group: 'Quads', equipment: 'Machine', instructions: 'Isolate quadriceps. Extend legs fully, pause at top contraction.' },
  { id: 'ex-walking-lunge', name: 'Dumbbell Walking Lunge', muscle_group: 'Quads', secondary_muscles: ['Glutes', 'Hamstrings'], equipment: 'Dumbbell', instructions: 'Step forward, drop rear knee near ground, press up through lead heel.' },
  { id: 'ex-bulgarian-split-squat', name: 'Bulgarian Split Squat', muscle_group: 'Quads', secondary_muscles: ['Glutes'], equipment: 'Dumbbell', instructions: 'Rear foot elevated on bench. Lower front thigh parallel to floor.' },
  { id: 'ex-goblet-squat', name: 'Goblet Squat', muscle_group: 'Quads', secondary_muscles: ['Core'], equipment: 'Kettlebell', instructions: 'Hold kettlebell or dumbbell at chest. Squat deep while keeping torso upright.' },
  { id: 'ex-smith-squat', name: 'Smith Machine Squat', muscle_group: 'Quads', secondary_muscles: ['Glutes'], equipment: 'Smith Machine', instructions: 'Place feet slightly forward of bar to bias quadriceps with stable torso.' },
  { id: 'ex-pendulum-squat', name: 'Pendulum Squat', muscle_group: 'Quads', secondary_muscles: ['Glutes'], equipment: 'Machine', instructions: 'Arc path allows deep knee flexion and high quad tension.' },
  { id: 'ex-step-up', name: 'Dumbbell Step-Up', muscle_group: 'Quads', secondary_muscles: ['Glutes'], equipment: 'Dumbbell', instructions: 'Drive through front foot on box or bench without pushing off trail leg.' },

  // Hamstrings & Glutes (11)
  { id: 'ex-romanian-deadlift', name: 'Romanian Deadlift (RDL)', muscle_group: 'Hamstrings', secondary_muscles: ['Glutes', 'Back'], equipment: 'Barbell', instructions: 'Slight knee bend. Hinge at hips pushing butt back until deep hamstring stretch.' },
  { id: 'ex-db-rdl', name: 'Dumbbell Romanian Deadlift', muscle_group: 'Hamstrings', secondary_muscles: ['Glutes'], equipment: 'Dumbbell', instructions: 'Lower dumbbells close to shins with flat spine, drive hips forward.' },
  { id: 'ex-lying-leg-curl', name: 'Lying Leg Curl', muscle_group: 'Hamstrings', equipment: 'Machine', instructions: 'Curl heels towards glutes smoothly. Control the negative.' },
  { id: 'ex-seated-leg-curl', name: 'Seated Leg Curl', muscle_group: 'Hamstrings', equipment: 'Machine', instructions: 'Pad on lower calf. Flex hamstrings pulling heel beneath seat.' },
  { id: 'ex-good-morning', name: 'Barbell Good Morning', muscle_group: 'Hamstrings', secondary_muscles: ['Glutes', 'Back'], equipment: 'Barbell', instructions: 'Bar on upper back, soft knees. Hinge forward keeping spine braced.' },
  { id: 'ex-nordic-curl', name: 'Nordic Hamstring Curl', muscle_group: 'Hamstrings', equipment: 'Bodyweight', instructions: 'Anchor ankles, lower torso slowly with hips extended, pull back up.' },
  { id: 'ex-hip-thrust', name: 'Barbell Hip Thrust', muscle_group: 'Glutes', secondary_muscles: ['Hamstrings'], equipment: 'Barbell', instructions: 'Upper back on bench, barbell across hips. Drive hips up, lock out with glutes.' },
  { id: 'ex-cable-glute-kickback', name: 'Cable Glute Kickback', muscle_group: 'Glutes', equipment: 'Cable', instructions: 'Ankle cuff attached to low pulley. Kick leg straight back contracting glute.' },
  { id: 'ex-sumo-deadlift', name: 'Sumo Deadlift', muscle_group: 'Glutes', secondary_muscles: ['Hamstrings', 'Quads', 'Back'], equipment: 'Barbell', instructions: 'Wide stance, toes out, hands inside knees. Drive knees out and lock hips.' },
  { id: 'ex-hip-abduction', name: 'Seated Hip Abduction Machine', muscle_group: 'Glutes', equipment: 'Machine', instructions: 'Push pads outward focusing on glute medius squeeze.' },
  { id: 'ex-cable-pull-through', name: 'Cable Pull-Through', muscle_group: 'Glutes', secondary_muscles: ['Hamstrings'], equipment: 'Cable', instructions: 'Face away from low pulley, rope between legs. Hinge and snap hips forward.' },

  // Calves (4)
  { id: 'ex-standing-calf-raise', name: 'Standing Calf Raise', muscle_group: 'Calves', equipment: 'Machine', instructions: 'Balls of feet on block. Deep stretch at bottom, press up onto toes high.' },
  { id: 'ex-seated-calf-raise', name: 'Seated Calf Raise', muscle_group: 'Calves', equipment: 'Machine', instructions: 'Focuses on the soleus muscle beneath gastrocnemius.' },
  { id: 'ex-leg-press-calf-raise', name: 'Leg Press Calf Raise', muscle_group: 'Calves', equipment: 'Machine', instructions: 'Press carriage using calf extension at end of range.' },
  { id: 'ex-smith-calf-raise', name: 'Smith Machine Calf Raise', muscle_group: 'Calves', equipment: 'Smith Machine', instructions: 'Stand on elevated block under Smith bar. Full stretch and pause at peak.' },

  // Biceps (10)
  { id: 'ex-barbell-curl', name: 'Barbell Bicep Curl', muscle_group: 'Biceps', secondary_muscles: ['Forearms'], equipment: 'Barbell', instructions: 'Shoulder-width underhand grip. Curl bar without swinging elbows.' },
  { id: 'ex-ez-bar-curl', name: 'EZ-Bar Curl', muscle_group: 'Biceps', equipment: 'Barbell', instructions: 'Angled grip reduces wrist strain while overloading biceps.' },
  { id: 'ex-db-curl', name: 'Dumbbell Alternating Curl', muscle_group: 'Biceps', equipment: 'Dumbbell', instructions: 'Supinate wrist as you curl upward for maximal bicep peak contraction.' },
  { id: 'ex-incline-db-curl', name: 'Incline Dumbbell Curl', muscle_group: 'Biceps', equipment: 'Dumbbell', instructions: 'Sit on 45-degree incline. Stretches long head of biceps.' },
  { id: 'ex-hammer-curl', name: 'Dumbbell Hammer Curl', muscle_group: 'Biceps', secondary_muscles: ['Forearms'], equipment: 'Dumbbell', instructions: 'Neutral palms facing each other. Emphasizes brachialis and forearms.' },
  { id: 'ex-cable-curl', name: 'Cable Bicep Curl', muscle_group: 'Biceps', equipment: 'Cable', instructions: 'Continuous tension throughout entire range of motion.' },
  { id: 'ex-preacher-curl', name: 'Preacher Curl', muscle_group: 'Biceps', equipment: 'Machine', instructions: 'Arms anchored on preacher pad eliminates momentum.' },
  { id: 'ex-concentration-curl', name: 'Concentration Curl', muscle_group: 'Biceps', equipment: 'Dumbbell', instructions: 'Elbow braced against inner thigh. Pure bicep isolation.' },
  { id: 'ex-bayesian-cable-curl', name: 'Bayesian Cable Curl', muscle_group: 'Biceps', equipment: 'Cable', instructions: 'Face away from low pulley so arm is behind torso for a deep stretch.' },
  { id: 'ex-spider-curl', name: 'Spider Curl', muscle_group: 'Biceps', equipment: 'Dumbbell', instructions: 'Lie chest-down on incline bench with arms hanging straight down. Curl to peak.' },

  // Triceps (9)
  { id: 'ex-tricep-rope-pushdown', name: 'Cable Tricep Rope Pushdown', muscle_group: 'Triceps', equipment: 'Cable', instructions: 'Spread rope ends at bottom lockout. Keep elbows pinned to sides.' },
  { id: 'ex-skull-crusher', name: 'Barbell Skull Crusher / Lying Extension', muscle_group: 'Triceps', equipment: 'Barbell', instructions: 'Lie on flat bench. Lower bar to forehead/top of head, extend elbows.' },
  { id: 'ex-overhead-tricep-extension', name: 'Cable Overhead Tricep Extension', muscle_group: 'Triceps', equipment: 'Cable', instructions: 'Extend long head of triceps from deep stretch overhead.' },
  { id: 'ex-close-grip-bench', name: 'Close-Grip Barbell Bench Press', muscle_group: 'Triceps', secondary_muscles: ['Chest', 'Shoulders'], equipment: 'Barbell', instructions: 'Hands spaced 12-16 inches apart. Great heavy compound for triceps.' },
  { id: 'ex-db-overhead-extension', name: 'Single Dumbbell Overhead Extension', muscle_group: 'Triceps', equipment: 'Dumbbell', instructions: 'Hold dumbbell vertically with both hands behind head, extend upwards.' },
  { id: 'ex-tricep-dip-machine', name: 'Dip Machine', muscle_group: 'Triceps', secondary_muscles: ['Chest'], equipment: 'Machine', instructions: 'Keep torso vertical to focus load on triceps.' },
  { id: 'ex-vbar-pushdown', name: 'V-Bar Cable Pushdown', muscle_group: 'Triceps', equipment: 'Cable', instructions: 'Rigid angled bar allows heavy tricep overload with elbows locked at sides.' },
  { id: 'ex-jm-press', name: 'JM Press', muscle_group: 'Triceps', secondary_muscles: ['Chest'], equipment: 'Barbell', instructions: 'Hybrid between close-grip bench and skull crusher for heavy tricep strength.' },
  { id: 'ex-tricep-kickback', name: 'Cable Tricep Kickback', muscle_group: 'Triceps', equipment: 'Cable', instructions: 'Hinge forward with elbow high, extend arm straight back against cable tension.' },

  // Forearms (4)
  { id: 'ex-wrist-curl', name: 'Barbell Wrist Curl', muscle_group: 'Forearms', equipment: 'Barbell', instructions: 'Forearms rested on bench. Curl wrists upward.' },
  { id: 'ex-reverse-curl', name: 'EZ-Bar Reverse Curl', muscle_group: 'Forearms', secondary_muscles: ['Biceps'], equipment: 'Barbell', instructions: 'Overhand grip builds brachioradialis.' },
  { id: 'ex-farmers-walk', name: "Farmer's Walk", muscle_group: 'Forearms', secondary_muscles: ['Core', 'Shoulders'], equipment: 'Dumbbell', instructions: 'Carry heavy weights for distance or time with tall upright posture.' },
  { id: 'ex-dead-hang', name: 'Dead Hang', muscle_group: 'Forearms', secondary_muscles: ['Back'], equipment: 'Bodyweight', instructions: 'Hang from pull-up bar with full grip to build grip endurance and shoulder health.' },

  // Core (9)
  { id: 'ex-hanging-leg-raise', name: 'Hanging Leg Raise', muscle_group: 'Core', equipment: 'Bodyweight', instructions: 'Hang from pull-up bar. Raise straight legs or knees to parallel without swinging.' },
  { id: 'ex-cable-woodchopper', name: 'Cable Woodchopper', muscle_group: 'Core', equipment: 'Cable', instructions: 'Diagonal rotation engaging obliques and transverse abdominis.' },
  { id: 'ex-ab-wheel-rollout', name: 'Ab Wheel Rollout', muscle_group: 'Core', equipment: 'Other', instructions: 'Kneel on mat, roll wheel forward smoothly keeping spine neutral, pull back.' },
  { id: 'ex-plank', name: 'Plank', muscle_group: 'Core', equipment: 'Bodyweight', instructions: 'Forearms and toes on floor. Hold rigid line through shoulders, hips, ankles.' },
  { id: 'ex-cable-crunch', name: 'Kneeling Cable Crunch', muscle_group: 'Core', equipment: 'Cable', instructions: 'Rope behind neck. Contract abs to pull elbows toward knees.' },
  { id: 'ex-russian-twist', name: 'Russian Twist', muscle_group: 'Core', equipment: 'Bodyweight', instructions: 'V-sit position. Rotate torso side to side with control.' },
  { id: 'ex-pallof-press', name: 'Cable Pallof Press', muscle_group: 'Core', equipment: 'Cable', instructions: 'Stand perpendicular to pulley, press handle straight out resisting rotation.' },
  { id: 'ex-dead-bug', name: 'Dead Bug', muscle_group: 'Core', equipment: 'Bodyweight', instructions: 'Keep lower back pressed into floor while extending opposite arm and leg.' },
  { id: 'ex-decline-crunch', name: 'Decline Bench Crunch', muscle_group: 'Core', equipment: 'Bodyweight', instructions: 'Curl torso smoothly upward on decline bench without pulling on neck.' },

  // Cardio & Functional (10)
  { id: 'ex-treadmill', name: 'Treadmill Incline Walk / Run', muscle_group: 'Cardio', equipment: 'Cardio Machine', instructions: 'Zone 2 aerobic base or HIIT intervals.' },
  { id: 'ex-rowing-machine', name: 'Indoor Rowing (Ergometer)', muscle_group: 'Cardio', secondary_muscles: ['Back', 'Quads'], equipment: 'Cardio Machine', instructions: 'Drive with legs, lean back slightly, finish pull to sternum.' },
  { id: 'ex-stairmaster', name: 'StairMaster Climber', muscle_group: 'Cardio', secondary_muscles: ['Glutes', 'Calves'], equipment: 'Cardio Machine', instructions: 'Consistent pace without leaning heavily on handrails.' },
  { id: 'ex-assault-bike', name: 'Air / Assault Bike', muscle_group: 'Cardio', secondary_muscles: ['Quads', 'Shoulders'], equipment: 'Cardio Machine', instructions: 'Full-body conditioning using arms and legs together.' },
  { id: 'ex-stationary-bike', name: 'Stationary Cycling', muscle_group: 'Cardio', secondary_muscles: ['Quads'], equipment: 'Cardio Machine', instructions: 'Low-impact Zone 2 endurance or sprint intervals.' },
  { id: 'ex-kettlebell-swing', name: 'Kettlebell Swing', muscle_group: 'Full Body', secondary_muscles: ['Hamstrings', 'Glutes', 'Back'], equipment: 'Kettlebell', instructions: 'Explosive hip hinge driving kettlebell to chest height.' },
  { id: 'ex-clean-and-jerk', name: 'Barbell Clean & Jerk', muscle_group: 'Full Body', equipment: 'Barbell', instructions: 'Olympic lift from floor to front rack, then jerk overhead.' },
  { id: 'ex-snatch', name: 'Barbell Snatch', muscle_group: 'Full Body', equipment: 'Barbell', instructions: 'Wide grip pull from floor directly to overhead squat in one motion.' },
  { id: 'ex-burpee', name: 'Burpee', muscle_group: 'Full Body', equipment: 'Bodyweight', instructions: 'Drop into squat, kick feet back to pushup, jump back up with hands overhead.' },
  { id: 'ex-turkish-getup', name: 'Kettlebell Turkish Get-Up', muscle_group: 'Full Body', secondary_muscles: ['Shoulders', 'Core'], equipment: 'Kettlebell', instructions: 'Rise from lying to standing while keeping kettlebell locked overhead.' },
];

export const SEED_ROUTINES: RoutineTemplate[] = [
  {
    id: 'routine-push-day',
    name: 'Push Day (Chest, Shoulders, Triceps)',
    category: 'Push',
    description: 'Hypertrophy and strength focus for pressing muscles.',
    created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    exercises: [
      { exercise_id: 'ex-bench-press', exercise_name: 'Barbell Bench Press', muscle_group: 'Chest', equipment: 'Barbell', order: 1, target_sets: 4, target_reps: '6-8', target_rest_seconds: 120, notes: 'Heavy compound; keep arch tight' },
      { exercise_id: 'ex-incline-db-press', exercise_name: 'Incline Dumbbell Press', muscle_group: 'Chest', equipment: 'Dumbbell', order: 2, target_sets: 3, target_reps: '8-10', target_rest_seconds: 90 },
      { exercise_id: 'ex-seated-db-shoulder-press', exercise_name: 'Seated Dumbbell Shoulder Press', muscle_group: 'Shoulders', equipment: 'Dumbbell', order: 3, target_sets: 3, target_reps: '8-10', target_rest_seconds: 90 },
      { exercise_id: 'ex-lateral-raise', exercise_name: 'Dumbbell Lateral Raise', muscle_group: 'Shoulders', equipment: 'Dumbbell', order: 4, target_sets: 4, target_reps: '12-15', target_rest_seconds: 60, notes: 'Strict form, no swing' },
      { exercise_id: 'ex-tricep-rope-pushdown', exercise_name: 'Cable Tricep Rope Pushdown', muscle_group: 'Triceps', equipment: 'Cable', order: 5, target_sets: 3, target_reps: '10-12', target_rest_seconds: 60 },
      { exercise_id: 'ex-skull-crusher', exercise_name: 'Barbell Skull Crusher / Lying Extension', muscle_group: 'Triceps', equipment: 'Barbell', order: 6, target_sets: 3, target_reps: '10-12', target_rest_seconds: 75 },
    ],
  },
  {
    id: 'routine-pull-day',
    name: 'Pull Day (Back, Biceps, Rear Delts)',
    category: 'Pull',
    description: 'Thick back development and arms volume.',
    created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    exercises: [
      { exercise_id: 'ex-deadlift', exercise_name: 'Conventional Barbell Deadlift', muscle_group: 'Back', equipment: 'Barbell', order: 1, target_sets: 3, target_reps: '5', target_rest_seconds: 180, notes: 'Reset each rep, maintain neutral spine' },
      { exercise_id: 'ex-lat-pulldown', exercise_name: 'Lat Pulldown', muscle_group: 'Back', equipment: 'Cable', order: 2, target_sets: 4, target_reps: '8-10', target_rest_seconds: 90 },
      { exercise_id: 'ex-seated-cable-row', exercise_name: 'Seated Cable Row', muscle_group: 'Back', equipment: 'Cable', order: 3, target_sets: 3, target_reps: '10-12', target_rest_seconds: 75 },
      { exercise_id: 'ex-face-pull', exercise_name: 'Cable Face Pull', muscle_group: 'Back', equipment: 'Cable', order: 4, target_sets: 3, target_reps: '12-15', target_rest_seconds: 60 },
      { exercise_id: 'ex-ez-bar-curl', exercise_name: 'EZ-Bar Curl', muscle_group: 'Biceps', equipment: 'Barbell', order: 5, target_sets: 3, target_reps: '8-10', target_rest_seconds: 75 },
      { exercise_id: 'ex-hammer-curl', exercise_name: 'Dumbbell Hammer Curl', muscle_group: 'Biceps', equipment: 'Dumbbell', order: 6, target_sets: 3, target_reps: '10-12', target_rest_seconds: 60 },
    ],
  },
  {
    id: 'routine-legs-day',
    name: 'Legs & Core Day',
    category: 'Legs',
    description: 'Heavy quad, hamstring, and calf strength routine.',
    created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    exercises: [
      { exercise_id: 'ex-barbell-squat', exercise_name: 'Barbell Back Squat', muscle_group: 'Quads', equipment: 'Barbell', order: 1, target_sets: 4, target_reps: '6-8', target_rest_seconds: 150 },
      { exercise_id: 'ex-romanian-deadlift', exercise_name: 'Romanian Deadlift (RDL)', muscle_group: 'Hamstrings', equipment: 'Barbell', order: 2, target_sets: 3, target_reps: '8-10', target_rest_seconds: 120 },
      { exercise_id: 'ex-leg-press', exercise_name: 'Leg Press', muscle_group: 'Quads', equipment: 'Machine', order: 3, target_sets: 3, target_reps: '10-12', target_rest_seconds: 90 },
      { exercise_id: 'ex-lying-leg-curl', exercise_name: 'Lying Leg Curl', muscle_group: 'Hamstrings', equipment: 'Machine', order: 4, target_sets: 3, target_reps: '10-12', target_rest_seconds: 60 },
      { exercise_id: 'ex-standing-calf-raise', exercise_name: 'Standing Calf Raise', muscle_group: 'Calves', equipment: 'Machine', order: 5, target_sets: 4, target_reps: '12-15', target_rest_seconds: 60 },
      { exercise_id: 'ex-hanging-leg-raise', exercise_name: 'Hanging Leg Raise', muscle_group: 'Core', equipment: 'Bodyweight', order: 6, target_sets: 3, target_reps: '12-15', target_rest_seconds: 60 },
    ],
  },
  {
    id: 'routine-upper-body',
    name: 'Upper Body Power',
    category: 'Upper',
    description: 'Comprehensive upper body day combining horizontal & vertical pushes and pulls.',
    created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    exercises: [
      { exercise_id: 'ex-bench-press', exercise_name: 'Barbell Bench Press', muscle_group: 'Chest', equipment: 'Barbell', order: 1, target_sets: 4, target_reps: '5', target_rest_seconds: 120 },
      { exercise_id: 'ex-barbell-row', exercise_name: 'Bent-Over Barbell Row', muscle_group: 'Back', equipment: 'Barbell', order: 2, target_sets: 4, target_reps: '6-8', target_rest_seconds: 120 },
      { exercise_id: 'ex-overhead-press', exercise_name: 'Overhead Barbell Press (OHP)', muscle_group: 'Shoulders', equipment: 'Barbell', order: 3, target_sets: 3, target_reps: '6-8', target_rest_seconds: 90 },
      { exercise_id: 'ex-pull-up', exercise_name: 'Pull-Up', muscle_group: 'Back', equipment: 'Bodyweight', order: 4, target_sets: 3, target_reps: '8-10', target_rest_seconds: 90 },
      { exercise_id: 'ex-tricep-rope-pushdown', exercise_name: 'Cable Tricep Rope Pushdown', muscle_group: 'Triceps', equipment: 'Cable', order: 5, target_sets: 3, target_reps: '10-12', target_rest_seconds: 60 },
      { exercise_id: 'ex-incline-db-curl', exercise_name: 'Incline Dumbbell Curl', muscle_group: 'Biceps', equipment: 'Dumbbell', order: 6, target_sets: 3, target_reps: '10-12', target_rest_seconds: 60 },
    ],
  },
];

// Helper to generate realistic 3-month history (12 weeks, ~42 workouts)
export function generateRealisticHistory(): { workouts: Workout[]; bodyweight: BodyweightEntry[] } {
  const workouts: Workout[] = [];
  const bodyweight: BodyweightEntry[] = [];
  const now = Date.now();
  const dayMs = 86400000;

  // Generate 90 days of bodyweight (gradual lean bulk from ~173 lbs to ~177 lbs with deterministic wave)
  for (let i = 90; i >= 0; i--) {
    if (i % 2 === 0 || i % 3 === 0) {
      const date = toLocalDateKey(now - i * dayMs);
      const baseline = 173 + (1 - i / 90) * 4.2;
      const fluctuation = Math.sin(i * 0.7) * 0.8 + Math.cos(i * 1.9) * 0.2;
      const weight = Math.round((baseline + fluctuation) * 10) / 10;
      bodyweight.push({
        id: `bw-${date}`,
        date,
        weight,
        notes: i % 14 === 0 ? 'Fasted morning weigh-in' : undefined,
        created_at: `${date}T07:15:00.000Z`,
      });
    }
  }

  const baseWeights = {
    bench: 185,
    inclineDb: 60,
    lateralRaise: 20,
    tricepPushdown: 55,
    deadlift: 275,
    latPulldown: 135,
    ezCurl: 65,
    squat: 225,
    rdl: 185,
    calfRaise: 140,
    ohp: 115,
    bbRow: 145,
  };

  const dayOfWeekOffsets = [
    { name: 'Push Day', routineId: 'routine-push-day', dayOffset: 1, type: 'push' as const },
    { name: 'Pull Day', routineId: 'routine-pull-day', dayOffset: 3, type: 'pull' as const },
    { name: 'Leg Day', routineId: 'routine-legs-day', dayOffset: 5, type: 'legs' as const },
    { name: 'Upper Body Power', routineId: 'routine-upper-body', dayOffset: 0, type: 'upper' as const },
  ];

  let workoutIndex = 1;

  for (let week = 12; week >= 0; week--) {
    const progressFactor = (12 - week) / 12;

    for (const split of dayOfWeekOffsets) {
      if ((week === 4 && split.type === 'upper') || (week === 8 && split.type === 'pull')) {
        continue;
      }

      const daysAgo = week * 7 + (7 - split.dayOffset);
      if (daysAgo < 0 || daysAgo > 90) continue;

      const dateObj = new Date(now - daysAgo * dayMs);
      dateObj.setHours(17, 30, 0, 0);
      const startTime = dateObj.toISOString();
      const durationSeconds = 3600 + Math.floor(Math.sin(daysAgo) * 600);
      const endTime = new Date(dateObj.getTime() + durationSeconds * 1000).toISOString();

      let exercises: WorkoutExercise[] = [];
      let prCount = 0;

      if (split.type === 'push') {
        const benchWeight = Math.round((baseWeights.bench + progressFactor * 40) / 5) * 5;
        const incDbWeight = Math.round((baseWeights.inclineDb + progressFactor * 15) / 5) * 5;
        const latWeight = Math.round((baseWeights.lateralRaise + progressFactor * 10) / 2.5) * 2.5;
        const pushdownWeight = Math.round((baseWeights.tricepPushdown + progressFactor * 15) / 5) * 5;

        if (week === 1 || week === 6 || week === 10) prCount++;

        exercises = [
          {
            id: `we-${workoutIndex}-1`,
            exercise_id: 'ex-bench-press',
            exercise_name: 'Barbell Bench Press',
            muscle_group: 'Chest',
            equipment: 'Barbell',
            order: 1,
            rest_seconds: 120,
            sets: [
              { id: `s-${workoutIndex}-1-1`, set_number: 1, type: 'warmup', weight: benchWeight - 50, reps: 10, completed: true },
              { id: `s-${workoutIndex}-1-2`, set_number: 2, type: 'normal', weight: benchWeight, reps: 8, completed: true, rpe: 8 },
              { id: `s-${workoutIndex}-1-3`, set_number: 3, type: 'normal', weight: benchWeight, reps: 8, completed: true, rpe: 8.5 },
              { id: `s-${workoutIndex}-1-4`, set_number: 4, type: 'normal', weight: benchWeight, reps: 7, completed: true, rpe: 9 },
            ],
          },
          {
            id: `we-${workoutIndex}-2`,
            exercise_id: 'ex-incline-db-press',
            exercise_name: 'Incline Dumbbell Press',
            muscle_group: 'Chest',
            equipment: 'Dumbbell',
            order: 2,
            rest_seconds: 90,
            sets: [
              { id: `s-${workoutIndex}-2-1`, set_number: 1, type: 'normal', weight: incDbWeight, reps: 10, completed: true },
              { id: `s-${workoutIndex}-2-2`, set_number: 2, type: 'normal', weight: incDbWeight, reps: 9, completed: true },
              { id: `s-${workoutIndex}-2-3`, set_number: 3, type: 'normal', weight: incDbWeight, reps: 8, completed: true },
            ],
          },
          {
            id: `we-${workoutIndex}-3`,
            exercise_id: 'ex-lateral-raise',
            exercise_name: 'Dumbbell Lateral Raise',
            muscle_group: 'Shoulders',
            equipment: 'Dumbbell',
            order: 3,
            rest_seconds: 60,
            sets: [
              { id: `s-${workoutIndex}-3-1`, set_number: 1, type: 'normal', weight: latWeight, reps: 15, completed: true },
              { id: `s-${workoutIndex}-3-2`, set_number: 2, type: 'normal', weight: latWeight, reps: 14, completed: true },
              { id: `s-${workoutIndex}-3-3`, set_number: 3, type: 'normal', weight: latWeight, reps: 12, completed: true },
            ],
          },
          {
            id: `we-${workoutIndex}-4`,
            exercise_id: 'ex-tricep-rope-pushdown',
            exercise_name: 'Cable Tricep Rope Pushdown',
            muscle_group: 'Triceps',
            equipment: 'Cable',
            order: 4,
            rest_seconds: 60,
            sets: [
              { id: `s-${workoutIndex}-4-1`, set_number: 1, type: 'normal', weight: pushdownWeight, reps: 12, completed: true },
              { id: `s-${workoutIndex}-4-2`, set_number: 2, type: 'normal', weight: pushdownWeight, reps: 12, completed: true },
              { id: `s-${workoutIndex}-4-3`, set_number: 3, type: 'normal', weight: pushdownWeight, reps: 10, completed: true },
            ],
          },
        ];
      } else if (split.type === 'pull') {
        const deadliftWeight = Math.round((baseWeights.deadlift + progressFactor * 70) / 10) * 10;
        const latPullWeight = Math.round((baseWeights.latPulldown + progressFactor * 35) / 5) * 5;
        const curlWeight = Math.round((baseWeights.ezCurl + progressFactor * 15) / 5) * 5;

        if (week === 2 || week === 7) prCount++;

        exercises = [
          {
            id: `we-${workoutIndex}-1`,
            exercise_id: 'ex-deadlift',
            exercise_name: 'Conventional Barbell Deadlift',
            muscle_group: 'Back',
            equipment: 'Barbell',
            order: 1,
            rest_seconds: 180,
            sets: [
              { id: `s-${workoutIndex}-1-1`, set_number: 1, type: 'warmup', weight: deadliftWeight - 90, reps: 6, completed: true },
              { id: `s-${workoutIndex}-1-2`, set_number: 2, type: 'normal', weight: deadliftWeight, reps: 5, completed: true, rpe: 8.5 },
              { id: `s-${workoutIndex}-1-3`, set_number: 3, type: 'normal', weight: deadliftWeight, reps: 5, completed: true, rpe: 9 },
            ],
          },
          {
            id: `we-${workoutIndex}-2`,
            exercise_id: 'ex-lat-pulldown',
            exercise_name: 'Lat Pulldown',
            muscle_group: 'Back',
            equipment: 'Cable',
            order: 2,
            rest_seconds: 90,
            sets: [
              { id: `s-${workoutIndex}-2-1`, set_number: 1, type: 'normal', weight: latPullWeight, reps: 10, completed: true },
              { id: `s-${workoutIndex}-2-2`, set_number: 2, type: 'normal', weight: latPullWeight, reps: 10, completed: true },
              { id: `s-${workoutIndex}-2-3`, set_number: 3, type: 'normal', weight: latPullWeight, reps: 8, completed: true },
            ],
          },
          {
            id: `we-${workoutIndex}-3`,
            exercise_id: 'ex-ez-bar-curl',
            exercise_name: 'EZ-Bar Curl',
            muscle_group: 'Biceps',
            equipment: 'Barbell',
            order: 3,
            rest_seconds: 75,
            sets: [
              { id: `s-${workoutIndex}-3-1`, set_number: 1, type: 'normal', weight: curlWeight, reps: 10, completed: true },
              { id: `s-${workoutIndex}-3-2`, set_number: 2, type: 'normal', weight: curlWeight, reps: 9, completed: true },
              { id: `s-${workoutIndex}-3-3`, set_number: 3, type: 'normal', weight: curlWeight, reps: 8, completed: true },
            ],
          },
        ];
      } else if (split.type === 'legs') {
        const squatWeight = Math.round((baseWeights.squat + progressFactor * 60) / 10) * 10;
        const rdlWeight = Math.round((baseWeights.rdl + progressFactor * 60) / 10) * 10;
        const calfWeight = Math.round((baseWeights.calfRaise + progressFactor * 40) / 10) * 10;

        if (week === 3 || week === 9) prCount++;

        exercises = [
          {
            id: `we-${workoutIndex}-1`,
            exercise_id: 'ex-barbell-squat',
            exercise_name: 'Barbell Back Squat',
            muscle_group: 'Quads',
            equipment: 'Barbell',
            order: 1,
            rest_seconds: 150,
            sets: [
              { id: `s-${workoutIndex}-1-1`, set_number: 1, type: 'warmup', weight: squatWeight - 90, reps: 8, completed: true },
              { id: `s-${workoutIndex}-1-2`, set_number: 2, type: 'normal', weight: squatWeight, reps: 6, completed: true, rpe: 8 },
              { id: `s-${workoutIndex}-1-3`, set_number: 3, type: 'normal', weight: squatWeight, reps: 6, completed: true, rpe: 8.5 },
              { id: `s-${workoutIndex}-1-4`, set_number: 4, type: 'normal', weight: squatWeight, reps: 5, completed: true, rpe: 9 },
            ],
          },
          {
            id: `we-${workoutIndex}-2`,
            exercise_id: 'ex-romanian-deadlift',
            exercise_name: 'Romanian Deadlift (RDL)',
            muscle_group: 'Hamstrings',
            equipment: 'Barbell',
            order: 2,
            rest_seconds: 120,
            sets: [
              { id: `s-${workoutIndex}-2-1`, set_number: 1, type: 'normal', weight: rdlWeight, reps: 8, completed: true },
              { id: `s-${workoutIndex}-2-2`, set_number: 2, type: 'normal', weight: rdlWeight, reps: 8, completed: true },
              { id: `s-${workoutIndex}-2-3`, set_number: 3, type: 'normal', weight: rdlWeight, reps: 8, completed: true },
            ],
          },
          {
            id: `we-${workoutIndex}-3`,
            exercise_id: 'ex-standing-calf-raise',
            exercise_name: 'Standing Calf Raise',
            muscle_group: 'Calves',
            equipment: 'Machine',
            order: 3,
            rest_seconds: 60,
            sets: [
              { id: `s-${workoutIndex}-3-1`, set_number: 1, type: 'normal', weight: calfWeight, reps: 15, completed: true },
              { id: `s-${workoutIndex}-3-2`, set_number: 2, type: 'normal', weight: calfWeight, reps: 14, completed: true },
              { id: `s-${workoutIndex}-3-3`, set_number: 3, type: 'normal', weight: calfWeight, reps: 12, completed: true },
            ],
          },
        ];
      } else {
        const benchWeight = Math.round((baseWeights.bench + progressFactor * 40) / 5) * 5;
        const rowWeight = Math.round((baseWeights.bbRow + progressFactor * 40) / 5) * 5;
        const ohpWeight = Math.round((baseWeights.ohp + progressFactor * 30) / 5) * 5;

        exercises = [
          {
            id: `we-${workoutIndex}-1`,
            exercise_id: 'ex-bench-press',
            exercise_name: 'Barbell Bench Press',
            muscle_group: 'Chest',
            equipment: 'Barbell',
            order: 1,
            rest_seconds: 120,
            sets: [
              { id: `s-${workoutIndex}-1-1`, set_number: 1, type: 'normal', weight: benchWeight, reps: 5, completed: true },
              { id: `s-${workoutIndex}-1-2`, set_number: 2, type: 'normal', weight: benchWeight, reps: 5, completed: true },
              { id: `s-${workoutIndex}-1-3`, set_number: 3, type: 'normal', weight: benchWeight, reps: 5, completed: true },
            ],
          },
          {
            id: `we-${workoutIndex}-2`,
            exercise_id: 'ex-barbell-row',
            exercise_name: 'Bent-Over Barbell Row',
            muscle_group: 'Back',
            equipment: 'Barbell',
            order: 2,
            rest_seconds: 120,
            sets: [
              { id: `s-${workoutIndex}-2-1`, set_number: 1, type: 'normal', weight: rowWeight, reps: 8, completed: true },
              { id: `s-${workoutIndex}-2-2`, set_number: 2, type: 'normal', weight: rowWeight, reps: 8, completed: true },
              { id: `s-${workoutIndex}-2-3`, set_number: 3, type: 'normal', weight: rowWeight, reps: 7, completed: true },
            ],
          },
          {
            id: `we-${workoutIndex}-3`,
            exercise_id: 'ex-overhead-press',
            exercise_name: 'Overhead Barbell Press (OHP)',
            muscle_group: 'Shoulders',
            equipment: 'Barbell',
            order: 3,
            rest_seconds: 90,
            sets: [
              { id: `s-${workoutIndex}-3-1`, set_number: 1, type: 'normal', weight: ohpWeight, reps: 6, completed: true },
              { id: `s-${workoutIndex}-3-2`, set_number: 2, type: 'normal', weight: ohpWeight, reps: 6, completed: true },
              { id: `s-${workoutIndex}-3-3`, set_number: 3, type: 'normal', weight: ohpWeight, reps: 5, completed: true },
            ],
          },
        ];
      }

      const stats = calculateWorkoutStats(exercises);

      workouts.push({
        id: `workout-${workoutIndex}`,
        name: split.name,
        routine_id: split.routineId,
        start_time: startTime,
        end_time: endTime,
        duration_seconds: durationSeconds,
        notes: week % 4 === 0 ? 'Felt strong, good bar speed throughout.' : undefined,
        exercises,
        total_volume: stats.total_volume,
        total_sets: stats.total_sets,
        total_reps: stats.total_reps,
        pr_count: prCount,
        created_at: startTime,
        updated_at: endTime,
        synced: true,
      });

      workoutIndex++;
    }
  }

  return { workouts, bodyweight };
}
