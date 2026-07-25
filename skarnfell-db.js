/**
 * SKARNFELL ERP - Module d'accès aux données Supabase
 * Gestion de la Mercuriale, des Taxes, des Propriétés et du Journal d'Audit.
 */

// Initialisation globale (s'assure que Supabase est chargé)
if (!window.supabase) {
    console.error("Le SDK Supabase doit être inclus avant ce module.");
}

// Remplace par tes identifiants Supabase (Project Settings > API)
const SUPABASE_URL = 'https://keeqmcmbcnltsgizwsrz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_y-ju2brRwB5fPuNzySHuzw_b6s1Tb-M';

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const SkarnfellDB = {

    // ==================================================================
    // 1. MODULE MERCURIALE (Prix & Marchandises)
    // ==================================================================

    /** Récupère la liste complète des marchandises */
    async getMarketPrices() {
        const { data, error } = await db
            .from('market_prices')
            .select('*')
            .order('category', { ascending: true });
        
        if (error) throw new Error(`[Mercuriale] Erreur de lecture : ${error.message}`);
        return data;
    },

    /** Ajoute un nouvel article à la mercuriale */
    async createMarketPrice(itemData) {
        const { data, error } = await db
            .from('market_prices')
            .insert([itemData])
            .select();

        if (error) throw new Error(`[Mercuriale] Erreur de création : ${error.message}`);
        
        await this._logAudit('market_prices', data[0].id, 'CREATE', null, data[0]);
        return data[0];
    },

    /** Met à jour un article et consigne l'ancienne valeur dans l'audit */
    async updateMarketPrice(id, updatedFields) {
        // 1. Récupération de l'ancienne version pour l'audit
        const { data: oldData } = await db.from('market_prices').select('*').eq('id', id).single();

        // 2. Mise à jour
        const { data, error } = await db
            .from('market_prices')
            .update({ ...updatedFields, updated_at: new Date() })
            .eq('id', id)
            .select();

        if (error) throw new Error(`[Mercuriale] Erreur de modification : ${error.message}`);

        await this._logAudit('market_prices', id, 'UPDATE', oldData, data[0]);
        return data[0];
    },

    /** Supprime un article de la mercuriale */
    async deleteMarketPrice(id) {
        const { data: oldData } = await db.from('market_prices').select('*').eq('id', id).single();

        const { error } = await db
            .from('market_prices')
            .delete()
            .eq('id', id);

        if (error) throw new Error(`[Mercuriale] Erreur de suppression : ${error.message}`);

        await this._logAudit('market_prices', id, 'DELETE', oldData, null);
        return true;
    },


    // ==================================================================
    // 2. MODULE TAXES & IMPÔTS
    // ==================================================================

    /** Récupère toutes les taxes actives avec le nom de la maison bénéficiaire */
    async getTaxes() {
        const { data, error } = await db
            .from('taxes')
            .select(`
                *,
                beneficiary:noble_houses(name)
            `)
            .order('name', { ascending: true });

        if (error) throw new Error(`[Taxes] Erreur de lecture : ${error.message}`);
        return data;
    },

    /** Crée un nouveau décret fiscal ou taxe */
    async createTax(taxData) {
        const { data, error } = await db
            .from('taxes')
            .insert([taxData])
            .select();

        if (error) throw new Error(`[Taxes] Erreur de création : ${error.message}`);

        await this._logAudit('taxes', data[0].id, 'CREATE', null, data[0]);
        return data[0];
    },

    /** Modifie le taux ou le montant d'une taxe */
    async updateTax(id, updatedFields) {
        const { data: oldData } = await db.from('taxes').select('*').eq('id', id).single();

        const { data, error } = await db
            .from('taxes')
            .update(updatedFields)
            .eq('id', id)
            .select();

        if (error) throw new Error(`[Taxes] Erreur de modification : ${error.message}`);

        await this._logAudit('taxes', id, 'UPDATE', oldData, data[0]);
        return data[0];
    },

    /** Désactive ou supprime une taxe */
    async deleteTax(id) {
        const { data: oldData } = await db.from('taxes').select('*').eq('id', id).single();

        const { error } = await db
            .from('taxes')
            .delete()
            .eq('id', id);

        if (error) throw new Error(`[Taxes] Erreur de suppression : ${error.message}`);

        await this._logAudit('taxes', id, 'DELETE', oldData, null);
        return true;
    },


    // ==================================================================
    // 3. MODULE PROPRIÉTÉS
    // ==================================================================

    /** Récupère les propriétés du royaume jointes à leurs maisons propriétaires */
    async getProperties() {
        const { data, error } = await db
            .from('properties')
            .select(`
                *,
                owner:noble_houses(id, name, coat_of_arms_url)
            `)
            .order('name', { ascending: true });

        if (error) throw new Error(`[Propriétés] Erreur de lecture : ${error.message}`);
        return data;
    },

    /** Enregistre un nouveau domaine/bâtiment */
    async createProperty(propertyData) {
        const { data, error } = await db
            .from('properties')
            .insert([propertyData])
            .select();

        if (error) throw new Error(`[Propriétés] Erreur de création : ${error.message}`);

        await this._logAudit('properties', data[0].id, 'CREATE', null, data[0]);
        return data[0];
    },

    /** Met à jour la valeur, le rendement ou le statut d'une propriété */
    async updateProperty(id, updatedFields) {
        const { data: oldData } = await db.from('properties').select('*').eq('id', id).single();

        const { data, error } = await db
            .from('properties')
            .update({ ...updatedFields, updated_at: new Date() })
            .eq('id', id)
            .select();

        if (error) throw new Error(`[Propriétés] Erreur de modification : ${error.message}`);

        await this._logAudit('properties', id, 'UPDATE', oldData, data[0]);
        return data[0];
    },

    /** Transfère la propriété d'un domaine à une autre maison noble */
    async transferProperty(propertyId, newHouseId) {
        return await this.updateProperty(propertyId, { house_id: newHouseId });
    },


    // ==================================================================
    // 4. MOTEUR D'AUDIT INTERNE (Historique)
    // ==================================================================

    /** Enregistre automatiquement un snapshot JSONB des modifications */
    async _logAudit(tableName, recordId, action, oldData, newData) {
        try {
            await db.from('audit_logs').insert([{
                table_name: tableName,
                record_id: recordId,
                action: action,
                old_data: oldData,
                new_data: newData,
                performed_by: 'Grand Argentier'
            }]);
        } catch (auditError) {
            console.warn("Échec de l'écriture dans le journal d'audit :", auditError);
        }
    },

    /** Récupère l'historique d'une entité spécifique pour la comparaison vert/rouge */
    async getEntityHistory(tableName, recordId) {
        const { data, error } = await db
            .from('audit_logs')
            .select('*')
            .eq('table_name', tableName)
            .eq('record_id', recordId)
            .order('created_at', { ascending: false });

        if (error) throw new Error(`[Audit] Erreur de lecture : ${error.message}`);
        return data;
    }

    // Exemple 1 : Charger la mercuriale au démarrage
    async function initMercuriale() {
        try {
            const items = await SkarnfellDB.getMarketPrices();
            console.log("Marchandises :", items);
        } catch (err) {
            alert(err.message);
        }
    }

    // Exemple 2 : Augmenter la valeur d'une mine de fer
    async function reevaluerMine(propertyId) {
        await SkarnfellDB.updateProperty(propertyId, {
            monthly_production_value: 28000,
            status: 'operationnel'
        });
        alert("Registre mis à jour et consigné dans l'historique d'audit !");
}
};