import React from 'react'
import { Text, View } from '@react-pdf/renderer'
import { StyleSheet } from "@react-pdf/renderer";

export const styles = StyleSheet.create({
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: "center",
    fontSize: 10,
    color: "gray",
  }
});


const FooterPDF = () => {
  return (
    <View fixed style={styles.footer} render={({ pageNumber }) => {
      return <>
        <Text>{pageNumber}</Text>
      </>
    }
    } />
  )
}

export default FooterPDF
