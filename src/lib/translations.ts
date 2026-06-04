export type Lang = 'nl' | 'en' | 'hy' | 'ar';

const translations = {
  nl: {
    nav: {
      overview: 'Overzicht', transactions: 'Transacties',
      accounts: 'Rekeningen', budget: 'Begroting',
      debts: 'Schulden', goals: 'Doelen',
      business: 'Zakelijk', annual: 'Jaaroverzicht',
      prices: 'Prijsradar', location: 'Locatie',
      settings: 'Instellingen', logout: 'Uitloggen',
    },
    dashboard: {
      greeting_morning: 'Goedemorgen', greeting_afternoon: 'Goedemiddag', greeting_evening: 'Goedenavond',
      subtitle: 'Hier is je financieel overzicht van vandaag',
      total_balance: 'Totaal Saldo', income: 'Inkomsten', expenses: 'Uitgaven', net: 'Netto',
      month_income: 'Inkomsten (maand)', month_expenses: 'Uitgaven (maand)', month_net: 'Netto (maand)',
      recent_transactions: 'Recente transacties', view_all: 'Alles bekijken',
      no_transactions: 'Nog geen transacties', add_first: 'Voeg je eerste transactie toe',
      my_accounts: 'Mijn rekeningen', add_account: 'Toevoegen',
      budgets: 'Budgetten', manage: 'Beheren',
      debts: 'Schulden', all_debts: 'Alle schulden',
      goals: 'Doelen', all_goals: 'Alle doelen',
      all_accounts: 'Alle rekeningen',
      no_accounts: 'Geen rekeningen', no_budgets: 'Geen budgetten', no_goals: 'Geen doelen',
    },
    transactions: {
      title: 'Transacties', subtitle: 'Beheer al je inkomsten en uitgaven',
      add: '+ Transactie', import: 'CSV Import',
      search: 'Zoek transactie...', filter_type: 'Type', filter_cat: 'Categorie', filter_date: 'Datum',
      income: 'Inkomst', expense: 'Uitgave', all: 'Alle',
      no_results: 'Geen transacties gevonden',
    },
    accounts: {
      title: 'Rekeningen', subtitle: 'Beheer je bankrekeningen',
      add: '+ Rekening toevoegen', no_accounts: 'Nog geen rekeningen toegevoegd',
      balance: 'Saldo', account_nr: 'Rekeningnummer',
    },
    budget: {
      title: 'Begroting', subtitle: 'Beheer je maandelijkse budgetten',
      add: '+ Categorie', spent: 'Besteed', limit: 'Limiet', left: 'Over',
      no_budgets: 'Nog geen budgetten ingesteld',
    },
    debts: {
      title: 'Schulden', subtitle: 'Overzicht van je schulden en aflossingen',
      total: 'Totaal schulden', monthly: 'Maandtermijnen', active: 'Actieve regelingen',
      original: 'Origineel', paid: 'Afgelost', remaining: 'Resterend',
      add: '+ Schuld toevoegen',
    },
    goals: {
      title: 'Doelen', subtitle: 'Bouw aan je financiële toekomst',
      add: '+ Nieuw doel', progress: 'Voortgang',
      no_goals: 'Nog geen doelen aangemaakt',
    },
    business: {
      title: 'Zakelijk', subtitle: 'Zakelijk financieel overzicht',
      revenue: 'Omzet', vat: 'BTW', profit: 'Netto winst', costs: 'Kosten',
      clients: 'Opdrachtgevers',
    },
    annual: {
      title: 'Jaaroverzicht', subtitle: 'Financieel overzicht per jaar',
      month: 'Maand', income: 'Inkomsten', expenses: 'Uitgaven', net: 'Netto',
    },
    prices: {
      title: 'Prijsradar', subtitle: 'Vergelijk prijzen en bespaar',
      search_placeholder: 'Zoek product of dienst...', search_btn: 'Zoeken',
      trackers: 'Actieve trackers',
    },
    location: {
      title: 'Locatie', subtitle: 'Vind winkels en diensten in de buurt',
      allow: 'Locatie toestaan', nearby: 'In de buurt',
    },
    settings: {
      title: 'Instellingen', subtitle: 'Beheer je account en voorkeuren',
      profile: 'Profiel', language: 'Taal', ai: 'Claude AI', supabase: 'Supabase', rules: 'Categorieregels',
      save: 'Opslaan', saved: 'Opgeslagen!',
      first_name: 'Voornaam', last_name: 'Achternaam', email: 'E-mailadres',
      choose_lang: 'Kies je taal',
      api_key: 'Claude API Key',
      api_key_ph: 'sk-ant-...',
      api_help: 'Haal je API key op via console.anthropic.com',
    },
    common: {
      loading: 'Laden...', error: 'Fout', save: 'Opslaan',
      cancel: 'Annuleren', delete: 'Verwijderen', edit: 'Bewerken',
      add: 'Toevoegen', close: 'Sluiten', confirm: 'Bevestigen',
      per_month: 'per maand', of: 'van',
    },
  },

  en: {
    nav: {
      overview: 'Overview', transactions: 'Transactions',
      accounts: 'Accounts', budget: 'Budget',
      debts: 'Debts', goals: 'Goals',
      business: 'Business', annual: 'Annual',
      prices: 'Price Radar', location: 'Location',
      settings: 'Settings', logout: 'Log out',
    },
    dashboard: {
      greeting_morning: 'Good morning', greeting_afternoon: 'Good afternoon', greeting_evening: 'Good evening',
      subtitle: "Here's your financial overview for today",
      total_balance: 'Total Balance', income: 'Income', expenses: 'Expenses', net: 'Net',
      month_income: 'Income (month)', month_expenses: 'Expenses (month)', month_net: 'Net (month)',
      recent_transactions: 'Recent transactions', view_all: 'View all',
      no_transactions: 'No transactions yet', add_first: 'Add your first transaction',
      my_accounts: 'My accounts', add_account: 'Add',
      budgets: 'Budgets', manage: 'Manage',
      debts: 'Debts', all_debts: 'All debts',
      goals: 'Goals', all_goals: 'All goals',
      all_accounts: 'All accounts',
      no_accounts: 'No accounts', no_budgets: 'No budgets', no_goals: 'No goals',
    },
    transactions: {
      title: 'Transactions', subtitle: 'Manage all your income and expenses',
      add: '+ Transaction', import: 'CSV Import',
      search: 'Search transaction...', filter_type: 'Type', filter_cat: 'Category', filter_date: 'Date',
      income: 'Income', expense: 'Expense', all: 'All',
      no_results: 'No transactions found',
    },
    accounts: {
      title: 'Accounts', subtitle: 'Manage your bank accounts',
      add: '+ Add account', no_accounts: 'No accounts added yet',
      balance: 'Balance', account_nr: 'Account number',
    },
    budget: {
      title: 'Budget', subtitle: 'Manage your monthly budgets',
      add: '+ Category', spent: 'Spent', limit: 'Limit', left: 'Left',
      no_budgets: 'No budgets set yet',
    },
    debts: {
      title: 'Debts', subtitle: 'Overview of your debts and repayments',
      total: 'Total debts', monthly: 'Monthly payments', active: 'Active plans',
      original: 'Original', paid: 'Paid', remaining: 'Remaining',
      add: '+ Add debt',
    },
    goals: {
      title: 'Goals', subtitle: 'Build your financial future',
      add: '+ New goal', progress: 'Progress',
      no_goals: 'No goals created yet',
    },
    business: {
      title: 'Business', subtitle: 'Business financial overview',
      revenue: 'Revenue', vat: 'VAT', profit: 'Net profit', costs: 'Costs',
      clients: 'Clients',
    },
    annual: {
      title: 'Annual Overview', subtitle: 'Financial overview per year',
      month: 'Month', income: 'Income', expenses: 'Expenses', net: 'Net',
    },
    prices: {
      title: 'Price Radar', subtitle: 'Compare prices and save',
      search_placeholder: 'Search product or service...', search_btn: 'Search',
      trackers: 'Active trackers',
    },
    location: {
      title: 'Location', subtitle: 'Find stores and services nearby',
      allow: 'Allow location', nearby: 'Nearby',
    },
    settings: {
      title: 'Settings', subtitle: 'Manage your account and preferences',
      profile: 'Profile', language: 'Language', ai: 'Claude AI', supabase: 'Supabase', rules: 'Category rules',
      save: 'Save', saved: 'Saved!',
      first_name: 'First name', last_name: 'Last name', email: 'Email address',
      choose_lang: 'Choose your language',
      api_key: 'Claude API Key', api_key_ph: 'sk-ant-...',
      api_help: 'Get your API key at console.anthropic.com',
    },
    common: {
      loading: 'Loading...', error: 'Error', save: 'Save',
      cancel: 'Cancel', delete: 'Delete', edit: 'Edit',
      add: 'Add', close: 'Close', confirm: 'Confirm',
      per_month: 'per month', of: 'of',
    },
  },

  hy: {
    nav: {
      overview: 'Ակնարկ', transactions: 'Գործարքներ',
      accounts: 'Հաշիվներ', budget: 'Բյուջե',
      debts: 'Պարտքեր', goals: 'Նպատակներ',
      business: 'Բիզնես', annual: 'Տարեկան',
      prices: 'Գներ', location: 'Տեղ',
      settings: 'Կարգավորումներ', logout: 'Ելք',
    },
    dashboard: {
      greeting_morning: 'Բարի լույս', greeting_afternoon: 'Բարի օր', greeting_evening: 'Բարի երեկո',
      subtitle: 'Ահա ձեր ֆինանսական ակնարկը',
      total_balance: 'Ընդհանուր մնացորդ', income: 'Եկամուտ', expenses: 'Ծախսեր', net: 'Զուտ',
      month_income: 'Եկամուտ (ամիս)', month_expenses: 'Ծախսեր (ամիս)', month_net: 'Զուտ (ամիս)',
      recent_transactions: 'Վերջին գործարքներ', view_all: 'Բոլորը',
      no_transactions: 'Գործարք չկա', add_first: 'Ավելացրեք առաջին գործարքը',
      my_accounts: 'Իմ հաշիվները', add_account: 'Ավելացնել',
      budgets: 'Բյուջե', manage: 'Կառավարել',
      debts: 'Պարտքեր', all_debts: 'Բոլոր պարտքերը',
      goals: 'Նպատակներ', all_goals: 'Բոլոր նպատակները',
      all_accounts: 'Բոլոր հաշիվները',
      no_accounts: 'Հաշիվ չկա', no_budgets: 'Բյուջե չկա', no_goals: 'Նպատակ չկա',
    },
    transactions: {
      title: 'Գործարքներ', subtitle: 'Կառավարեք ձեր գործարքները',
      add: '+ Գործարք', import: 'CSV',
      search: 'Փնտրել...', filter_type: 'Տեսակ', filter_cat: 'Կատեգ.', filter_date: 'Ամսաթիվ',
      income: 'Եկամուտ', expense: 'Ծախս', all: 'Բոլոր',
      no_results: 'Արդյունք չկա',
    },
    accounts: {
      title: 'Հաշիվներ', subtitle: 'Կառավարեք ձեր բանկային հաշիվները',
      add: '+ Հաշիվ ավելացնել', no_accounts: 'Հաշիվ չկա',
      balance: 'Մնացորդ', account_nr: 'Հաշվի համar',
    },
    budget: {
      title: 'Բյուջե', subtitle: 'Կառ. ամսեկան բյուջեն',
      add: '+ Կատ.', spent: 'Ծախս', limit: 'Սահ.', left: 'Մնաց.',
      no_budgets: 'Բյուջե չկա',
    },
    debts: {
      title: 'Պարտքեր', subtitle: 'Ձեր պարտքերի ակնարկ',
      total: 'Ընդ. պարտք', monthly: 'Ամս. վճ.', active: 'Ակտ. ծրագ.',
      original: 'Բնօ.', paid: 'Վճ.', remaining: 'Մնաց.',
      add: '+ Պարտք',
    },
    goals: {
      title: 'Նպատակներ', subtitle: 'Կառ. ֆ. ապ.',
      add: '+ Նպ.', progress: 'Ընթ.',
      no_goals: 'Նպատակ չկա',
    },
    business: {
      title: 'Բիզնես', subtitle: 'Բիզնեսի ֆինանսական ակնարկ',
      revenue: 'Եկ.', vat: 'ԱԱՀ', profit: 'Շ. ե.', costs: 'Ծախ.',
      clients: 'Հ.',
    },
    annual: {
      title: 'Տարեկան', subtitle: 'Տ. ֆ. ակ.',
      month: 'Ամիս', income: 'Եկ.', expenses: 'Ծախ.', net: 'Զուտ',
    },
    prices: {
      title: 'Գներ', subtitle: 'Համ. գ.',
      search_placeholder: 'Փն. ապ....', search_btn: 'Փնտ.',
      trackers: 'Ակ. հ.',
    },
    location: {
      title: 'Տեղ', subtitle: 'Գ. խ.',
      allow: 'Թ. տ.', nearby: 'Մ.',
    },
    settings: {
      title: 'Կարգ.', subtitle: 'Կ. ձ. հ.',
      profile: 'Պ.', language: 'Լ.', ai: 'AI', supabase: 'DB', rules: 'Կ.',
      save: 'Պահ.', saved: 'Պ!',
      first_name: 'Ա.', last_name: 'Ազ.', email: 'Ե.',
      choose_lang: 'Ե. լ.',
      api_key: 'API Key', api_key_ph: 'sk-ant-...',
      api_help: 'console.anthropic.com',
    },
    common: {
      loading: 'Բ...', error: 'Ս.', save: 'Պ.',
      cancel: 'Ե.', delete: 'Ջ.', edit: 'Խ.',
      add: 'Ավ.', close: 'Փ.', confirm: 'Հ.',
      per_month: 'ամ.', of: '-ից',
    },
  },

  ar: {
    nav: {
      overview: 'نظرة عامة', transactions: 'المعاملات',
      accounts: 'الحسابات', budget: 'الميزانية',
      debts: 'الديون', goals: 'الأهداف',
      business: 'الأعمال', annual: 'سنوي',
      prices: 'مراقبة الأسعار', location: 'الموقع',
      settings: 'الإعدادات', logout: 'تسجيل الخروج',
    },
    dashboard: {
      greeting_morning: 'صباح الخير', greeting_afternoon: 'مساء الخير', greeting_evening: 'مساء الخير',
      subtitle: 'إليك ملخصك المالي لليوم',
      total_balance: 'الرصيد الكلي', income: 'الدخل', expenses: 'المصروفات', net: 'صافي',
      month_income: 'الدخل (شهر)', month_expenses: 'المصروفات (شهر)', month_net: 'الصافي (شهر)',
      recent_transactions: 'المعاملات الأخيرة', view_all: 'عرض الكل',
      no_transactions: 'لا توجد معاملات', add_first: 'أضف معاملتك الأولى',
      my_accounts: 'حساباتي', add_account: 'إضافة',
      budgets: 'الميزانيات', manage: 'إدارة',
      debts: 'الديون', all_debts: 'كل الديون',
      goals: 'الأهداف', all_goals: 'كل الأهداف',
      all_accounts: 'كل الحسابات',
      no_accounts: 'لا توجد حسابات', no_budgets: 'لا توجد ميزانيات', no_goals: 'لا توجد أهداف',
    },
    transactions: {
      title: 'المعاملات', subtitle: 'إدارة دخلك ومصروفاتك',
      add: '+ معاملة', import: 'CSV',
      search: 'بحث...', filter_type: 'النوع', filter_cat: 'الفئة', filter_date: 'التاريخ',
      income: 'دخل', expense: 'مصروف', all: 'الكل',
      no_results: 'لا نتائج',
    },
    accounts: {
      title: 'الحسابات', subtitle: 'إدارة حساباتك البنكية',
      add: '+ إضافة حساب', no_accounts: 'لا توجد حسابات',
      balance: 'الرصيد', account_nr: 'رقم الحساب',
    },
    budget: {
      title: 'الميزانية', subtitle: 'إدارة ميزانياتك الشهرية',
      add: '+ فئة', spent: 'مُنفق', limit: 'الحد', left: 'متبقي',
      no_budgets: 'لا توجد ميزانيات',
    },
    debts: {
      title: 'الديون', subtitle: 'نظرة عامة على ديونك',
      total: 'إجمالي الديون', monthly: 'الدفعات الشهرية', active: 'الخطط النشطة',
      original: 'الأصلي', paid: 'مدفوع', remaining: 'متبقي',
      add: '+ دين',
    },
    goals: {
      title: 'الأهداف', subtitle: 'ابنِ مستقبلك المالي',
      add: '+ هدف جديد', progress: 'التقدم',
      no_goals: 'لا توجد أهداف',
    },
    business: {
      title: 'الأعمال', subtitle: 'النظرة المالية للأعمال',
      revenue: 'الإيرادات', vat: 'ضريبة', profit: 'صافي الربح', costs: 'التكاليف',
      clients: 'العملاء',
    },
    annual: {
      title: 'سنوي', subtitle: 'النظرة المالية السنوية',
      month: 'شهر', income: 'دخل', expenses: 'مصروفات', net: 'صافي',
    },
    prices: {
      title: 'مراقبة الأسعار', subtitle: 'قارن الأسعار ووفر',
      search_placeholder: 'ابحث...', search_btn: 'بحث',
      trackers: 'متتبعون نشطون',
    },
    location: {
      title: 'الموقع', subtitle: 'ابحث عن متاجر قريبة',
      allow: 'السماح بالموقع', nearby: 'قريب',
    },
    settings: {
      title: 'الإعدادات', subtitle: 'إدارة حسابك وتفضيلاتك',
      profile: 'الملف الشخصي', language: 'اللغة', ai: 'Claude AI', supabase: 'قاعدة البيانات', rules: 'قواعد الفئات',
      save: 'حفظ', saved: 'تم الحفظ!',
      first_name: 'الاسم', last_name: 'اللقب', email: 'البريد الإلكتروني',
      choose_lang: 'اختر لغتك',
      api_key: 'مفتاح API', api_key_ph: 'sk-ant-...',
      api_help: 'احصل على مفتاحك من console.anthropic.com',
    },
    common: {
      loading: 'تحميل...', error: 'خطأ', save: 'حفظ',
      cancel: 'إلغاء', delete: 'حذف', edit: 'تعديل',
      add: 'إضافة', close: 'إغلاق', confirm: 'تأكيد',
      per_month: 'شهريًا', of: 'من',
    },
  },
};

export type Translations = typeof translations.nl;

export function getTranslations(lang: Lang): Translations {
  return translations[lang] ?? translations.nl;
}

export function getGreeting(lang: Lang, hour: number): string {
  const t = getTranslations(lang);
  if (hour < 12) return t.dashboard.greeting_morning;
  if (hour < 18) return t.dashboard.greeting_afternoon;
  return t.dashboard.greeting_evening;
}

export const LANG_LABELS: Record<Lang, { flag: string; label: string; dir: 'ltr' | 'rtl' }> = {
  nl: { flag: '🇳🇱', label: 'Nederlands',  dir: 'ltr' },
  en: { flag: '🇬🇧', label: 'English',      dir: 'ltr' },
  hy: { flag: '🇦🇲', label: 'Հայերեն',     dir: 'ltr' },
  ar: { flag: '🇸🇦', label: 'العربية',      dir: 'rtl' },
};
