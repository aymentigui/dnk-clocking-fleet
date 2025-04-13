import { StyleSheet } from "@react-pdf/renderer";

export const styles = StyleSheet.create({
    page: {
      paddingTop: 40,
      paddingBottom: 40,
      paddingHorizontal: 30,
    },
    footer: {
      position: "absolute",
      bottom: 20,
      left: 30,
      right: 30,
      textAlign: "center",
      fontSize: 10,
      color: "gray",
    },
    content: {
      marginTop: 50, // Pour ne pas superposer avec le header
    },
  });