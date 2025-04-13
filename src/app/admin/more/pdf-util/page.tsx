"use client"
import { PDFViewer } from "@react-pdf/renderer";
import PDFLayout from "./_component/pdf-page";
import PDFTable from "@/components/myui/pdf/table/table-pdf";

const data = [
  { Nom: "Alice", Âge: 25, Ville: "Paris", VilleA: "Paris" },
  { Nom: "Bob", Âge: 30, Ville: "Lyon",  VilleA: "Paris" },
  { Nom: "Bob", Âge: 30, Ville: "Lyon",  VilleA: "Paris2" },
  { Nom: "Alice", Âge: 25, Ville: "Paris", VilleA: "Paris" },
  { Nom: "Bob", Âge: 30, Ville: "Lyon",  VilleA: "Paris" },
  { Nom: "Bob", Âge: 30, Ville: "Lyon",  VilleA: "Paris2" },
  { Nom: "Alice", Âge: 25, Ville: "Paris", VilleA: "Paris" },
  { Nom: "Bob", Âge: 30, Ville: "Lyon",  VilleA: "Paris" },
  { Nom: "Bob", Âge: 30, Ville: "Lyon",  VilleA: "Paris2" },
  { Nom: "Alice", Âge: 25, Ville: "Paris", VilleA: "Paris" },
  { Nom: "Bob", Âge: 30, Ville: "Lyon",  VilleA: "Paris" },
  { Nom: "Bob", Âge: 30, Ville: "Lyon",  VilleA: "Paris2" },
  { Nom: "Alice", Âge: 25, Ville: "Paris", VilleA: "Paris" },
  { Nom: "Bob", Âge: 30, Ville: "Lyon",  VilleA: "Paris" },
  { Nom: "Bob", Âge: 30, Ville: "Lyon",  VilleA: "Paris2" },
  { Nom: "Alice", Âge: 25, Ville: "Paris", VilleA: "Paris" },
  { Nom: "Bob", Âge: 30, Ville: "Lyon",  VilleA: "Paris" },
  { Nom: "Bob", Âge: 30, Ville: "Lyon",  VilleA: "Paris2" },
  { Nom: "Alice", Âge: 25, Ville: "Paris", VilleA: "Paris" },
  { Nom: "Bob", Âge: 30, Ville: "Lyon",  VilleA: "Paris" },
  { Nom: "Bob", Âge: 30, Ville: "Lyon",  VilleA: "Paris2" },
  { Nom: "Alice", Âge: 25, Ville: "Paris", VilleA: "Paris" },
  { Nom: "Bob", Âge: 30, Ville: "Lyon",  VilleA: "Paris" },
  { Nom: "Bob", Âge: 30, Ville: "Lyon",  VilleA: "Paris2" },
  { Nom: "Bob", Âge: 30, Ville: "Lyon",  VilleA: "Paris" },
  { Nom: "Bob", Âge: 30, Ville: "Lyon",  VilleA: "Paris2" },
  { Nom: "Alice", Âge: 25, Ville: "Paris", VilleA: "Paris" },
  { Nom: "Bob", Âge: 30, Ville: "Lyon",  VilleA: "Paris" },
  { Nom: "Bob", Âge: 30, Ville: "Lyon",  VilleA: "Paris2" },
  { Nom: "Alice", Âge: 25, Ville: "Paris", VilleA: "Paris" },
  { Nom: "Bob", Âge: 30, Ville: "Lyon",  VilleA: "Paris" },
  { Nom: "Bob", Âge: 30, Ville: "Lyon",  VilleA: "Paris2" },
  { Nom: "Alice", Âge: 25, Ville: "Paris", VilleA: "Paris" },
  { Nom: "Bob", Âge: 30, Ville: "Lyon",  VilleA: "Paris" },
  { Nom: "Bob", Âge: 30, Ville: "Lyon",  VilleA: "Paris2" },
  { Nom: "Alice", Âge: 25, Ville: "Paris", VilleA: "Paris" },
  { Nom: "Bob", Âge: 30, Ville: "Lyon",  VilleA: "Paris" },
  { Nom: "Bob", Âge: 30, Ville: "Lyon",  VilleA: "Paris2" },
  { Nom: "Alice", Âge: 25, Ville: "Paris", VilleA: "Paris" },
  { Nom: "Bob", Âge: 30, Ville: "Lyon",  VilleA: "Paris" },
  { Nom: "Bob", Âge: 30, Ville: "Lyon",  VilleA: "Paris2" },
  { Nom: "Bob", Âge: 30, Ville: "Lyon",  VilleA: "Paris" },
  { Nom: "Bob", Âge: 30, Ville: "Lyon",  VilleA: "Paris2" },
  { Nom: "Alice", Âge: 25, Ville: "Paris", VilleA: "Paris" },
  { Nom: "Bob", Âge: 30, Ville: "Lyon",  VilleA: "Paris" },
  { Nom: "Bob", Âge: 30, Ville: "Lyon",  VilleA: "Paris2" },
  { Nom: "Alice", Âge: 25, Ville: "Paris", VilleA: "Paris" },
  { Nom: "Bob", Âge: 30, Ville: "Lyon",  VilleA: "Paris" },
  { Nom: "Bob", Âge: 30, Ville: "Lyon",  VilleA: "Paris2" },
  { Nom: "Alice", Âge: 25, Ville: "Paris", VilleA: "Paris" },
  { Nom: "Bob", Âge: 30, Ville: "Lyon",  VilleA: "Paris" },
  { Nom: "Bob", Âge: 30, Ville: "Lyon",  VilleA: "Paris2" },
  { Nom: "Alice", Âge: 25, Ville: "Paris", VilleA: "Paris" },
  { Nom: "Bob", Âge: 30, Ville: "Lyon",  VilleA: "Paris" },
  { Nom: "Bob", Âge: 30, Ville: "Lyon",  VilleA: "Paris2" },
  { Nom: "Alice", Âge: 25, Ville: "Paris", VilleA: "Paris" },
  { Nom: "Bob", Âge: 30, Ville: "Lyon",  VilleA: "Paris" },
  { Nom: "Bob", Âge: 30, Ville: "Lyon",  VilleA: "Paris2" },
];

const columns = ["Nom", "Âge", "Ville", "VilleA"];
const columnsFlex = [1,2,2,4];

const MyPDF = () => (
  <PDFLayout>
    <PDFTable columns={columns} data={data} columnsFlex={columnsFlex} />
  </PDFLayout>
);

const PDFPage = () => (
  <div className="p-5">
    <h1 className="text-lg font-bold">Télécharger le PDF</h1>
    <PDFViewer className="w-3/6 h-[450px]" >
        <MyPDF />
    </PDFViewer>
  </div>
);

export default PDFPage;
