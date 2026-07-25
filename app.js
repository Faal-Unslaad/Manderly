// ==========================================
// CONFIGURATION SUPABASE
// ==========================================
const SUPABASE_URL = 'https://keeqmcmbcnltsgizwsrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlZXFtY21iY25sdHNnaXp3c3J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5OTQwMzEsImV4cCI6MjEwMDU3MDAzMX0.g6sJKXMJ9EMCIaqyFpcMIHMW9FWmNanLSZOONS3mySY';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// GESTION DE L'INTERFACE (SPA)
// ==========================================
function showView(viewId) {
    // Cacher toutes les vues
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    // Enlever la classe active des liens
    document.querySelectorAll('.nav-links a').forEach(el => el.classList.remove('active'));
    
    // Afficher la vue demandée
    document.getElementById(`view-${viewId}`).classList.add('active');
    document.getElementById(`nav-${viewId}`).classList.add('active');

    // Charger les données en fonction de la vue
    if(viewId === 'houses') loadHouses();
    if(viewId === 'dashboard') loadDashboardData();
    if(viewId === 'mercuriale') loadMercuriale();
}

// ==========================================
// LOGIQUE MÉTIER & APPELS BDD
// ==========================================

// 1. Tableau de bord
async function loadDashboardData() {
    // Calcul de la richesse (Somme des revenus - dépenses)
    let { data: transactions, error } = await supabase.from('royal_treasury').select('*');
    if (error) return console.error(error);

    let total = 0;
    transactions.forEach(t => {
        if(t.transaction_type === 'INCOME') total += parseFloat(t.amount);
        else total -= parseFloat(t.amount);
    });
    
    document.getElementById('total-wealth').innerText = `${total.toLocaleString('fr-FR')} 🪙`;

    // Compteur de maisons
    let { count, error: countErr } = await supabase.from('houses').select('*', { count: 'exact', head: true });
    if (!countErr) document.getElementById('houses-count').innerText = count;
}

// 2. Maisons Nobles (Lecture et Écriture)
async function loadHouses() {
    const container = document.getElementById('houses-container');
    container.innerHTML = '<p style="color:var(--gold)">Recherche dans les archives...</p>';

    let { data: houses, error } = await supabase.from('houses').select('*').order('created_at', { ascending: false });
    
    if (error) {
        container.innerHTML = `<p style="color:red">Erreur des archives : ${error.message}</p>`;
        return;
    }

    container.innerHTML = '';
    houses.forEach(house => {
        const card = document.createElement('div');
        card.className = 'parchment-card house-card';
        card.innerHTML = `
            <h4>Maison ${house.name}</h4>
            <p class="house-motto">"${house.motto || 'Sans devise'}"</p>
            <p><strong>Couleurs :</strong> ${house.colors || 'Inconnues'}</p>
            <p><strong>Richesse Estimée :</strong> ${house.wealth.toLocaleString('fr-FR')} 🪙</p>
            <hr style="margin: 10px 0; border: 0; border-top: 1px solid #d2c2a3;">
            <p style="font-size: 0.9rem;">${house.description || 'Aucune archive disponible.'}</p>
            <!-- Bouton d'édition fictif pour montrer l'UI -->
            <button class="btn-royal" style="margin-top: 15px; padding: 5px 10px; font-size: 0.8rem;">Modifier le registre</button>
        `;
        container.appendChild(card);
    });
}

// Ajouter une nouvelle maison
document.getElementById('form-house').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.innerText = "Scellement...";

    const newHouse = {
        name: document.getElementById('h-name').value,
        motto: document.getElementById('h-motto').value,
        colors: document.getElementById('h-colors').value,
        description: document.getElementById('h-desc').value,
        wealth: 0
    };

    const { error } = await supabase.from('houses').insert([newHouse]);

    if (!error) {
        document.getElementById('modal-house').style.display = 'none';
        e.target.reset();
        loadHouses(); // Recharger la vue
    } else {
        alert("Le sceau s'est brisé : " + error.message);
    }
    btn.innerText = "Enregistrer dans les archives";
});

// Ajouter une écriture comptable
document.getElementById('form-treasury').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newTx = {
        reason: document.getElementById('t-reason').value,
        amount: document.getElementById('t-amount').value,
        transaction_type: document.getElementById('t-type').value
    };

    const { error } = await supabase.from('royal_treasury').insert([newTx]);
    
    if (!error) {
        e.target.reset();
        loadDashboardData(); // Mettre à jour le trésor
    } else {
        alert("Erreur comptable : " + error.message);
    }
});

// 3. Mercuriale (Prix des denrées)
async function loadMercuriale() {
    const container = document.getElementById('mercuriale-container');
    container.innerHTML = 'Chargement du registre...';

    let { data: items, error } = await supabase.from('mercuriale').select('*');
    if(error) return;

    let html = '<table style="width: 100%; text-align: left; border-collapse: collapse; color: var(--parchment);">';
    html += '<tr style="border-bottom: 1px solid var(--gold);"><th style="padding:10px;">Marchandise</th><th>Catégorie</th><th>Prix Officiel</th><th>Évolution</th></tr>';
    
    items.forEach(item => {
        const isUp = item.current_price > item.base_price;
        const color = isUp ? 'var(--red-seal)' : '#1c521c';
        const arrow = isUp ? '↑' : '↓';

        html += `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                <td style="padding: 15px 10px;"><strong>${item.name}</strong> (${item.unit})</td>
                <td>${item.category}</td>
                <td>${item.current_price} 🪙</td>
                <td style="color: ${color}">${arrow} ${Math.abs(item.current_price - item.base_price)} 🪙</td>
            </tr>
        `;
    });
    html += '</table>';
    container.innerHTML = html;
}

// Initialisation au lancement
window.onload = () => {
    loadDashboardData();
};