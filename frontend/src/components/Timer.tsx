interface TimerProps {
  secondsLeft: number;
  totalSeconds: number;
}

export default function Timer({ secondsLeft, totalSeconds }: TimerProps) {
  const ratio = Math.max(0, Math.min(1, secondsLeft / totalSeconds));
  const isLow = secondsLeft <= 10;

  return (
    <div className={`timer ${isLow ? "timer-low" : ""}`}>
      <div className="timer-bar-track">
        <div className="timer-bar-fill" style={{ width: `${ratio * 100}%` }} />
      </div>
      <span className="timer-value">{secondsLeft}s</span>
    </div>
  );
}
