import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from '@/components/theme-provider'
import { LanguageProvider } from '@/components/language-provider'

createRoot(document.getElementById("root")!).render(
  <LanguageProvider defaultLanguage="en" storageKey="dap-ui-language">
    <ThemeProvider defaultTheme="dark" storageKey="dap-ui-theme">
      <App />
    </ThemeProvider>
  </LanguageProvider>
);
