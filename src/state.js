/* ────────────────────────────────────────
   APP STATE
──────────────────────────────────────── */
export const state = {
  currentLevel: null,
  currentSkill: null,
  history: ['home'],
};

export const TEST = {
  questions: [],
  current: 0,
  score: 0,
  lives: 3,
  answers: [],      // [{correct:bool, q:questionObj}]
  answered: false,
  skillId: null,
  levelId: null,
  // Timer
  timerInterval: null,
  timeLeft: 30,
  timeLimit: 30,
  startTime: null,    // Date.now() at test start
  // Match question state
  match: {
    selectedLeft: null,
    connections: {},   // leftIdx → rightIdx (actual, not display)
    rightOrder: [],    // shuffled display order of actual rightIndices
    verified: false,
  }
};

// Estado global del usuario
window.appUser = { session: null, profile: null, hasPaid: false };
