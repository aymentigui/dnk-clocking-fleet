import React from 'react'
import { Text, View } from '@react-pdf/renderer';
import { StyleSheet } from "@react-pdf/renderer";

export const styles = StyleSheet.create({
    header: {
      position: "absolute",
      top: 20,
      left: 30,
      right: 30,
      textAlign: "center",
      fontSize: 14,
      fontWeight: "bold",
    },
  });

const HeaderPDF = () => {
    return (
        <View style={styles.header}>
            <Text>Aimen</Text>
        </View>
    )
}

export default HeaderPDF
