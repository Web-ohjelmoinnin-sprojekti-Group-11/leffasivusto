// src/App.jsx
import React from 'react'

export default function App() {
  return (
    <div className="container py-5">
      <header className="mb-4">
        <h1 className="h2">Leffasivusto toimii</h1>
        <p className="text-muted mb-0">
          React + Vite + Bootstrap on käynnissä. Tämä on vain testi.
        </p>
      </header>

      <section className="mb-4">
        <div className="card shadow-sm">
          <div className="card-body">
            <h2 className="h5">Bootstrap-testi</h2>
            <p className="mb-3">
              Jos alla oleva nappi on tyylittynyt siniseksi, Bootstrap CSS latautuu oikein.
            </p>
            <button className="btn btn-primary">Testinappi</button>
          </div>
        </div>
      </section>

      <footer className="text-center text-muted small">
        Build: React 19 • Vite • Bootstrap 5
      </footer>
    </div>
  )
}
