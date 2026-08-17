import { ServiceUnit } from '../types';

export interface ServicePreset {
  description: string;
  category: 'Fourniture & Pose' | 'Pose seule' | 'Fourniture seule' | 'Main d\'œuvre' | 'Étude & Conseil';
  unit: ServiceUnit;
  quantity: number;
  unitPriceHT: number;
  vatRate: number;
}

/**
 * Article par défaut ajouté automatiquement lors de la création d'une nouvelle facture vierge.
 */
export const DEFAULT_INITIAL_ITEM = {
  description: 'Fourniture et pose de fenêtres Aluminium double vitrage profilé thermique',
  category: 'Fourniture & Pose' as const,
  unit: 'U' as ServiceUnit,
  quantity: 1,
  unitPriceHT: 45000,
  vatRate: 9,
  discountPercent: 0,
};

/**
 * Liste des modèles/raccourcis de prestations BTP pré-enregistrées.
 * Vous pouvez modifier, ajouter ou supprimer des articles dans cette liste.
 */
export const SERVICE_PRESETS: ServicePreset[] = [
  {
    description: 'Fourniture et pose de fenêtres Aluminium double vitrage profilé thermique',
    category: 'Fourniture & Pose',
    unit: 'U',
    quantity: 4,
    unitPriceHT: 45000,
    vatRate: 9,
  },
  {
    description: 'Fourniture et pose de dalle de sol Grès Cérame 60x60cm Mât avec mortier colle spécial',
    category: 'Fourniture & Pose',
    unit: 'm²',
    quantity: 50,
    unitPriceHT: 3500,
    vatRate: 9,
  },
  {
    description: 'Fourniture et pose de garde-corps vitré inox pour balcons et terrasses',
    category: 'Fourniture & Pose',
    unit: 'ml',
    quantity: 15,
    unitPriceHT: 18500,
    vatRate: 9,
  },
  {
    description: 'Fourniture et pose de faux plafond en plaques de plâtre BA13 avec ossature métallique',
    category: 'Fourniture & Pose',
    unit: 'm²',
    quantity: 80,
    unitPriceHT: 2400,
    vatRate: 9,
  },
  {
    description: 'Main d\'œuvre de pose et mise en œuvre chantier par équipe spécialisée',
    category: 'Pose seule',
    unit: 'Jour',
    quantity: 3,
    unitPriceHT: 15000,
    vatRate: 9,
  },
  {
    description: 'Forfait dépose ancienne installation, préparation du support et nettoyage chantier',
    category: 'Pose seule',
    unit: 'Forfait',
    quantity: 1,
    unitPriceHT: 25000,
    vatRate: 9,
  },
];
