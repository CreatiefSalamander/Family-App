export type AIPersonality = 'vriend' | 'zakelijk' | 'coach' | 'rustig' | 'doelgericht' | 'motivator';
export type TransactieSoort = 'Inkomst' | 'Uitgave' | 'Aflossing' | 'Spaar' | 'Intern';
export type TransactieStatus = 'OK' | 'Controleer' | 'Intern';
export type SchuldStatus = 'Actief' | 'Open' | 'Afbetaald' | 'Bevroren';

export interface Transactie {
  id: string; created_at: string; user_id: string;
  amount: number; type: 'income' | 'expense';
  type_soort: TransactieSoort; description: string;
  category: string; date: string; photo_base64?: string;
  account_id?: string; source: string; status: TransactieStatus;
  tegenpartij?: string; saldo_na?: number;
  is_zakelijk: boolean; merchant_logo?: string;
}

export interface Rekening {
  id: string; user_id: string; name: string; bank_name: string;
  balance: number; color_gradient: string; account_number_masked: string;
  is_zakelijk?: boolean;
}

export interface Schuld {
  id: string; user_id: string; schuldeiser: string; type: string;
  oorspronkelijk: number; afgelost: number; maandtermijn: number;
  regeling?: string; start_datum?: string; einde_datum?: string;
  status: SchuldStatus; notitie?: string; kleur: string;
}

export interface Doel {
  id: string; user_id: string; name: string; emoji: string;
  target_amount: number; current_amount: number; deadline?: string;
}

export interface Budget {
  id: string; user_id: string; category: string; monthly_limit: number;
}

export interface CategorieRegel {
  id: string; user_id: string; zoekwoord: string; categorie: string;
  type: string; soort: TransactieSoort; icoon?: string; kleur?: string;
}

export interface Profiel {
  id: string; voornaam: string; achternaam: string;
  ai_persoonlijkheid: AIPersonality; locatie_toestemming: boolean;
  dark_mode: boolean; taal: string; onboarding_voltooid: boolean;
}
