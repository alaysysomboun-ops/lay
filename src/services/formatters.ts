import { Currency, Language } from '../types';

export const formatCurrency = (
  amount: number,
  currency: Currency = 'THB',
  exchangeRates: { THB: number; LAK: number; VND: number } = { THB: 1, LAK: 680, VND: 720 }
): string => {
  if (isNaN(amount)) return '0.00';

  // If calculating in non-THB currency using rate
  const rate = exchangeRates[currency] || 1;
  const converted = currency === 'THB' ? amount : amount * rate;

  switch (currency) {
    case 'THB':
      return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(converted);
    case 'LAK':
      return new Intl.NumberFormat('lo-LA', {
        style: 'currency',
        currency: 'LAK',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(converted).replace('LAK', '₭');
    case 'VND':
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(converted);
    default:
      return `${amount.toFixed(2)}`;
  }
};

export const formatNumber = (num: number, decimals: number = 0): string => {
  if (isNaN(num)) return '0';
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

export const formatDateTime = (dateStr: string | Date, lang: Language = 'th'): string => {
  if (!dateStr) return '';
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  
  const locale = lang === 'th' ? 'th-TH' : lang === 'vi' ? 'vi-VN' : lang === 'lo' ? 'lo-LA' : 'en-US';
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const formatDateOnly = (dateStr: string | Date, lang: Language = 'th'): string => {
  if (!dateStr) return '';
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  const locale = lang === 'th' ? 'th-TH' : lang === 'vi' ? 'vi-VN' : lang === 'lo' ? 'lo-LA' : 'en-US';
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};
