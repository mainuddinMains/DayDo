import { useState, useEffect } from 'react'

const MOBILE_BREAKPOINT = 768

export function useSidebar() {
  const [isOpen, setIsOpen] = useState(() => window.innerWidth >= MOBILE_BREAKPOINT)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < MOBILE_BREAKPOINT)

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      const mobile = entry.contentRect.width < MOBILE_BREAKPOINT
      setIsMobile(mobile)
      if (!mobile) setIsOpen(true)
      else setIsOpen(false)
    })
    observer.observe(document.body)
    return () => observer.disconnect()
  }, [])

  const toggle = () => setIsOpen((v) => !v)
  const close  = () => setIsOpen(false)

  return { isOpen, isMobile, toggle, close }
}
