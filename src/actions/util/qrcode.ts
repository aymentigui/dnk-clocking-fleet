// utils/generateQRCodeAndDownload.ts
import QRCode from 'qrcode';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/**
 * Génère un QR code avec le texte du matricule en dessous et les télécharge dans un fichier ZIP.
 */
export const generateQRCodeAndDownload = async (matricules: string[]) => {
  try {
    const zip = new JSZip();

    for (const matricule of matricules) {
      // Génère le QR code dans un canvas
      const canvas = document.createElement('canvas');
      await QRCode.toCanvas(canvas, matricule, { width: 300 });

      // Crée un second canvas plus grand pour ajouter le texte
      const finalCanvas = document.createElement('canvas');
      const ctx = finalCanvas.getContext('2d')!;

      const qrWidth = canvas.width;
      const qrHeight = canvas.height;
      const textHeight = 40;

      finalCanvas.width = qrWidth;
      finalCanvas.height = qrHeight + textHeight;

      // Fond blanc pour toute l'image
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

      // Dessine le QR code
      ctx.drawImage(canvas, 0, 0);

      // Ajoute le texte du matricule en noir sur fond blanc
      ctx.fillStyle = '#000000'; // Texte en noir
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(matricule, qrWidth / 2, qrHeight + textHeight / 2);

      // Convertit en base64
      const dataUrl = finalCanvas.toDataURL('image/jpeg');
      const base64Data = dataUrl.split(',')[1];

      zip.file(`${matricule}.jpeg`, base64Data, { base64: true });
    }

    // Génère le ZIP et le télécharge
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'vehicles-qr-codes.zip');
  } catch (error) {
    console.error('Erreur lors de la génération des QR codes', error);
  }
};

export const generateQRCodeAndDownloadSingleWithoutZip = async (matricule: string) => {
  try {
    // Génère le QR code dans un canvas
    const canvas = document.createElement('canvas');
    await QRCode.toCanvas(canvas, matricule, { width: 300 });

    // Crée un second canvas plus grand pour ajouter le texte
    const finalCanvas = document.createElement('canvas');
    const ctx = finalCanvas.getContext('2d')!;
    const qrWidth = canvas.width;
    const qrHeight = canvas.height;
    const textHeight = 40;
    finalCanvas.width = qrWidth;
    finalCanvas.height = qrHeight + textHeight;

    // Fond blanc pour toute l'image
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
    // Dessine le QR code
    ctx.drawImage(canvas, 0, 0);
    // Ajoute le texte du matricule en noir sur fond blanc
    ctx.fillStyle = '#000000';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(matricule, qrWidth / 2, qrHeight + textHeight / 2);
    // Convertit en blob et le télécharge
    finalCanvas.toBlob((blob) => {
      if (blob) {
        saveAs(blob, `${matricule}.jpeg`);
      }
    }, 'image/jpeg');
  } catch (error) {
    console.error('Erreur lors de la génération du QR code', error);
  }
};