import { View, Text, StyleSheet } from "@react-pdf/renderer";

// Styles du tableau
const styles = StyleSheet.create({
  table: {
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#bfbfbf",
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
  },
  header: {
    backgroundColor: "#f0f0f0",
    fontWeight: "bold",
  },
  cell: {
    padding: 6,
    borderWidth: 1,
    borderColor: "#bfbfbf",
    fontSize: 10,
    textAlign: "center",
  },
});

// Définition des types de props
interface PDFTableProps {
  columns: string[];
  columnsFlex: number[];
  data: { [key: string]: string | number }[];
}

const PDFTable: React.FC<PDFTableProps> = ({ columns, columnsFlex, data }) => {
  return (
    <View style={styles.table}>
      {/* Header du tableau */}
      <View style={[styles.row, styles.header]}>
        {columns.map((col, index) => (
          <Text key={index} style={[styles.cell, { flex:  columnsFlex[index]??1 }]}>
            {col}
          </Text>
        ))}
      </View>
      {/* Lignes de données */}
      {data.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {columns.map((col, colIndex) => (
            <Text key={colIndex} style={[styles.cell, { flex: columnsFlex[colIndex]??1 }]}>
              {row[col]}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
};

export default PDFTable;
