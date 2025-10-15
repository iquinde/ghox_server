export function generateUserId() {
  // Genera un número aleatorio de 9 dígitos
  return Math.floor(100000000 + Math.random() * 900000000).toString();
}
