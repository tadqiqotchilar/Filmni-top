export interface Dictionary {
  appName: string;
  home: {
    tagline: string;
    play: string;
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
    wrongTryAgain: string;
    loading: string;
  };
  result: {
    correct: string;
    incorrect: string;
    timedOut: string;
    points: string;
    correctAnswerWas: string;
    next: string;
  };
  sessionEnd: {
    title: string;
    correctCount: string;
    totalScore: string;
    yourRank: string;
    playAgain: string;
    share: string;
    backHome: string;
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
  };
}

export const uz: Dictionary = {
  appName: "Filmni Top",
  home: {
    tagline: "Kadrni ko'r, filmni top!",
    play: "O'ynash",
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
    wrongTryAgain: "Noto'g'ri, yana urinib ko'ring!",
    loading: "Yuklanmoqda...",
  },
  result: {
    correct: "To'g'ri!",
    incorrect: "Noto'g'ri",
    timedOut: "Vaqt tugadi",
    points: "ochko",
    correctAnswerWas: "To'g'ri javob",
    next: "Keyingisi",
  },
  sessionEnd: {
    title: "Sessiya tugadi!",
    correctCount: "To'g'ri javoblar",
    totalScore: "Umumiy ochko",
    yourRank: "Reytingdagi o'rningiz",
    playAgain: "Yana o'ynash",
    share: "Ulashish",
    backHome: "Bosh sahifa",
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
  },
};
