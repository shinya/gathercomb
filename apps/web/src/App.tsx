import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { BoardListPage } from './pages/BoardListPage';
import { BoardPage } from './pages/BoardPage';
import { AuthProvider } from './components/AuthProvider';

function App() {
  return (
    <AuthProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<BoardListPage />} />
          <Route path="/board/:id" element={<BoardPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
