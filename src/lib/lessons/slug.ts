export function createSlug(value: string) {
  const slug = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120)
    .replace(/^-+|-+$/g, "");

  return slug || "scenario";
}

export async function nextAvailableSlug(
  title: string,
  exists: (candidate: string) => Promise<boolean>
) {
  const base = createSlug(title);
  let candidate = base;
  let index = 2;

  while (await exists(candidate)) {
    candidate = `${base}-${index}`;
    index += 1;
  }

  return candidate;
}
