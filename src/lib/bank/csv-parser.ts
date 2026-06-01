import Papa from 'papaparse';

export interface RuweTransactie {
  datum: string; omschrijving: string; tegenpartij: string;
  bedrag: number; saldo: number; tegenrekIBAN: string; bron: string;
}

export function detecteerBank(headers: string[]): string {
  const h = headers.join(',').toLowerCase();
  if (h.includes('volgnr')) return 'Rabobank';
  if (h.includes('mutatiesoort')) return 'ING';
  return 'Onbekend';
}

export function parseRabobankCSV(inhoud: string): RuweTransactie[] {
  const result = Papa.parse(inhoud, { header: true, delimiter: ';', skipEmptyLines: true });
  return (result.data as Record<string,string>[]).map(r => ({
    datum: r['Datum'] || '',
    omschrijving: [r['Omschrijving-1'], r['Omschrijving-2'], r['Omschrijving-3']].filter(Boolean).join(' ').trim(),
    tegenpartij: r['Naam tegenpartij'] || '',
    bedrag: parseFloat((r['Bedrag'] || '0').replace(',', '.')),
    saldo: parseFloat((r['Saldo na trn'] || '0').replace(',', '.')),
    tegenrekIBAN: r['Tegenrekening IBAN/BBAN'] || '',
    bron: 'Rabobank',
  }));
}

export function parseINGCSV(inhoud: string): RuweTransactie[] {
  const result = Papa.parse(inhoud, { header: true, delimiter: ',', skipEmptyLines: true });
  return (result.data as Record<string,string>[]).map(r => {
    const afBij = r['Af/Bij'] || '';
    const bedrag = parseFloat((r['Bedrag (EUR)'] || '0').replace('.','').replace(',','.'));
    return {
      datum: r['Datum'] || '',
      omschrijving: r['Mededelingen'] || '',
      tegenpartij: r['Naam / Omschrijving'] || '',
      bedrag: afBij === 'Bij' ? bedrag : -bedrag,
      saldo: 0,
      tegenrekIBAN: r['Tegenrekening IBAN'] || '',
      bron: 'ING',
    };
  });
}
