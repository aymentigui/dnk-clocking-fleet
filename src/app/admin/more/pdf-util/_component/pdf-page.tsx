import { Page, View, Document, Text } from "@react-pdf/renderer";
import HeaderPDF from "@/components/myui/pdf/header/header";
import FooterPDF from "@/components/myui/pdf/footer/footer";
import { StyleSheet } from "@react-pdf/renderer";

export const styles = StyleSheet.create({
  page: {
    paddingTop: 120,
    paddingBottom : 120,
    paddingHorizontal: 30,
    position: "relative",
  },
  content: {
    flex: 1,
  },
  footerContainer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
  },
});

interface PDFLayoutProps {
  children: React.ReactNode;
}

const PDFLayout: React.FC<PDFLayoutProps> = ({ children }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <HeaderPDF /> 
      <View style={styles.content}>
        {children}
      </View>

      {/* Footer sur chaque page */}
      <View fixed style={styles.footerContainer}>
        <FooterPDF />
      </View>
    </Page>
  </Document>
);

export default PDFLayout;