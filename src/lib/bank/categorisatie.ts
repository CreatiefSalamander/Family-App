export const EIGEN_IBANS = ['NL69RABO0366244914', 'NL75INGB0797648585'];

export interface CategorisatieResultaat {
  categorie: string; type: string; soort: string;
  status: string; icoon: string; kleur: string;
}

export function categoriseerTransactie(
  tegenpartij: string, omschrijving: string, tegenrekIBAN: string,
  regels: Array<{ zoekwoord: string; categorie: string; type: string; soort: string; icoon?: string; kleur?: string; }>
): CategorisatieResultaat {
  if (EIGEN_IBANS.includes(tegenrekIBAN?.toUpperCase()) || (tegenpartij + omschrijving).toLowerCase().includes('abdulaziz faraj')) {
    return { categorie: 'Eigen rekening', type: 'Intern', soort: 'Intern', status: 'Intern', icoon: 'ArrowLeftRight', kleur: '#6B7280' };
  }
  const zoektekst = (tegenpartij + ' ' + omschrijving).toLowerCase();
  for (const regel of regels) {
    if (zoektekst.includes(regel.zoekwoord.toLowerCase())) {
      return { categorie: regel.categorie, type: regel.type, soort: regel.soort, status: 'OK', icoon: regel.icoon || 'Receipt', kleur: regel.kleur || '#6B7280' };
    }
  }
  return { categorie: 'Ongecategoriseerd', type: 'Privé', soort: 'Uitgave', status: 'Controleer', icoon: 'Receipt', kleur: '#6B7280' };
}
