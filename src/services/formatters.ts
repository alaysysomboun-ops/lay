import { Currency, Language } from '../types';

export const formatCurrency = (
  amount: number,
  currency: Currency = 'LAK',
  exchangeRates: { THB: number; LAK: number; VND: number } = { THB: 0.00147, LAK: 1, VND: 1.15 }
): string => {
  if (isNaN(amount)) return '0 ₭';

  switch (currency) {
    case 'LAK':
      return `${new Intl.NumberFormat('lo-LA', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(Math.round(amount))} ₭`;
    case 'THB':
      return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    case 'VND':
      return `${new Intl.NumberFormat('vi-VN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(Math.round(amount))} ₫`;
    default:
      return `${amount.toFixed(0)} ₭`;
  }
};

export const formatNumber = (num: number, decimals: number = 0): string => {
  if (isNaN(num)) return '0';
  return new Intl.NumberFormat('lo-LA', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

export const formatDateTime = (dateStr: string | Date, lang: Language = 'lo'): string => {
  if (!dateStr) return '';
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  
  const locale = lang === 'lo' ? 'lo-LA' : lang === 'th' ? 'th-TH' : lang === 'vi' ? 'vi-VN' : 'en-US';
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const formatDateOnly = (dateStr: string | Date, lang: Language = 'lo'): string => {
  if (!dateStr) return '';
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  const locale = lang === 'lo' ? 'lo-LA' : lang === 'th' ? 'th-TH' : lang === 'vi' ? 'vi-VN' : 'en-US';
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};
