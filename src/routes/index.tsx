import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Scroll, Coins, FileSignature } from 'lucide-react';

export const Route = createFileRoute('/')({
  component: Dashboard,
});

function Dashboard() {
  const [houses, setHouses] = useState<any[]>([]);

  useEffect(() => {
    async function fetchHouses() {
      const { data, error } = await supabase.from('houses').select('*');
      if (!error && data) {
        setHouses(data);
      }
    }
    fetchHouses();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Module Navigation Rapide */}
      <nav className="col-span-1 md:col-span-3 flex gap-4 mb-6">
        <button className="btn-royal flex items-center gap-2"><Scroll size={18} /> Décrets</button>
        <button className="btn-royal flex items-center gap-2"><Coins size={18} /> Taxes & Impôts</button>
        <button className="btn-royal flex items-center gap-2"><FileSignature size={18} /> Registre</button>
      </nav>

      {/* Liste des Maisons */}
      <section className="panel-medieval p-6 md:col-span-2">
        <h2 className="text-2xl font-bold mb-4 border-b border-[var(--color-gold)]">Maisons Nobles</h2>
        {houses.length === 0 ? (
          <p className="italic text-[var(--color-stone)]">Aucun registre trouvé dans les archives...</p>
        ) : (
          <ul className="space-y-2">
            {houses.map((house) => (
              <li key={house.id} className="flex justify-between items-center p-2 hover:bg-[#d6cbab]">
                <span className="font-bold">{house.name}</span>
                <span className="text-[var(--color-oxblood)]">{house.wealth} Or</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Résumé Fiscal */}
      <aside className="panel-medieval p-6">
        <h2 className="text-xl font-bold mb-4 text-[var(--color-oxblood)]">Trésorerie</h2>
        <div className="text-center py-8">
          <p className="text-5xl text-[var(--color-gold)] font-bold">42,500</p>
          <p className="text-sm mt-2 text-[var(--color-stone)]">Pièces d'or en réserve</p>
        </div>
      </aside>
    </div>
  );
}