

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import sharp from "sharp";

/**
 * Compresse une image et retourne le buffer compressé.
 * @param file - Le fichier sous forme de Buffer ou ArrayBuffer.
 * @param compressRatio - Le ratio de compression (entre 0 et 1).
 * @returns Le buffer de l'image compressée ou null si ce n'est pas une image.
 */
export async function compressImage(
  file: Buffer | ArrayBuffer,
  compressRatio: number
): Promise<File | null> {
  // Convertir ArrayBuffer en Buffer si nécessaire
  const buffer = Buffer.isBuffer(file) ? file : Buffer.from(file);

  // Vérifier si le fichier est une image
  const isImage = await checkIfImage(buffer);
  if (!isImage) {
    return null; // Retourne null si ce n'est pas une image
  }

  // Valider le ratio de compression
  if (compressRatio < 0 || compressRatio > 1) {
    throw new Error("Le ratio de compression doit être entre 0 et 1.");
  }

  // Compresser l'image avec sharp
  const compressedImageBuffer = await sharp(buffer)
    .jpeg({ quality: Math.floor(compressRatio * 100) }) // Convertir le ratio en pourcentage de qualité
    .toBuffer();

  // Convertir le buffer en fichier (File)
  const compressedImageFile = new File([compressedImageBuffer], "compressed-image.jpg", {
    type: "image/jpeg",
  });

  return compressedImageFile;
}

/**
 * Vérifie si un fichier est une image.
 * @param buffer - Le fichier sous forme de Buffer.
 * @returns true si c'est une image, sinon false.
 */
async function checkIfImage(buffer: Buffer): Promise<boolean> {
  try {
    const metadata = await sharp(buffer).metadata();
    return !!metadata.format; // Retourne true si le format est détecté
  } catch (error) {
    return false; // Retourne false en cas d'erreur
  }
}


const getEncryptionKey = () => {
  const key = process.env.AUTH_SECRET
  if (!key) {
    throw new Error("NEXT_SECRET_KEY n'est pas défini")
  }

  // Créer une clé de 32 octets (256 bits) à partir de NEXT_SECRET_KEY
  // En production, utilisez une méthode plus robuste comme PBKDF2
  return Buffer.from(key.padEnd(32, "0").slice(0, 32))
}

// Fonction pour chiffrer une chaîne
export function encrypt<T>(object: T): string {
  const iv = randomBytes(16) // Vecteur d'initialisation
  const key = getEncryptionKey()

  const cipher = createCipheriv("aes-256-cbc", key, iv)
  const stringifiedObject = JSON.stringify(object)
  let encrypted = cipher.update(stringifiedObject, "utf8", "hex")
  encrypted += cipher.final("hex")

  // Retourner le vecteur d'initialisation et le texte chiffré
  return `${iv.toString("hex")}:${encrypted}`
}

// Fonction pour déchiffrer une chaîne
export function decrypt(encryptedText: string): string {
  const [ivHex, encrypted] = encryptedText.split(":")
  const iv = Buffer.from(ivHex, "hex")
  const key = getEncryptionKey()

  const decipher = createDecipheriv("aes-256-cbc", key, iv)
  let decrypted = decipher.update(encrypted, "hex", "utf8")
  decrypted += decipher.final("utf8")

  return decrypted
}
