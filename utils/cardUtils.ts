
import { BankOffer } from '../types';

// Simplified BIN Database for Detection
// In a real app, this would be an API call or a massive library
export const detectCardInfo = (number: string) => {
  const cleanNum = number.replace(/\D/g, '');
  const bin = cleanNum.slice(0, 6);

  let network = 'Unknown';
  if (/^4/.test(bin)) network = 'Visa';
  else if (/^5[1-5]/.test(bin)) network = 'Mastercard';
  else if (/^3[47]/.test(bin)) network = 'Amex';
  else if (/^60|^6521|^6522/.test(bin)) network = 'Rupay';
  else if (/^35/.test(bin)) network = 'JCB';
  else if (/^62/.test(bin)) network = 'UnionPay';

  let bankName = 'Unknown Bank';
  
  // -- INDIA --
  if (/^4545|^4375|^4162|^5222|^6075/.test(bin)) bankName = 'HDFC Bank';
  else if (/^5044|^5046|^4591|^5497/.test(bin)) bankName = 'SBI';
  else if (/^4477|^4375|^5399|^4055/.test(bin)) bankName = 'ICICI Bank';
  else if (/^4426|^4147|^5309|^5241/.test(bin)) bankName = 'Axis Bank';
  else if (/^4166|^4214|^5188/.test(bin)) bankName = 'Kotak Bank';
  else if (/^4363|^5196/.test(bin)) bankName = 'Standard Chartered';

  // -- USA / INTERNATIONAL --
  else if (/^4147|^4246|^4388|^4485|^4716/.test(bin)) bankName = 'Chase'; // Chase
  else if (/^4008|^4128|^4860|^5181|^5424/.test(bin)) bankName = 'Citi'; // Citi
  else if (/^4024|^4266|^4400|^4556|^5466/.test(bin)) bankName = 'Bank of America'; // BOA
  else if (/^37|^34/.test(bin)) bankName = 'American Express'; // Amex (Global)
  else if (/^4312|^4347|^4883|^5301/.test(bin)) bankName = 'HSBC'; // HSBC
  else if (/^4929|^4263|^5404/.test(bin)) bankName = 'Barclays'; // Barclays
  else if (/^4060|^4136|^4306|^4696|^5135/.test(bin)) bankName = 'Wells Fargo'; // Wells Fargo
  else if (/^4264|^4265|^4428/.test(bin)) bankName = 'Capital One'; // Capital One

  return { bankName, network };
};

export const getCardColors = (bankName: string) => {
  const name = bankName.toLowerCase();
  
  if (name.includes('hdfc')) return { start: '#004c8f', end: '#002d54' };
  if (name.includes('sbi')) return { start: '#280071', end: '#07b3e6' };
  if (name.includes('icici')) return { start: '#f37e21', end: '#a62e00' };
  if (name.includes('axis')) return { start: '#97144d', end: '#5a0b2e' };
  if (name.includes('kotak')) return { start: '#ed1b24', end: '#990d13' };
  if (name.includes('chase')) return { start: '#117aca', end: '#093c66' };
  if (name.includes('citi')) return { start: '#003b70', end: '#00599a' };
  if (name.includes('america') || name.includes('boa')) return { start: '#e31837', end: '#680012' };
  if (name.includes('amex') || name.includes('american')) return { start: '#267ac3', end: '#164875' };
  if (name.includes('hsbc')) return { start: '#db0011', end: '#8a000b' };
  if (name.includes('barclays')) return { start: '#00aeef', end: '#005582' };
  if (name.includes('wells')) return { start: '#d71e28', end: '#761016' };
  if (name.includes('capital')) return { start: '#003a6f', end: '#d03027' };
  if (name.includes('standard') || name.includes('chartered')) return { start: '#0075bf', end: '#069c41' };
  
  // Generic Fallbacks
  return { start: '#475569', end: '#1e293b' };
};

// Kept as a fallback or for development
export const MOCK_OFFERS: BankOffer[] = [
  {
    id: '1',
    bank: 'HDFC Bank',
    platform: 'Amazon',
    title: '10% Instant Discount',
    description: 'Get 10% instant discount up to ₹1500 on HDFC Credit Cards.',
    category: 'Shopping'
  }
];
