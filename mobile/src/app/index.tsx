import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";

const API_URL = "http://127.0.0.1:8000";

type Operation = {
  id: number;
  date_time: string;
  action: string;
  state: string;
  device: string;
  duration_seconds: number;
};

export default function HomeScreen() {
  const [ledState, setLedState] = useState("OFF");
  const [history, setHistory] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");
  const [connected, setConnected] = useState(false);

  const loadStatus = async () => {
    const response = await fetch(`${API_URL}/status`);

    if (!response.ok) {
      throw new Error("Error consultando el estado");
    }

    const data = await response.json();

    setLedState(data.led);
    setConnected(true);
  };

  const loadHistory = async () => {
    const response = await fetch(`${API_URL}/history`);

    if (!response.ok) {
      throw new Error("Error consultando historial");
    }

    const data = await response.json();

    setHistory(data);
  };

  const refreshData = async () => {
    try {
      setRefreshing(true);

      await Promise.all([
        loadStatus(),
        loadHistory(),
      ]);

      setConnected(true);
    } catch {
      setConnected(false);
      setMessage(
        "No se pudo conectar con el backend."
      );
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const sendCommand = async (
    endpoint: string,
    successMessage: string
  ) => {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(
        `${API_URL}${endpoint}`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
          "Error procesando la operación"
        );
      }

      const newState =
        data.status ||
        data.led ||
        ledState;

      setLedState(newState);

      if (
        endpoint === "/led/off" &&
        data.duration_seconds !== undefined
      ) {
        setMessage(
          `Foco apagado · ${data.duration_seconds} s encendido`
        );
      } else {
        setMessage(successMessage);
      }

      setConnected(true);

      await loadHistory();

    } catch (error) {

      setConnected(false);

      if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage(
          "No se pudo completar la operación."
        );
      }

    } finally {
      setLoading(false);
    }
  };

  const turnOn = () => {
    sendCommand(
      "/led/on",
      "Foco encendido correctamente"
    );
  };

  const turnOff = () => {
    sendCommand(
      "/led/off",
      "Foco apagado correctamente"
    );
  };

  const checkStatus = () => {
    sendCommand(
      "/led/status",
      "Estado consultado correctamente"
    );
  };

  const recentOperations = history
    .slice()
    .reverse();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refreshData}
        />
      }
    >

      {/* HEADER */}

      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>
            IOT CONTROL CENTER
          </Text>

          <Text style={styles.title}>
            Smart Light
          </Text>

          <Text style={styles.subtitle}>
            ESP32 · Wokwi · MQTT
          </Text>
        </View>

        <View
          style={[
            styles.connectionBadge,
            connected
              ? styles.connectionOnline
              : styles.connectionOffline,
          ]}
        >
          <View
            style={[
              styles.connectionDot,
              connected
                ? styles.dotOnline
                : styles.dotOffline,
            ]}
          />

          <Text
            style={[
              styles.connectionText,
              connected
                ? styles.textOnline
                : styles.textOffline,
            ]}
          >
            {connected
              ? "ONLINE"
              : "OFFLINE"}
          </Text>
        </View>
      </View>

      {/* STATUS */}

      <View style={styles.statusCard}>

        <View
          style={[
            styles.lightCircle,
            ledState === "ON"
              ? styles.lightOn
              : styles.lightOff,
          ]}
        >
          <Text style={styles.bulb}>
            💡
          </Text>
        </View>

        <Text style={styles.statusLabel}>
          Estado del foco
        </Text>

        <Text
          style={[
            styles.statusValue,
            ledState === "ON"
              ? styles.stateOn
              : styles.stateOff,
          ]}
        >
          {ledState}
        </Text>

        <Text style={styles.deviceText}>
          ESP32-Wokwi
        </Text>

      </View>

      {/* CONTROLES */}

      <Text style={styles.sectionTitle}>
        Control
      </Text>

      <View style={styles.primaryButtons}>

        <Pressable
          style={({ pressed }) => [
            styles.controlButton,
            styles.turnOnButton,
            pressed && styles.pressedButton,
          ]}
          onPress={turnOn}
          disabled={loading}
        >
          <Text style={styles.controlIcon}>
            ⚡
          </Text>

          <Text style={styles.controlTitle}>
            Encender
          </Text>

          <Text style={styles.controlDescription}>
            Activar foco
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.controlButton,
            styles.turnOffButton,
            pressed && styles.pressedButton,
          ]}
          onPress={turnOff}
          disabled={loading}
        >
          <Text style={styles.controlIcon}>
            ◯
          </Text>

          <Text style={styles.controlTitle}>
            Apagar
          </Text>

          <Text style={styles.controlDescription}>
            Desactivar foco
          </Text>
        </Pressable>

      </View>

      <Pressable
        style={({ pressed }) => [
          styles.statusButton,
          pressed && styles.pressedButton,
        ]}
        onPress={checkStatus}
        disabled={loading}
      >
        <View>
          <Text style={styles.statusButtonTitle}>
            Consultar estado
          </Text>

          <Text style={styles.statusButtonText}>
            Solicitar estado real al ESP32
          </Text>
        </View>

        <Text style={styles.arrow}>
          →
        </Text>
      </Pressable>

      {/* LOADING */}

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="small"
          />

          <Text style={styles.loadingText}>
            Comunicando con ESP32...
          </Text>
        </View>
      )}

      {/* MESSAGE */}

      {message !== "" && (
        <View style={styles.messageBox}>
          <Text style={styles.messageIcon}>
            ✓
          </Text>

          <Text style={styles.messageText}>
            {message}
          </Text>
        </View>
      )}

      {/* HISTORY */}

      <View style={styles.historyHeader}>

        <View>
          <Text style={styles.sectionTitle}>
            Actividad reciente
          </Text>

          <Text style={styles.historySubtitle}>
            {history.length} operaciones registradas
          </Text>
        </View>

        <Pressable
          style={styles.refreshButton}
          onPress={refreshData}
        >
          <Text style={styles.refreshText}>
            ↻
          </Text>
        </Pressable>

      </View>

      {recentOperations.length === 0 ? (

        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>
            📭
          </Text>

          <Text style={styles.emptyTitle}>
            Sin operaciones
          </Text>

          <Text style={styles.emptyText}>
            Las operaciones aparecerán aquí.
          </Text>
        </View>

      ) : (

        recentOperations.map(
          (item, index) => {

            const isOn =
              item.state === "ON";

            return (
              <View
                key={`${item.id}-${index}`}
                style={styles.historyCard}
              >

                <View
                  style={[
                    styles.operationIndicator,
                    isOn
                      ? styles.indicatorOn
                      : styles.indicatorOff,
                  ]}
                />

                <View style={styles.historyContent}>

                  <View style={styles.historyTop}>

                    <View
                      style={
                        styles.operationBadge
                      }
                    >
                      <Text
                        style={
                          styles.operationText
                        }
                      >
                        {item.action}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.historyState,
                        isOn
                          ? styles.stateOn
                          : styles.stateOff,
                      ]}
                    >
                      {item.state}
                    </Text>

                  </View>

                  <Text style={styles.historyDate}>
                    {new Date(
                      item.date_time
                    ).toLocaleString()}
                  </Text>

                  <View style={styles.historyDetails}>

                    <Text style={styles.detailText}>
                      📡 {item.device}
                    </Text>

                    <Text style={styles.detailText}>
                      ⏱ {Number(
                        item.duration_seconds
                      ).toFixed(2)} s
                    </Text>

                  </View>

                </View>

              </View>
            );
          }
        )
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Fedora · FastAPI · PostgreSQL
        </Text>

        <Text style={styles.footerText}>
          MQTT · Wokwi ESP32
        </Text>
      </View>

    </ScrollView>
  );
}


