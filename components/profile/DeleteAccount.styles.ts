import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  selectHeader: {
    marginBottom: 20,
  },
  selectTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Manrope_700Bold",
  },
  reasonCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reasonLabel: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Manrope_600SemiBold",
  },
  confirmIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    alignSelf: "center",
  },
  confirmTitle: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Manrope_700Bold",
    textAlign: "center",
    marginBottom: 12,
  },
  confirmMessage: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  warningText: {
    color: "#EF4444",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  agreeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 32,
  },
  agreeText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  checkbox: {
    width: 25,
    height: 25,
    borderWidth: 1.5,
    borderRadius: 4,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#EF4444",
    borderColor: "#EF4444",
  },
  confirmButtons: {
    width: "100%",
    gap: 12,
  },
});
