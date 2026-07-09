export interface Dictionary {
  appName: string;
  home: {
    tagline: string;
    leaderboard: string;
    settings: string;
    totalScore: string;
    gamesPlayed: string;
  };
  game: {
    round: string;
    timeLeft: string;
    attemptsLeft: string;
    placeholder: string;
    submit: string;
    hintFirstLetter: string;
    hintYear: string;
    hintGenre: string;
    hintLettersCount: string;
    loading: string;
    skip: string;
  };
  result: {
    correct: string;
    incorrect: string;
    timedOut: string;
    points: string;
    correctAnswerWas: string;
    next: string;
  };
  stages: {
    title: string;
    locked: string;
    foundLabel: string;
    stageLabel: string;
    progress: string;
    stageComplete: string;
    nextUnlocked: string;
  };
  leaderboard: {
    title: string;
    weekly: string;
    all: string;
    you: string;
  };
  settings: {
    title: string;
    language: string;
    resetTitle: string;
    resetDescription: string;
    resetButton: string;
    resetConfirm: string;
    resetting: string;
    resetError: string;
    cancel: string;
  };
}

export const uz: Dictionary = {
  appName: "Filmni Top",
  home: {
    tagline: "Kadrni ko'r, filmni top!",
    leaderboard: "Reyting",
    settings: "Sozlamalar",
    totalScore: "Umumiy ochko",
    gamesPlayed: "O'yinlar",
  },
  game: {
    round: "Raund",
    timeLeft: "vaqt",
    attemptsLeft: "urinish",
    placeholder: "Film nomini yozing...",
    submit: "Javob berish",
    hintFirstLetter: "Birinchi harf (10)",
    hintYear: "Yil (15)",
    hintGenre: "Janr (10)",
    hintLettersCount: "Harflar soni (5)",
    loading: "Yuklanmoqda...",
    skip: "Keyingi kadr",
  },
  result: {
    correct: "To'g'ri!",
    incorrect: "Noto'g'ri",
    timedOut: "Vaqt tugadi",
    points: "ochko",
    correctAnswerWas: "To'g'ri javob",
    next: "Keyingisi",
  },
  stages: {
    title: "Bosqichlar",
    locked: "Yopiq",
    foundLabel: "Topilgan",
    stageLabel: "Bosqich",
    progress: "topildi",
    stageComplete: "Bosqich tugallandi!",
    nextUnlocked: "Keyingi bosqich ochildi!",
  },
  leaderboard: {
    title: "Liderlar jadvali",
    weekly: "Haftalik",
    all: "Umumiy",
    you: "Siz",
  },
  settings: {
    title: "Sozlamalar",
    language: "Til",
    resetTitle: "O'yinni yangilash",
    resetDescription: "Barcha ochko va bosqich progressingiz 0 ga tushiriladi. Bu amalni orqaga qaytarib bo'lmaydi.",
    resetButton: "O'yinni yangilash",
    resetConfirm: "Rostdan ham barcha natijalaringizni 0 ga tushirmoqchimisiz? Bu amalni bekor qilib bo'lmaydi.",
    resetting: "Yangilanmoqda...",
    resetError: "O'yinni yangilab bo'lmadi. Qayta urinib ko'ring.",
    cancel: "Bekor qilish",
  },
};
