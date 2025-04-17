// utils/generateQRCodeAndDownload.ts
import QRCode from 'qrcode';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/**
 * Fonction qui génère un QR Code pour chaque ID dans la liste et les télécharge dans un fichier ZIP.
 * @param ids La liste des IDs ou des données à encoder dans les QR Codes.
 */
export const generateQRCodeAndDownload = async (matricules: string[]) => {
  try {
    const zip = new JSZip();

    // Pour chaque ID, génère un QR code et l'ajoute au fichier ZIP
    for (const matricule of matricules) {
      const qrCodeDataUrl = await QRCode.toDataURL(matricule);
      const base64Data = qrCodeDataUrl.split(',')[1]; // Extraire la partie base64

      // Ajouter l'image QR code au fichier ZIP
      zip.file(`${matricule}.jpeg`, base64Data, { base64: true });
    }

    // Créer le fichier ZIP
    zip.generateAsync({ type: 'blob' }).then((content) => {
      // Télécharger le fichier ZIP
      saveAs(content, 'vehicles-qr-codes.zip');
    });
  } catch (error) {
    console.error('Erreur lors de la génération des QR codes', error);
  }
};
