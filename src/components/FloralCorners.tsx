import './FloralCorners.css'

/** Thin botanical corner sprigs inspired by the save-the-date. */
export function FloralCorners({ className = '' }: { className?: string }) {
  return (
    <div className={`floral-corners ${className}`.trim()} aria-hidden="true">
      <svg className="floral-corners__sprig floral-corners__sprig--tl" viewBox="0 0 80 80" fill="none">
        <path
          d="M12 68 C18 50 28 38 48 28 M20 58 C30 52 40 42 46 30 M28 66 C34 54 42 46 52 40 M14 48 C26 46 38 38 44 28"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <circle cx="48" cy="26" r="2.2" fill="currentColor" />
        <circle cx="52" cy="40" r="1.6" fill="currentColor" />
      </svg>
      <svg className="floral-corners__sprig floral-corners__sprig--tr" viewBox="0 0 80 80" fill="none">
        <path
          d="M68 68 C62 50 52 38 32 28 M60 58 C50 52 40 42 34 30 M52 66 C46 54 38 46 28 40 M66 48 C54 46 42 38 36 28"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <circle cx="32" cy="26" r="2.2" fill="currentColor" />
        <circle cx="28" cy="40" r="1.6" fill="currentColor" />
      </svg>
      <svg className="floral-corners__sprig floral-corners__sprig--bl" viewBox="0 0 80 80" fill="none">
        <path
          d="M12 12 C18 30 28 42 48 52 M20 22 C30 28 40 38 46 50 M28 14 C34 26 42 34 52 40 M14 32 C26 34 38 42 44 52"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <circle cx="48" cy="54" r="2.2" fill="currentColor" />
        <circle cx="52" cy="40" r="1.6" fill="currentColor" />
      </svg>
      <svg className="floral-corners__sprig floral-corners__sprig--br" viewBox="0 0 80 80" fill="none">
        <path
          d="M68 12 C62 30 52 42 32 52 M60 22 C50 28 40 38 34 50 M52 14 C46 26 38 34 28 40 M66 32 C54 34 42 42 36 52"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <circle cx="32" cy="54" r="2.2" fill="currentColor" />
        <circle cx="28" cy="40" r="1.6" fill="currentColor" />
      </svg>
    </div>
  )
}
