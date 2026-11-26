import { useState, useEffect } from "preact/hooks";
import { getRemainingFixed, getRemainingEvergreen, pad, isUrgent } from "./countdownUtils";
import { ensureEvergreenEndTime } from "./evergreen";

const SIZE_STYLES = {
  small: { fontSize: "13px", padding: "14px 18px", minHeight: "88px", maxWidth: "280px" },
  medium: { fontSize: "15px", padding: "20px 24px", minHeight: "110px", maxWidth: "340px" },
  large: { fontSize: "18px", padding: "24px 28px", minHeight: "130px", maxWidth: "400px" },
};

const URGENCY_CSS = `
@keyframes helixoPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.45); transform: scale(1); }
  50% { box-shadow: 0 0 0 6px rgba(220, 38, 38, 0); transform: scale(1.01); }
}
@keyframes helixoShake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-3px); }
  40% { transform: translateX(3px); }
  60% { transform: translateX(-2px); }
  80% { transform: translateX(2px); }
}
.helixo-urgency-color_pulse {
  animation: helixoPulse 1.6s ease-in-out infinite;
  border: 1px solid #ef4444;
}
.helixo-urgency-shake {
  animation: helixoShake 0.8s ease-in-out infinite;
  border: 1px solid #f59e0b;
}
`;

export default function Countdown({ timer, onExpired }) {
  const [remaining, setRemaining] = useState(null);
  const design = timer?.design || {};
  const color = design.color || "#ffffff";
  const background = design.background || "#000000";
  const position = design.position === "bottom" ? "bottom" : "top";
  const sizeStyle = SIZE_STYLES[design.size] || SIZE_STYLES.medium;
  const urgencyNotification = design.urgencyNotification || "color_pulse";

  useEffect(() => {
    if (!timer) return;

    let endTimeMs = null;
    if (timer.timerType === "evergreen" && timer.durationHours) {
      endTimeMs = ensureEvergreenEndTime(timer.id, timer.durationHours);
    }

    const tick = () => {
      let r;
      if (timer.timerType === "fixed" && timer.endDate) {
        r = getRemainingFixed(timer.endDate);
        setRemaining(r);
        if (r.expired && onExpired) onExpired();
      } else if (timer.timerType === "evergreen" && endTimeMs != null) {
        r = getRemainingEvergreen(endTimeMs);
        if (r.expired) {
          endTimeMs = ensureEvergreenEndTime(timer.id, timer.durationHours);
          r = getRemainingEvergreen(endTimeMs);
        }
        setRemaining(r);
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timer, onExpired]);

  if (remaining == null || remaining.expired) return null;

  const urgent = isUrgent(remaining.totalMs);
  const urgencyClass =
    urgent && urgencyNotification !== "none"
      ? `helixo-urgency-${urgencyNotification}`
      : "";
  const headline = timer.labelText || timer.name || "YOUR SPECIAL OFFER ENDS IN";

  return (
    <>
      {urgent && urgencyNotification !== "none" && <style>{URGENCY_CSS}</style>}
      <div
        id="helixo-countdown"
        className={urgencyClass}
        data-position={position}
        data-size={design.size || "medium"}
        data-urgent={urgent ? "true" : "false"}
        style={{
          padding: sizeStyle.padding,
          minHeight: sizeStyle.minHeight,
          fontSize: sizeStyle.fontSize,
          background,
          color,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          borderRadius: "16px",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
          boxSizing: "border-box",
          width: "100%",
          maxWidth: sizeStyle.maxWidth,
          marginLeft: "auto",
        }}
      >
        <div
          style={{
            fontWeight: 600,
            lineHeight: 1.4,
            maxWidth: "22ch",
          }}
        >
          {headline}
        </div>
        <div
          style={{
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "0.04em",
            fontWeight: 600,
            fontSize: "1.05em",
          }}
        >
          {remaining.days > 0 ? `${remaining.days}d ` : ""}
          {pad(remaining.hours)}:{pad(remaining.minutes)}:{pad(remaining.seconds)}
        </div>
        {timer.description ? (
          <div style={{ fontSize: "0.85em", opacity: 0.85 }}>{timer.description}</div>
        ) : null}
      </div>
    </>
  );
}
