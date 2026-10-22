/**
 * Nền ảnh tự đổi: các slide crossfade liên tục, kèm chuyển động zoom rất chậm
 * (ken-burns) để ảnh không bị "chết" khi đang đứng yên.
 * Dùng CSS thuần để không cần JS timer và tự tắt khi `prefers-reduced-motion`.
 */
const SLIDES = [
  { src: '/images/highland-beans.jpg', alt: 'Hạt cà phê rang mộc' },
  { src: '/images/highland-brew.jpg', alt: 'Ly cà phê pha phin' },
  { src: '/images/highland-quan.jpg', alt: 'Không gian quán Highlands' },
]

export function PhotoBackdrop() {
  return (
    <div className="photo-band__slides" aria-hidden="true">
      {SLIDES.map((slide) => (
        <div className="photo-band__slide" key={slide.src}>
          <img src={slide.src} alt="" loading="lazy" decoding="async" />
        </div>
      ))}
    </div>
  )
}
