import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";

const ContractSignatures = ({
  contract,
  payload,
  canSign,
  onOpenSign,
  fmtDate,
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Chữ ký các bên</Text>
      <View style={styles.signRow}>
        <View style={styles.signBlock}>
          <Text style={styles.signLabel}>Bên A</Text>
          <View style={styles.signatureContainer}>
            {contract.landlordSignatureUrl ? (
              <Image
                source={{ uri: contract.landlordSignatureUrl }}
                style={styles.signatureImage}
                resizeMode="contain"
              />
            ) : (
              <Text style={styles.noSignature}>Chưa ký</Text>
            )}
          </View>
          <Text style={styles.signerName}>
            {contract.A?.name || contract.landlordId?.userInfo?.fullName || "—"}
          </Text>
          {contract.landlordSignedAt ? (
            <Text style={{ color: "#64748b", fontSize: 12 }}>{`Ký: ${fmtDate(
              contract.landlordSignedAt
            )}`}</Text>
          ) : null}
        </View>

        <View style={styles.signBlock}>
          <Text style={styles.signLabel}>Bên B (Bạn)</Text>
          <View style={styles.signatureContainer}>
            {contract.tenantSignatureUrl ? (
              <Image
                source={{ uri: contract.tenantSignatureUrl }}
                style={styles.signatureImage}
                resizeMode="contain"
              />
            ) : (
              <Text style={styles.noSignature}>Chưa ký</Text>
            )}
          </View>
          <Text style={styles.signerName}>
            {payload.B.name || contract.B?.name || "—"}
          </Text>
          {contract.tenantSignedAt ? (
            <Text style={{ color: "#64748b", fontSize: 12 }}>{`Ký: ${fmtDate(
              contract.tenantSignedAt
            )}`}</Text>
          ) : null}
        </View>
      </View>
    </View>
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
  signRow: { flexDirection: "row", justifyContent: "space-between", gap: 16 },
  signBlock: { flex: 1, alignItems: "center" },
  signLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 8,
  },
  signatureContainer: {
    height: 100,
    width: "100%",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    marginBottom: 8,
  },
  signatureImage: { width: "90%", height: "90%", borderRadius: 6 },
  noSignature: { color: "#94a3b8", fontStyle: "italic" },
  signerName: { fontSize: 13, color: "#0f172a", fontWeight: "600" },
});

export default ContractSignatures;
