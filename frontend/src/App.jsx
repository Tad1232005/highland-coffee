import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthProvider'
import { CartProvider } from './context/CartProvider'
import { ConfirmProvider, ToastProvider } from './components'
import { AppRoutes } from './routes'

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <ConfirmProvider>
          <AuthProvider>
            <CartProvider>
              <AppRoutes />
            </CartProvider>
          </AuthProvider>
        </ConfirmProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
