import Header from './components/layout/Header.jsx';
import AppRoutes from './routes/AppRoutes.jsx';
import SiteFooter from './components/layout/SiteFooter.jsx';

export default function App() {
  return (
    <div className="app-shell d-flex flex-column min-vh-100">
      <Header />
      <main className="flex-grow-1 py-3 container-fluid">
        <AppRoutes />
      </main>
      <SiteFooter />
    </div>
  );
}
