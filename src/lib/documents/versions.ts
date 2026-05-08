export function selectLatestVersion<T extends { versionNumber: number; isLatest: boolean }>(versions: T[]) {
  return [...versions].sort((a, b) => Number(b.isLatest) - Number(a.isLatest) || b.versionNumber - a.versionNumber)[0] ?? null;
}
