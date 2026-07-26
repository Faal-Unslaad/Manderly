import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Scroll, PlusCircle } from 'lucide-react';

export const Route = createFileRoute('/decrees')({
  component: DecreesPage,
});

function DecreesPage() {
  const [decrees, setDecrees] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    fetchDecrees();
  }, []);

  async function fetchDecrees() {
    const { data } = await supabase.from('decrees').select('*').order('created_at', { ascending: false });
    if (data) setDecrees(data);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await supabase.from('decrees').insert([{ title, content }]);
    setTitle('');
    setContent('');
    fetchDecrees();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="panel-medieval p-6 space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2 text-[var(--color-oxblood)] border-b border-[var(--color-gold)] pb-2">
          <PlusCircle size={20} /> Promulguer un Décret Royal
        </h2>
        <div>
          <label className="block text-sm font-bold mb-1">Titre du Décret</label>
          <input 
            className="w-full p-2 bg-[#f4ecd8] border border-[var(--color-dark-wood)]" 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            placeholder="Ex: Édit sur les taxes du blé" 
            required 
          />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">Contenu</label>
          <textarea 
            className="w-full p-2 bg-[#f4ecd8] border border-[var(--color-dark-wood)]" 
            rows={4} 
            value={content} 
            onChange={e => setContent(e.target.value)} 
            placeholder="Rédigez l'ordonnance royale..." 
            required 
          />
        </div>
        <button type="submit" className="btn-royal">Publier le Décret</button>
      </form>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-[var(--color-dark-wood)] flex items-center gap-2">
          <Scroll size={24} /> Archives des Décrets
        </h2>
        {decrees.map((d) => (
          <article key={d.id} className="panel-medieval p-4">
            <h3 className="font-bold text-lg text-[var(--color-oxblood)]">{d.title}</h3>
            <p className="mt-2 whitespace-pre-line">{d.content}</p>
            <span className="text-xs text-[var(--color-stone)] mt-2 block">
              Promulgué le {new Date(d.created_at).toLocaleDateString('fr-FR')}
            </span>
          </article>
        ))}
      </div>
    </div>
  );
}