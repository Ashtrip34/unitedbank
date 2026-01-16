// Mock bank data with routing numbers and logos
export interface BankInfo {
  name: string;
  routing: string;
  logo: string;
  domain: string;
}

export const BANK_DATA: Record<string, BankInfo> = {
  '021000021': { name: 'Chase Bank', routing: '021000021', logo: 'https://logo.clearbit.com/chase.com', domain: 'chase.com' },
  '026009593': { name: 'Bank of America', routing: '026009593', logo: 'https://logo.clearbit.com/bankofamerica.com', domain: 'bankofamerica.com' },
  '121000248': { name: 'Wells Fargo', routing: '121000248', logo: 'https://logo.clearbit.com/wellsfargo.com', domain: 'wellsfargo.com' },
  '021000089': { name: 'Citibank', routing: '021000089', logo: 'https://logo.clearbit.com/citi.com', domain: 'citi.com' },
  '122105155': { name: 'US Bank', routing: '122105155', logo: 'https://logo.clearbit.com/usbank.com', domain: 'usbank.com' },
  '021000018': { name: 'Capital One', routing: '021000018', logo: 'https://logo.clearbit.com/capitalone.com', domain: 'capitalone.com' },
  '074000010': { name: 'PNC Bank', routing: '074000010', logo: 'https://logo.clearbit.com/pnc.com', domain: 'pnc.com' },
  '071000013': { name: 'TD Bank', routing: '071000013', logo: 'https://logo.clearbit.com/td.com', domain: 'td.com' },
  '053000196': { name: 'Truist Bank', routing: '053000196', logo: 'https://logo.clearbit.com/truist.com', domain: 'truist.com' },
  '091000019': { name: 'Ally Bank', routing: '091000019', logo: 'https://logo.clearbit.com/ally.com', domain: 'ally.com' },
};

export const getBankByRouting = (routing: string): BankInfo | null => {
  return BANK_DATA[routing] || null;
};

export const getAllBanks = (): BankInfo[] => {
  return Object.values(BANK_DATA);
};

// Expense categories with keywords for auto-categorization
export const EXPENSE_CATEGORIES = [
  { id: 'utilities', label: 'Network/Utilities', keywords: ['electric', 'gas', 'water', 'internet', 'phone', 'utility', 'power', 'energy'] },
  { id: 'car', label: 'Car Payment', keywords: ['car', 'auto', 'vehicle', 'loan', 'honda', 'toyota', 'ford', 'insurance'] },
  { id: 'housing', label: 'House/Rent', keywords: ['rent', 'mortgage', 'house', 'apartment', 'lease', 'property', 'home'] },
  { id: 'groceries', label: 'Groceries', keywords: ['grocery', 'food', 'walmart', 'target', 'costco', 'safeway', 'whole foods'] },
  { id: 'entertainment', label: 'Entertainment', keywords: ['netflix', 'spotify', 'movie', 'game', 'music', 'streaming', 'subscription'] },
  { id: 'dining', label: 'Dining', keywords: ['restaurant', 'cafe', 'coffee', 'food', 'doordash', 'uber eats', 'grubhub'] },
  { id: 'shopping', label: 'Shopping', keywords: ['amazon', 'store', 'shop', 'purchase', 'buy', 'mall'] },
  { id: 'transfer', label: 'Transfer', keywords: ['transfer', 'sent', 'payment'] },
  { id: 'income', label: 'Income', keywords: ['salary', 'paycheck', 'deposit', 'income', 'refund'] },
  { id: 'other', label: 'Other', keywords: [] },
];

export const categorizeTransaction = (description: string): string => {
  const lowerDesc = description.toLowerCase();
  
  for (const category of EXPENSE_CATEGORIES) {
    if (category.keywords.some(keyword => lowerDesc.includes(keyword))) {
      return category.id;
    }
  }
  
  return 'other';
};

export const getCategoryLabel = (categoryId: string): string => {
  const category = EXPENSE_CATEGORIES.find(c => c.id === categoryId);
  return category?.label || 'Other';
};

export const getCategoryColor = (categoryId: string): string => {
  const colors: Record<string, string> = {
    utilities: 'hsl(var(--chart-1))',
    car: 'hsl(var(--chart-2))',
    housing: 'hsl(var(--chart-3))',
    groceries: 'hsl(var(--chart-4))',
    entertainment: 'hsl(var(--chart-5))',
    dining: 'hsl(var(--accent))',
    shopping: 'hsl(var(--primary))',
    transfer: 'hsl(var(--destructive))',
    income: 'hsl(var(--success))',
    other: 'hsl(var(--muted-foreground))',
  };
  return colors[categoryId] || colors.other;
};
