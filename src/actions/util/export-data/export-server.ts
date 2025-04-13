import fs from 'fs';
import { Parser } from 'json2csv';
import ExcelJS from 'exceljs';

interface Selector {
  title: string;
  selector: string;
}

interface Data {
  [key: string]: any;
}

export async function generateFileServer(selectors: Selector[], data: Data[], type: number, path: string): Promise<string> {
  // Vérification de la validité des données
//   if (selectors.length !== Object.keys(data[0]).length) {
//     throw new Error('Le nombre d\'éléments dans selectors doit être égal au nombre d\'éléments dans chaque objet de data');
//   }

  // Extraire les titres des colonnes à partir de selectors
  const columns = selectors.map((selector) => selector.title);

  if (type === 1) {
    // Générer un fichier CSV
    const csvParser = new Parser({ fields: columns });
    const csv = csvParser.parse(data);

    // Sauvegarder le fichier CSV sur le serveur
    fs.writeFileSync(path, csv);
    return path; // Retourne le chemin du fichier enregistré
  } else {
    // Générer un fichier Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Data');

    // Ajouter la première ligne (titres des colonnes)
    worksheet.addRow(columns);

    // Ajouter les lignes de données
    data.forEach((item) => {
      const row = selectors.map((selector) => item[selector.selector]);
      worksheet.addRow(row);
    });

    // Sauvegarder le fichier Excel
    await workbook.xlsx.writeFile(path);
    return path; // Retourne le chemin du fichier enregistré
  }
}
