import { type ReactNode } from 'react'
import Navbar               from './Navbar'
import Sidebar              from './Sidebar'
import UpcomingEvents       from './UpcomingEvents'
import ConnectedApps        from './ConnectedApps'
import AddTaskModal         from './AddTaskModal'
import Toaster              from './Toaster'
import { useSidebar }       from '../hooks/useSidebar'
import { useGoogleTasks }   from '../hooks/useGoogleTasks'
import { useSlack }         from '../hooks/useSlack'

interface AppShellProps {
  children: ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const { isOpen, isMobile, toggle, close } = useSidebar()

  // Integration hooks run at the top level so they init regardless of UI state
  const { connect: connectGoogle } = useGoogleTasks()
  const { connect: connectSlack  } = useSlack()

  return (
    <div className="shell">
      <Navbar onMenuClick={toggle} sidebarOpen={isOpen} />

      <div className="shell__body">
        <Sidebar isOpen={isOpen} isMobile={isMobile} onClose={close} />
        <main className="shell__main">{children}</main>

        {/* Right rail — stacks Upcoming Events + Connected Apps */}
        <div className="shell__right">
          <UpcomingEvents />
          <ConnectedApps
            onGoogleConnect={connectGoogle}
            onSlackConnect={connectSlack}
          />
        </div>
      </div>

      <AddTaskModal />
      <Toaster />
    </div>
  )
}
