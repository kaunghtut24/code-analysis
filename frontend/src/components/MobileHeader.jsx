import { Menu, Bot, ArrowLeft } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function MobileHeader({ setSidebarOpen, title = "AI Code Assistant", showBack = false }) {
  const navigate = useNavigate()
  const location = useLocation()
  const handleBack = () => {
    if (location.pathname === '/chat-demo') {
      navigate('/')
    } else {
      navigate(-1)
    }
  }

  return (
    <div className="lg:hidden flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200">
      {showBack ? (
        <button
          onClick={handleBack}
          className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      ) : (
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
        >
          <Menu className="w-6 h-6" />
        </button>
      )}

      <div className="flex items-center flex-1 justify-center">
        <Bot className="w-6 h-6 text-blue-600" />
        <span className="ml-2 text-lg font-semibold text-gray-900 truncate">{title}</span>
      </div>

      <div className="w-10" /> {/* Spacer for centering */}
    </div>
  )
}