const styles = StyleSheet.create({

  screen: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },

  container: {
    width: "100%",
    maxWidth: 850,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 50,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 1.5,
    marginBottom: 5,
  },

  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "#0F172A",
  },

  subtitle: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 14,
  },

  connectionBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  connectionOnline: {
    backgroundColor: "#DCFCE7",
  },

  connectionOffline: {
    backgroundColor: "#FEE2E2",
  },

  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 8,
    marginRight: 7,
  },

  dotOnline: {
    backgroundColor: "#16A34A",
  },

  dotOffline: {
    backgroundColor: "#DC2626",
  },

  connectionText: {
    fontSize: 11,
    fontWeight: "800",
  },

  textOnline: {
    color: "#15803D",
  },

  textOffline: {
    color: "#B91C1C",
  },

  statusCard: {
    backgroundColor: "#0F172A",
    borderRadius: 26,
    paddingVertical: 32,
    paddingHorizontal: 25,
    alignItems: "center",
    marginBottom: 30,
  },

  lightCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },

  lightOn: {
    backgroundColor: "#FEF3C7",
  },

  lightOff: {
    backgroundColor: "#1E293B",
  },

  bulb: {
    fontSize: 46,
  },

  statusLabel: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "600",
  },

  statusValue: {
    fontSize: 42,
    fontWeight: "900",
    marginVertical: 4,
  },

  stateOn: {
    color: "#22C55E",
  },

  stateOff: {
    color: "#EF4444",
  },

  deviceText: {
    color: "#64748B",
    fontSize: 13,
  },

  sectionTitle: {
    color: "#0F172A",
    fontSize: 21,
    fontWeight: "800",
    marginBottom: 12,
  },

  primaryButtons: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 14,
  },

  controlButton: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    minHeight: 135,
  },

  turnOnButton: {
    backgroundColor: "#16A34A",
  },

  turnOffButton: {
    backgroundColor: "#DC2626",
  },

  pressedButton: {
    opacity: 0.72,
    transform: [
      {
        scale: 0.985,
      },
    ],
  },

  controlIcon: {
    fontSize: 24,
    marginBottom: 15,
  },

  controlTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "800",
  },

  controlDescription: {
    color: "rgba(255,255,255,.75)",
    marginTop: 4,
    fontSize: 12,
  },

  statusButton: {
    backgroundColor: "white",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },

  statusButtonTitle: {
    color: "#0F172A",
    fontWeight: "800",
    fontSize: 16,
  },

  statusButtonText: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 3,
  },

  arrow: {
    fontSize: 25,
    color: "#2563EB",
  },

  loadingContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },

  loadingText: {
    color: "#64748B",
    marginLeft: 10,
  },

  messageBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 14,
    padding: 14,
    marginBottom: 24,
  },

  messageIcon: {
    backgroundColor: "#2563EB",
    color: "white",
    width: 24,
    height: 24,
    textAlign: "center",
    borderRadius: 12,
    marginRight: 10,
    lineHeight: 24,
    fontWeight: "800",
  },

  messageText: {
    color: "#1E40AF",
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
  },

  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 14,
  },

  historySubtitle: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: -6,
  },

  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
  },

  refreshText: {
    color: "#334155",
    fontSize: 22,
    fontWeight: "700",
  },

  historyCard: {
    backgroundColor: "white",
    borderRadius: 18,
    marginBottom: 12,
    overflow: "hidden",
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#E8EDF4",
  },

  operationIndicator: {
    width: 5,
  },

  indicatorOn: {
    backgroundColor: "#22C55E",
  },

  indicatorOff: {
    backgroundColor: "#EF4444",
  },

  historyContent: {
    flex: 1,
    padding: 16,
  },

  historyTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  operationBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },

  operationText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#334155",
  },

  historyState: {
    fontWeight: "900",
    fontSize: 13,
  },

  historyDate: {
    color: "#64748B",
    marginTop: 10,
    fontSize: 13,
  },

  historyDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginTop: 9,
  },

  detailText: {
    color: "#94A3B8",
    fontSize: 12,
  },

  emptyState: {
    backgroundColor: "white",
    padding: 35,
    borderRadius: 18,
    alignItems: "center",
  },

  emptyIcon: {
    fontSize: 36,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#334155",
    marginTop: 10,
  },

  emptyText: {
    color: "#94A3B8",
    marginTop: 5,
    fontSize: 13,
  },

  footer: {
    marginTop: 35,
    alignItems: "center",
  },

  footerText: {
    color: "#94A3B8",
    fontSize: 11,
    marginTop: 3,
  },
});
