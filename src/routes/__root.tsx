import { createRootRoute, Outlet } from '@tanstack/react-router';
import '../styles.css';

export const Route = createRootRoute({
  component: () => (
    <div className="min-h-screen p-8">
      <header className="mb-8 border-b-4 border-[var(--color-oxblood)] pb-4">
        <h1 className="text-4xl font-bold text-[var(--color-dark-wood)] uppercase tracking-wider">
          Trésor Royal de Skarnfell
        </h1>
        <p className="text-[var(--color-stone)] italic">Administration économique et fiscale</p>
      </header>
      
      <main>
        <Outlet />
      </main>
      
      <footer className="mt-12 text-center text-sm text-[var(--color-stone)] border-t border-[var(--color-gold)] pt-4">
        <p>Registre officiel du Royaume. Toute falsification est punie de la peine capitale.</p>
      </footer>
    </div>
  ),
});