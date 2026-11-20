export function notesFor(event, enabled) {
  if (!enabled) return [];
  if (event === 'yes') return [523, 659];
  if (event === 'try') return [392];
  if (event === 'complete') return [523, 659, 784];
  return [];
}
