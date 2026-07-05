import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, frameImageUrl } from "../api/client";
import type { AnswerResponse, FrameDto, HintResponse, HintType, StartSessionResponse } from "../api/types";
import { useI18n } from "../i18n";
import { hapticError, hapticSuccess } from "../telegram/telegram";
import Timer from "../components/Timer";
import HintPanel from "../components/HintPanel";
import RoundResultOverlay from "../components/RoundResultOverlay";

const ROUND_SECONDS = 60;
const TOTAL_ATTEMPTS = 3;

type Phase = "loading" | "playing" | "result" | "error";

interface RoundState {
  sessionId: number;
  totalRounds: number;
  roundIndex: number;
  attemptsLeft: number;
  frame: FrameDto;
  deadline: number;
}

export default function GameScreen() {
  const navigate = useNavigate();
  const { t } = useI18n();

  const [phase, setPhase] = useState<Phase>("loading");
  const [round, setRound] = useState<RoundState | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [remaining, setRemaining] = useState(ROUND_SECONDS);
  const [result, setResult] = useState<AnswerResponse | null>(null);
  const [hints, setHints] = useState<HintResponse[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  const answerTextRef = useRef("");
  const timeoutHandledRef = useRef(false);
  const sessionRequestIdRef = useRef(0);

  useEffect(() => {
    startNewSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase !== "playing" || !round) return;
    const id = setInterval(() => {
      const secs = Math.max(0, Math.ceil((round.deadline - Date.now()) / 1000));
      setRemaining(secs);
      if (secs <= 0 && !timeoutHandledRef.current) {
        timeoutHandledRef.current = true;
        void handleTimeout();
      }
    }, 250);
    return () => clearInterval(id);
    // Re-subscribe on deadline change too: an attempt transition (hard ->
    // medium -> easy) resets the deadline without changing roundIndex, and
    // this closure needs the fresh value rather than the one from round start.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, round?.sessionId, round?.roundIndex, round?.deadline]);

  async function startNewSession() {
    const requestId = ++sessionRequestIdRef.current;
    setPhase("loading");
    try {
      const res = await api.startGame();
      if (sessionRequestIdRef.current !== requestId) return; // superseded by a newer request
      applyStart(res);
    } catch {
      if (sessionRequestIdRef.current === requestId) setPhase("error");
    }
  }

  function applyStart(res: StartSessionResponse) {
    setRound({
      sessionId: res.sessionId,
      totalRounds: res.totalRounds,
      roundIndex: res.roundIndex,
      attemptsLeft: res.attemptsLeft,
      frame: res.frame,
      deadline: Date.now() + res.timeLimitSeconds * 1000,
    });
    setAnswerText("");
    answerTextRef.current = "";
    setHints([]);
    setResult(null);
    setZoomed(false);
    timeoutHandledRef.current = false;
    setRemaining(res.timeLimitSeconds);
    setPhase("playing");
  }

  async function handleTimeout() {
    if (!round) return;
    const res = await api.submitAnswer(round.sessionId, answerTextRef.current);
    handleAnswerResult(res);
  }

  function handleAnswerResult(res: AnswerResponse) {
    if (res.isCorrect === false && res.roundFinished === false) {
      // Time carries over into the next attempt (medium/easy) if there was
      // still time left — giving up early doesn't buy a fresh clock. Only a
      // real timeout resets it to a full ROUND_SECONDS (see backend).
      const nextRemaining = res.remainingSeconds ?? ROUND_SECONDS;
      setRound((r) =>
        r
          ? {
              ...r,
              attemptsLeft: res.attemptsLeft ?? 1,
              frame: res.retryFrame ?? r.frame,
              deadline: Date.now() + nextRemaining * 1000,
            }
          : r
      );
      setAnswerText("");
      answerTextRef.current = "";
      timeoutHandledRef.current = false;
      setRemaining(nextRemaining);
      hapticError();
      return;
    }

    if (res.isCorrect) hapticSuccess();
    else hapticError();

    setResult(res);
    setPhase("result");
  }

  async function handleSubmit() {
    if (!round || submitting) return;
    setSubmitting(true);
    try {
      const res = await api.submitAnswer(round.sessionId, answerText);
      handleAnswerResult(res);
    } finally {
      setSubmitting(false);
    }
  }

  /** Player gives up on the current frame: forfeits this attempt (0 points) and moves on. */
  async function handleSkip() {
    if (!round || submitting) return;
    setSubmitting(true);
    try {
      const res = await api.submitAnswer(round.sessionId, "");
      handleAnswerResult(res);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleHint(hintType: HintType) {
    if (!round) return;
    try {
      const res = await api.useHint(round.sessionId, hintType);
      setHints((prev) => [...prev, res]);
    } catch {
      /* hint unavailable (already used / round expired) */
    }
  }

  function handleNext() {
    if (!round || !result) return;
    if (result.isSessionDone) {
      navigate(`/session/${round.sessionId}/end`, { state: result.sessionSummary });
      return;
    }
    if (result.nextFrame && typeof result.roundIndex === "number") {
      setRound({
        sessionId: round.sessionId,
        totalRounds: round.totalRounds,
        roundIndex: result.roundIndex,
        attemptsLeft: TOTAL_ATTEMPTS,
        frame: result.nextFrame,
        deadline: Date.now() + ROUND_SECONDS * 1000,
      });
      setAnswerText("");
      answerTextRef.current = "";
      setHints([]);
      setResult(null);
      setZoomed(false);
      timeoutHandledRef.current = false;
      setRemaining(ROUND_SECONDS);
      setPhase("playing");
    }
  }

  if (phase === "loading" || !round) {
    return (
      <div className="screen screen-center">
        <p>{t.game.loading}</p>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="screen screen-center">
        <p>Xatolik yuz berdi. Qayta urinib ko'ring.</p>
        <button className="btn btn-primary" onClick={startNewSession}>
          {t.result.next}
        </button>
      </div>
    );
  }

  return (
    <div className="screen game-screen">
      <div className="game-topbar">
        <span>
          {t.game.round} {round.roundIndex + 1}/{round.totalRounds}
        </span>
        <span>
          {round.attemptsLeft} {t.game.attemptsLeft}
        </span>
      </div>

      <Timer secondsLeft={remaining} totalSeconds={ROUND_SECONDS} />

      <div className="frame-container" onClick={() => setZoomed(true)}>
        <img src={frameImageUrl(round.frame.imageUrl)} alt="" className="frame-image" />
      </div>

      <HintPanel hintsUsed={hints} onUseHint={handleHint} disabled={phase !== "playing" || submitting} />

      <form
        className="answer-form"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit();
        }}
      >
        <input
          type="text"
          value={answerText}
          onChange={(e) => {
            setAnswerText(e.target.value);
            answerTextRef.current = e.target.value;
          }}
          placeholder={t.game.placeholder}
          disabled={submitting}
          autoFocus
        />
        <button type="submit" className="btn btn-primary" disabled={submitting || !answerText.trim()}>
          {t.game.submit}
        </button>
      </form>

      <button type="button" className="btn btn-secondary" disabled={submitting} onClick={() => void handleSkip()}>
        {t.game.skip}
      </button>

      {phase === "result" && result && <RoundResultOverlay result={result} onNext={handleNext} />}

      {zoomed && (
        <div className="frame-zoom-overlay" onClick={() => setZoomed(false)}>
          <img src={frameImageUrl(round.frame.imageUrl)} alt="" className="frame-zoom-image" />
        </div>
      )}
    </div>
  );
}
