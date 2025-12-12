import React from "react";
import { View, Text, StyleSheet } from "react-native";
import RenderHtml from "react-native-render-html";

const ContractTerms = ({ contract, contentWidth }) => {
  return (
    <>
      {Array.isArray(contract.terms) && contract.terms.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Điều khoản hợp đồng</Text>
          {contract.terms.slice(0, 50).map((t, i) => {
            const cleanedHtml = (t.description || "")
              .replace(/<br\s*\/?>/gi, "")
              .replace(/\r\n|\r/g, "\n")
              .replace(/\n\s*\n/g, "\n")
              .replace(/<p>\s*<\/p>/gi, "")
              .replace(/style=(["'])[^"']*margin[^"']*\1/gi, "")
              .replace(/^\s+|\s+$/g, "");

            return (
              <View key={`term-${i}`} style={styles.termBlockNoCard}>
                <Text style={styles.termHeadingNoCard}>
                  <Text style={styles.termNumber}></Text>
                  <Text style={styles.termTitleNoCard}>
                    {t.name || "Điều khoản"}
                  </Text>
                </Text>

                <RenderHtml
                  contentWidth={contentWidth}
                  source={{ html: cleanedHtml || "<p></p>" }}
                  baseStyle={{ color: "#475569", lineHeight: 20 }}
                  tagsStyles={{
                    p: { marginTop: 4, marginBottom: 8, lineHeight: 20 },
                    li: { marginTop: 2, marginBottom: 6, lineHeight: 20 },
                    ul: { marginTop: 6, marginBottom: 8, paddingLeft: 16 },
                    ol: { marginTop: 6, marginBottom: 8, paddingLeft: 16 },
                    strong: { fontWeight: "700" },
                  }}
                />
              </View>
            );
          })}
        </View>
      )}

      {Array.isArray(contract.regulations) &&
        contract.regulations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nội quy / Quy định</Text>
            {contract.regulations.slice(0, 50).map((r, i) => {
              const cleanedHtml = (r.description || "")
                .replace(/<br\s*\/?>/gi, "")
                .replace(/\r\n|\r/g, "\n")
                .replace(/\n\s*\n/g, "\n")
                .replace(/<p>\s*<\/p>/gi, "")
                .replace(/^\s+|\s+$/g, "");
              return (
                <View key={`reg-${i}`} style={styles.termBlockNoCard}>
                  <Text style={styles.termHeadingNoCard}>
                    <Text style={styles.termNumber}></Text>
                    <Text style={styles.termTitleNoCard}>
                      {r.title || "Quy định"}
                    </Text>
                  </Text>
                  <RenderHtml
                    contentWidth={contentWidth}
                    source={{ html: cleanedHtml || "<p></p>" }}
                    baseStyle={{ color: "#475569", lineHeight: 20 }}
                    tagsStyles={{
                      p: { marginTop: 4, marginBottom: 8, lineHeight: 20 },
                      li: { marginTop: 2, marginBottom: 6, lineHeight: 20 },
                      ul: { marginTop: 6, marginBottom: 8, paddingLeft: 16 },
                      ol: { marginTop: 6, marginBottom: 8, paddingLeft: 16 },
                      strong: { fontWeight: "700" },
                    }}
                  />
                </View>
              );
            })}
          </View>
        )}
    </>
  );
};

const styles = StyleSheet.create({
  section: { marginBottom: 18 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
    color: "#0f172a",
  },
  termBlockNoCard: { marginBottom: 8, paddingBottom: 4 },
  termHeadingNoCard: { marginBottom: 6, fontSize: 15, lineHeight: 20 },
  termNumber: { fontWeight: "400", color: "#475569" },
  termTitleNoCard: { fontWeight: "700", color: "#0f172a" },
});

export default ContractTerms;
