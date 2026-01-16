export interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  country: string;
}

export const WORLD_CURRENCIES: Currency[] = [
  // Americas
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', country: 'United States' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦', country: 'Canada' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', flag: '🇲🇽', country: 'Mexico' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷', country: 'Brazil' },
  { code: 'ARS', name: 'Argentine Peso', symbol: '$', flag: '🇦🇷', country: 'Argentina' },
  { code: 'CLP', name: 'Chilean Peso', symbol: '$', flag: '🇨🇱', country: 'Chile' },
  { code: 'COP', name: 'Colombian Peso', symbol: '$', flag: '🇨🇴', country: 'Colombia' },
  { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/', flag: '🇵🇪', country: 'Peru' },
  { code: 'UYU', name: 'Uruguayan Peso', symbol: '$U', flag: '🇺🇾', country: 'Uruguay' },
  { code: 'VES', name: 'Venezuelan Bolivar', symbol: 'Bs', flag: '🇻🇪', country: 'Venezuela' },
  { code: 'GTQ', name: 'Guatemalan Quetzal', symbol: 'Q', flag: '🇬🇹', country: 'Guatemala' },
  { code: 'CRC', name: 'Costa Rican Colon', symbol: '₡', flag: '🇨🇷', country: 'Costa Rica' },
  { code: 'PAB', name: 'Panamanian Balboa', symbol: 'B/.', flag: '🇵🇦', country: 'Panama' },
  { code: 'DOP', name: 'Dominican Peso', symbol: 'RD$', flag: '🇩🇴', country: 'Dominican Republic' },
  { code: 'JMD', name: 'Jamaican Dollar', symbol: 'J$', flag: '🇯🇲', country: 'Jamaica' },
  { code: 'TTD', name: 'Trinidad Dollar', symbol: 'TT$', flag: '🇹🇹', country: 'Trinidad and Tobago' },
  { code: 'BSD', name: 'Bahamian Dollar', symbol: 'B$', flag: '🇧🇸', country: 'Bahamas' },
  { code: 'BBD', name: 'Barbados Dollar', symbol: 'Bds$', flag: '🇧🇧', country: 'Barbados' },

  // Europe
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', country: 'European Union' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', country: 'United Kingdom' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭', country: 'Switzerland' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪', country: 'Sweden' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', flag: '🇳🇴', country: 'Norway' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', flag: '🇩🇰', country: 'Denmark' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', flag: '🇵🇱', country: 'Poland' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', flag: '🇨🇿', country: 'Czech Republic' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', flag: '🇭🇺', country: 'Hungary' },
  { code: 'RON', name: 'Romanian Leu', symbol: 'lei', flag: '🇷🇴', country: 'Romania' },
  { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв', flag: '🇧🇬', country: 'Bulgaria' },
  { code: 'HRK', name: 'Croatian Kuna', symbol: 'kn', flag: '🇭🇷', country: 'Croatia' },
  { code: 'RSD', name: 'Serbian Dinar', symbol: 'дин.', flag: '🇷🇸', country: 'Serbia' },
  { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴', flag: '🇺🇦', country: 'Ukraine' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', flag: '🇷🇺', country: 'Russia' },
  { code: 'ISK', name: 'Icelandic Krona', symbol: 'kr', flag: '🇮🇸', country: 'Iceland' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', flag: '🇹🇷', country: 'Turkey' },

  // Asia
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵', country: 'Japan' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳', country: 'China' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰', country: 'Hong Kong' },
  { code: 'TWD', name: 'Taiwan Dollar', symbol: 'NT$', flag: '🇹🇼', country: 'Taiwan' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷', country: 'South Korea' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬', country: 'Singapore' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾', country: 'Malaysia' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭', country: 'Thailand' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', flag: '🇮🇩', country: 'Indonesia' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', flag: '🇵🇭', country: 'Philippines' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', flag: '🇻🇳', country: 'Vietnam' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳', country: 'India' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', flag: '🇵🇰', country: 'Pakistan' },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', flag: '🇧🇩', country: 'Bangladesh' },
  { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs', flag: '🇱🇰', country: 'Sri Lanka' },
  { code: 'NPR', name: 'Nepalese Rupee', symbol: 'रू', flag: '🇳🇵', country: 'Nepal' },
  { code: 'MMK', name: 'Myanmar Kyat', symbol: 'K', flag: '🇲🇲', country: 'Myanmar' },
  { code: 'KHR', name: 'Cambodian Riel', symbol: '៛', flag: '🇰🇭', country: 'Cambodia' },
  { code: 'LAK', name: 'Lao Kip', symbol: '₭', flag: '🇱🇦', country: 'Laos' },
  { code: 'KZT', name: 'Kazakhstani Tenge', symbol: '₸', flag: '🇰🇿', country: 'Kazakhstan' },
  { code: 'UZS', name: 'Uzbekistani Som', symbol: 'so\'m', flag: '🇺🇿', country: 'Uzbekistan' },

  // Middle East
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪', country: 'United Arab Emirates' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س', flag: '🇸🇦', country: 'Saudi Arabia' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'ر.ق', flag: '🇶🇦', country: 'Qatar' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك', flag: '🇰🇼', country: 'Kuwait' },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: '.د.ب', flag: '🇧🇭', country: 'Bahrain' },
  { code: 'OMR', name: 'Omani Rial', symbol: 'ر.ع.', flag: '🇴🇲', country: 'Oman' },
  { code: 'JOD', name: 'Jordanian Dinar', symbol: 'د.ا', flag: '🇯🇴', country: 'Jordan' },
  { code: 'LBP', name: 'Lebanese Pound', symbol: 'ل.ل', flag: '🇱🇧', country: 'Lebanon' },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '₪', flag: '🇮🇱', country: 'Israel' },
  { code: 'IQD', name: 'Iraqi Dinar', symbol: 'ع.د', flag: '🇮🇶', country: 'Iraq' },
  { code: 'IRR', name: 'Iranian Rial', symbol: '﷼', flag: '🇮🇷', country: 'Iran' },

  // Africa
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦', country: 'South Africa' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬', country: 'Nigeria' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵', flag: '🇬🇭', country: 'Ghana' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', flag: '🇰🇪', country: 'Kenya' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', flag: '🇪🇬', country: 'Egypt' },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'د.م.', flag: '🇲🇦', country: 'Morocco' },
  { code: 'TND', name: 'Tunisian Dinar', symbol: 'د.ت', flag: '🇹🇳', country: 'Tunisia' },
  { code: 'DZD', name: 'Algerian Dinar', symbol: 'د.ج', flag: '🇩🇿', country: 'Algeria' },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh', flag: '🇹🇿', country: 'Tanzania' },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', flag: '🇺🇬', country: 'Uganda' },
  { code: 'ZMW', name: 'Zambian Kwacha', symbol: 'ZK', flag: '🇿🇲', country: 'Zambia' },
  { code: 'BWP', name: 'Botswana Pula', symbol: 'P', flag: '🇧🇼', country: 'Botswana' },
  { code: 'MUR', name: 'Mauritian Rupee', symbol: '₨', flag: '🇲🇺', country: 'Mauritius' },
  { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br', flag: '🇪🇹', country: 'Ethiopia' },
  { code: 'XOF', name: 'West African CFA', symbol: 'CFA', flag: '🌍', country: 'West Africa' },
  { code: 'XAF', name: 'Central African CFA', symbol: 'FCFA', flag: '🌍', country: 'Central Africa' },

  // Oceania
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺', country: 'Australia' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿', country: 'New Zealand' },
  { code: 'FJD', name: 'Fiji Dollar', symbol: 'FJ$', flag: '🇫🇯', country: 'Fiji' },
  { code: 'PGK', name: 'Papua New Guinea Kina', symbol: 'K', flag: '🇵🇬', country: 'Papua New Guinea' },
];

export const getCurrencyByCode = (code: string): Currency | undefined => {
  return WORLD_CURRENCIES.find(c => c.code === code);
};

export const searchCurrencies = (query: string): Currency[] => {
  const lowercaseQuery = query.toLowerCase();
  return WORLD_CURRENCIES.filter(
    c => 
      c.code.toLowerCase().includes(lowercaseQuery) ||
      c.name.toLowerCase().includes(lowercaseQuery) ||
      c.country.toLowerCase().includes(lowercaseQuery)
  );
};
