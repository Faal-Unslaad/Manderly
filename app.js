// Remplacez par les véritables clés de votre projet Supabase (Project Settings > API)
const SUPABASE_URL = 'https://keeqmcmbcnltsgizwsrz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlZXFtY21iY25sdHNnaXp3c3J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5OTQwMzEsImV4cCI6MjEwMDU3MDAzMX0.g6sJKXMJ9EMCIaqyFpcMIHMW9FWmNanLSZOONS3mySY';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const decreeForm = document.getElementById('decree-form');
const decreeList = document.getElementById('decree-list');

// 1. Fonction pour récupérer et afficher les décrets
async function chargerDecrets() {
    const { data, error } = await supabase
        .from('decrets')
        .select('*')
        .order('id', { ascending: false });

    if (error) {
        console.error('Erreur lors du chargement:', error);
        return;
    }

    decreeList.innerHTML = '';
    data.forEach(decret => {
        const li = document.createElement('li');
        // Utilisation des classes CSS du thème pour le style de la liste
        li.innerHTML = `
            <button>
                <div>
                    <strong>${decret.titre}</strong>
                    <small>Sceau royal apposé</small>
                </div>
            </button>
        `;
        decreeList.appendChild(li);
    });
}

// 2. Fonction pour ajouter un nouveau décret
decreeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const titreInput = document.getElementById('titre').value;

    const { data, error } = await supabase
        .from('decrets')
        .insert([{ titre: titreInput }]);

    if (error) {
        alert('Erreur: Impossible de sceller le décret.');
        console.error(error);
    } else {
        decreeForm.reset();
        chargerDecrets(); // Rafraîchit la liste
    }
});

// Charger les données dès l'ouverture du registre
chargerDecrets();