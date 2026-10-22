import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Footer } from './Footer'
import { Header } from './Header'
import { MobileTabBar } from './MobileTabBar'

export function SiteLayout() {
  const { pathname } = useLocation()

  useEffect(() => {
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [pathname])

  return (
    <>
      <Header />
      <main className="page-shell">
        <Outlet />
      </main>
      <Footer />
      <MobileTabBar />
    </>
  )
}
