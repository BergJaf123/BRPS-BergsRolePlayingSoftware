import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

export function gerarHash(codigo) {
  const salt = randomBytes(16).toString("hex");
  const h = scryptSync(codigo, salt, 32).toString("hex");
  return `${salt}:${h}`;
}

export function conferir(codigo, guardado) {
  const [salt, h] = String(guardado).split(":");
  if (!salt || !h) return false;
  const tentativa = scryptSync(String(codigo), salt, 32);
  const original = Buffer.from(h, "hex");
  return tentativa.length === original.length && timingSafeEqual(tentativa, original);
}
