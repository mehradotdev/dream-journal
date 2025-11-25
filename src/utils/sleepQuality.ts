export function getSleepQualityColor(quality: number): string {
  if (quality <= 2) return 'text-red-500';
  if (quality <= 3) return 'text-yellow-500';
  return 'text-green-500';
}

export function getSleepQualityText(quality: number): string {
  if (quality <= 2) return 'Poor';
  if (quality <= 4) return 'Fair';
  if (quality <= 6) return 'Good';
  if (quality <= 8) return 'Very Good';
  return 'Excellent';
}
