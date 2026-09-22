export default function CourtIllustration() {
  return (
    <svg viewBox="0 0 400 260" width="100%" height="100%" fill="none" stroke="#ffffff" strokeWidth="3">
      <rect x="20" y="20" width="360" height="220" rx="6" />
      <line x1="200" y1="20" x2="200" y2="240" />
      <circle cx="200" cy="20" r="5" fill="#ffffff" stroke="none" />
      <circle cx="200" cy="240" r="5" fill="#ffffff" stroke="none" />
      <path d="M70 200 Q 200 70 330 200" strokeDasharray="9 9" />
      <circle r="11" fill="#d6ff00" stroke="#ffffff" strokeWidth="3">
        <animateMotion
          dur="2.8s"
          repeatCount="indefinite"
          keyPoints="0;1;0"
          keyTimes="0;0.5;1"
          calcMode="linear"
          path="M70 200 Q 200 70 330 200"
        />
      </circle>
    </svg>
  );
}
