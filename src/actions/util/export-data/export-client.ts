import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';
import { Parser } from 'json2csv';

interface Selector {
  title: string;
  selector: string;
}

interface Data {
  [key: string]: any;
}

export function generateFileClient(selectors: Selector[], data: Data[], type: number): void {
  // Extraire les titres des colonnes à partir de selectors
  const columns = selectors.map((selector) => selector.title);

  // Préparer les données sous un format compatible avec json2csv
  const dataForCsv = data.map((item) => {
    const row: { [key: string]: any } = {};
    selectors.forEach((selector) => {
      row[selector.title] = item[selector.selector];  // Utiliser le 'selector' pour récupérer les données
    });
    return row;
  });

  if (type === 1) {
    // Générer un fichier CSV
    const csvParser = new Parser({ fields: columns });
    const csv = csvParser.parse(dataForCsv);

    // Créer un fichier Blob pour le CSV et démarrer le téléchargement
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'data.csv');
  } else {
    // Générer un fichier Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Data');

    // Ajouter la première ligne (titres des colonnes)
    worksheet.addRow(columns);

    // Ajouter les lignes de données
    dataForCsv.forEach((item) => {
      const row = selectors.map((selector) => item[selector.title]); // Utiliser le titre pour obtenir la valeur
      worksheet.addRow(row);
    });

    // Générer le fichier Excel
    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'data.xlsx');
    });
  }
}
