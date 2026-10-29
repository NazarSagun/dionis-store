// Short platform names for a card, such as "PC (Windows), PS5" to ["PC", "PS5"].
const SHORT_NAMES: Record<string, string> = {
  'PC (Windows)': 'PC',
  'Xbox Series X': 'Xbox',
  'Nintendo Switch': 'Switch',
  'Web Browser': 'Web',
}

export const platformLabels = (platform: string) =>
  platform
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => SHORT_NAMES[name] ?? name)
