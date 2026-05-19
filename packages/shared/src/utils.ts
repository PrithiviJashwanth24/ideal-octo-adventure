import { FORMALITY_SCALE } from './constants';

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export function computeCostPerWear(price: number, wearCount: number): number {
  if (wearCount === 0) return price;
  return Math.round((price / wearCount) * 100) / 100;
}

export function computeWardrobeUtilization(items: Array<{ wearCount: number }>): number {
  const used = items.filter((i) => i.wearCount > 0).length;
  return items.length > 0 ? used / items.length : 0;
}

export function getFormalityDistance(a: string, b: string): number {
  return Math.abs((FORMALITY_SCALE[a] || 3) - (FORMALITY_SCALE[b] || 3));
}

export function scoreFormalityMatch(outfitFormalities: string[], targetFormality: string): number {
  if (outfitFormalities.length === 0) return 0.5;
  const distances = outfitFormalities.map((f) => getFormalityDistance(f, targetFormality));
  const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
  return Math.max(0, 1 - avgDistance / 3);
}

export function generateOutfitName(archetype: string, occasion: string): string {
  const archetypeLabels: Record<string, string> = {
    safe: 'The Reliable',
    statement: 'The Statement',
    stealthLuxury: 'Stealth Luxury',
    dateNight: 'Date Night',
    boardroom: 'The Boardroom',
  };
  return `${archetypeLabels[archetype] || archetype} — ${occasion}`;
}

export function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? str.slice(0, maxLen - 3) + '...' : str;
}

export function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function normalizeScore(value: number, min = 0, max = 10): number {
  return clamp((value - min) / (max - min), 0, 1);
}
