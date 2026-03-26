// ── ES Module entry point ──────────────────────────────────────
// This file imports all modules and assigns functions referenced
// by HTML onclick attributes to the window object.

import './styles/index.css';
import './config.js';
import './supabase.js';
import './state.js';

// ── Data imports (must be on window for all modules) ─────────
import { LEVELS, SKILLS } from './data/levels.js';
import { QUESTIONS } from './data/questions.js';
import { TEMARIO, PRACTICE_BANK } from './data/temario.js';
import { VERB_GROUPS, TENSES, PRONOUN_SLOTS } from './data/verbs.js';
import { STUDY_TIPS } from './data/tips.js';

window.LEVELS = LEVELS;
window.SKILLS = SKILLS;
window.QUESTIONS = QUESTIONS;
window.TEMARIO = TEMARIO;
window.VERB_GROUPS = VERB_GROUPS;
window.TENSES = TENSES;
window.PRONOUN_SLOTS = PRONOUN_SLOTS;
window.PRACTICE_BANK = PRACTICE_BANK;
window.STUDY_TIPS = STUDY_TIPS;

import { initAuth, loginWithGoogle, loginFromProfileIcon, logout, renderAuthUI,
         toggleProfileMenu, closeProfileMenu, setUser, canAccessTopic, canAccessVerbGroup,
         activatePendingPayment } from './auth.js';
import { startCheckout, startAnonymousCheckout, showPaymentSuccessModal,
         startPremium, showPostPaymentRegistrationModal, registerAfterPayment,
         showPaywall, loginToExistingAccount } from './payment.js';
import { showScreen, selectLevel, selectSkill, showComingSoon, confirmExitTest } from './navigation.js';
import { clearTimer, startTimer } from './timer.js';
import { shuffleArray, createStars, showToast, speakFrench, getBestFrenchVoice,
         launchConfetti } from './utils.js';
import { startTest, renderQuestion } from './test/engine.js';
import { playAudio } from './test/builders.js';
import { handleMC, handleTF, matchSelectLeft, matchSelectRight, verifyMatch } from './test/handlers.js';
import { buildEEQuestion, updateEECharCount, handleEEFill, handleEEWrite } from './test/ee.js';
import { buildEOQuestion, toggleEORecording, startEORecording, stopEORecording,
         handleEOSelfAssess } from './test/eo.js';
import { showFeedback, recordAnswer, nextQuestion, showResults, retryTest } from './test/results.js';
import { renderLevelsGrid, renderSkillsScreen } from './screens/levels.js';
import { renderHistory, clearHistory, updateHistoryBadge } from './screens/history.js';
import { buildSkillsTip, buildResultsTip } from './screens/tips.js';
import { renderTemario, temarioSetLevel } from './screens/temario.js';
import { startPractice, exitPractice, renderPractice, beginPracticeQuestions,
         handlePracticeMC, handlePracticeTF, nextPracticeQuestion, retryPractice } from './screens/practice.js';
import { exitConjugador, renderConjugador, selectConjGroup, selectConjVerb,
         beginConjPractice, verifyTense, resetConjugation } from './screens/conjugador.js';

import { TEST } from './state.js';

// ── Assign to window for HTML onclick attributes ──────────────

// Auth
window.initAuth = initAuth;
window.loginWithGoogle = loginWithGoogle;
window.loginFromProfileIcon = loginFromProfileIcon;
window.logout = logout;
window.renderAuthUI = renderAuthUI;
window.toggleProfileMenu = toggleProfileMenu;
window.closeProfileMenu = closeProfileMenu;
window.setUser = setUser;
window.canAccessTopic = canAccessTopic;
window.canAccessVerbGroup = canAccessVerbGroup;
window.activatePendingPayment = activatePendingPayment;

// Payment
window.startCheckout = startCheckout;
window.startAnonymousCheckout = startAnonymousCheckout;
window.showPaymentSuccessModal = showPaymentSuccessModal;
window.startPremium = startPremium;
window.showPostPaymentRegistrationModal = showPostPaymentRegistrationModal;
window.registerAfterPayment = registerAfterPayment;
window.showPaywall = showPaywall;
window.loginToExistingAccount = loginToExistingAccount;

// Navigation
window.showScreen = showScreen;
window.selectLevel = selectLevel;
window.selectSkill = selectSkill;
window.showComingSoon = showComingSoon;
window.confirmExitTest = confirmExitTest;

// Utils
window.showToast = showToast;
window.speakFrench = speakFrench;
window.launchConfetti = launchConfetti;

// Test engine
window.startTest = startTest;
window.renderQuestion = renderQuestion;

// Test builders
window.playAudio = playAudio;

// Test handlers
window.handleMC = handleMC;
window.handleTF = handleTF;
window.matchSelectLeft = matchSelectLeft;
window.matchSelectRight = matchSelectRight;
window.verifyMatch = verifyMatch;

// EE
window.updateEECharCount = updateEECharCount;
window.handleEEFill = handleEEFill;
window.handleEEWrite = handleEEWrite;

// EO
window.toggleEORecording = toggleEORecording;
window.handleEOSelfAssess = handleEOSelfAssess;

// Results
window.retryTest = retryTest;
window.nextQuestion = nextQuestion;

// Levels / Skills
window.renderLevelsGrid = renderLevelsGrid;
window.renderSkillsScreen = renderSkillsScreen;

// History
window.renderHistory = renderHistory;
window.clearHistory = clearHistory;

// Temario
window.temarioSetLevel = temarioSetLevel;

// Practice
window.startPractice = startPractice;
window.exitPractice = exitPractice;
window.beginPracticeQuestions = beginPracticeQuestions;
window.handlePracticeMC = handlePracticeMC;
window.handlePracticeTF = handlePracticeTF;
window.nextPracticeQuestion = nextPracticeQuestion;
window.retryPractice = retryPractice;

// Conjugador
window.exitConjugador = exitConjugador;
window.selectConjGroup = selectConjGroup;
window.selectConjVerb = selectConjVerb;
window.beginConjPractice = beginConjPractice;
window.verifyTense = verifyTense;
window.resetConjugation = resetConjugation;

// Expose TEST on window for inline onclick references like speakFrench(TEST.questions[...])
window.TEST = TEST;

/* ────────────────────────────────────────
   INIT
──────────────────────────────────────── */
function init() {
  createStars();
  renderLevelsGrid();
  updateHistoryBadge();
}

init();
