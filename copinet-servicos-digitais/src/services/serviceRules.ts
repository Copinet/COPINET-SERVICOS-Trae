import type { ServiceFlow } from '../data/serviceDirectory';

export function applySozinhoDiscount(price: number, flow: ServiceFlow) {
  if (flow !== 'sozinho') return price;
  return Math.floor(price * 0.8 * 100) / 100;
}

export function isPdfExpired(createdAt: Date, now = new Date()) {
  const diff = now.getTime() - createdAt.getTime();
  return diff > 3 * 24 * 60 * 60 * 1000;
}

export function resolvePartnerFlow(hasPrinter: boolean) {
  return hasPrinter ? 'emissor_e_impressor' : 'emissor_mais_impressor';
}
