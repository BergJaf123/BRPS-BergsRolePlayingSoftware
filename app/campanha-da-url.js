export function lerIdCampanha(busca) {
  const id = new URLSearchParams(busca).get("campanha");
  return /^\d{1,15}$/.test(id ?? "") ? id : "";
}
