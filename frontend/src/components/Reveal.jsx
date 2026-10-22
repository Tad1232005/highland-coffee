import { useEffect, useRef, useState } from 'react'

/**
 * Hiệu ứng xuất hiện khi cuộn tới: chỉ chạy một lần, tôn trọng `prefers-reduced-motion`.
 * - `fade`: trôi lên nhẹ (mặc định)
 * - `wipe`: rèm mở từ dưới lên (dùng overflow ẩn, không dùng clip-path để không
 *   làm IntersectionObserver bị bỏ sót phần tử)
 * - `line`: đường kẻ vẽ ra từ trái
 */
export function Reveal({ as: Tag = 'div', variant = 'fade', delay = 0, className = '', children }) {
  const [shown, setShown] = useState(() => typeof IntersectionObserver === 'undefined')
  const ref = useRef(null)

  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') return undefined

    let revealed = false
    const reveal = () => {
      if (revealed) return
      revealed = true
      setShown(true)
      observer.disconnect()
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) reveal()
        })
      },
      { threshold: 0, rootMargin: '0px 0px -5% 0px' },
    )

    observer.observe(node)
    // Chốt an toàn: nội dung không bao giờ bị ẩn vĩnh viễn.
    const failsafe = setTimeout(reveal, 3000)
    return () => {
      clearTimeout(failsafe)
      observer.disconnect()
    }
  }, [])

  const classes = [
    'reveal',
    variant !== 'fade' ? `reveal--${variant}` : '',
    shown ? 'is-revealed' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const style = delay ? { '--reveal-delay': `${delay}ms` } : undefined

  if (variant === 'wipe') {
    return (
      <Tag ref={ref} className={classes} style={style}>
        <span className="reveal__curtain">{children}</span>
      </Tag>
    )
  }

  return (
    <Tag ref={ref} className={classes} style={style}>
      {children}
    </Tag>
  )
}
