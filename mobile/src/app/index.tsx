import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
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
  const [message, setMessage] = useState("");

  const loadStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/status`);
      const data = await response.json();

      setLedState(data.led);
    } catch (error) {
      setMessage("No se pudo consultar el estado.");
    }
  };

  const loadHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/history`);
      const data = await response.json();

      setHistory(data);
    } catch (error) {
      setMessage("No se pudo cargar el historial.");
    }
  };

  const refreshData = async () => {
    await loadStatus();
    await loadHistory();
  };

  useEffect(() => {
    refreshData();
  }, []);

  const turnOn = async () => {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(`${API_URL}/led/on`, {
        method: "POST",
      });

      const data = await response.json();

      setLedState(data.status);
      setMessage("Foco encendido correctamente.");

      await loadHistory();
    } catch (error) {
      setMessage("Error al encender el foco.");
    } finally {
      setLoading(false);
    }
  };

  const turnOff = async () => {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(`${API_URL}/led/off`, {
        method: "POST",
      });

      const data = await response.json();

      setLedState(data.status);

      if (data.duration_seconds !== undefined) {
        setMessage(
          `Foco apagado. Tiempo encendido: ${data.duration_seconds} segundos.`
        );
      } else {
        setMessage("Foco apagado correctamente.");
      }

      await loadHistory();
    } catch (error) {
      setMessage("Error al apagar el foco.");
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(`${API_URL}/led/status`, {
        method: "POST",
      });

      const data = await response.json();

      setLedState(data.led);
      setMessage(`Estado consultado: ${data.led}`);

      await loadHistory();
    } catch (error) {
      setMessage("Error al consultar el estado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>💡 Control de Foco IoT</Text>

      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Estado actual</Text>

        <Text
          style={[
            styles.statusValue,
            ledState === "ON" ? styles.on : styles.off,
          ]}
        >
          {ledState}
        </Text>

        <Text style={styles.device}>Dispositivo: ESP32</Text>
      </View>

      <View style={styles.buttonContainer}>
        <Pressable
          style={[styles.button, styles.onButton]}
          onPress={turnOn}
          disabled={loading}
        >
          <Text style={styles.buttonText}>ENCENDER</Text>
        </Pressable>

        <Pressable
          style={[styles.button, styles.offButton]}
          onPress={turnOff}
          disabled={loading}
        >
          <Text style={styles.buttonText}>APAGAR</Text>
        </Pressable>

        <Pressable
          style={[styles.button, styles.statusButton]}
          onPress={checkStatus}
          disabled={loading}
        >
          <Text style={styles.buttonText}>CONSULTAR ESTADO</Text>
        </Pressable>
      </View>

      {loading && (
        <ActivityIndicator
          size="large"
          style={styles.loader}
        />
      )}

      {message !== "" && (
        <View style={styles.messageBox}>
          <Text style={styles.message}>{message}</Text>
        </View>
      )}

      <View style={styles.historyHeader}>
        <Text style={styles.sectionTitle}>Historial de operaciones</Text>

        <Pressable
          style={styles.refreshButton}
          onPress={refreshData}
        >
          <Text style={styles.refreshText}>Actualizar</Text>
        </Pressable>
      </View>

      {history.length === 0 ? (
        <Text style={styles.empty}>
          No hay operaciones registradas.
        </Text>
      ) : (
        history
          .slice()
          .reverse()
          .map((item) => (
            <View
              key={item.id}
              style={styles.historyCard}
            >
              <View style={styles.historyTop}>
                <Text style={styles.action}>
                  {item.action}
                </Text>

                <Text
                  style={[
                    styles.historyState,
                    item.state === "ON"
                      ? styles.on
                      : styles.off,
                  ]}
                >
                  {item.state}
                </Text>
              </View>

              <Text style={styles.historyText}>
                Fecha y hora:{" "}
                {new Date(item.date_time).toLocaleString()}
              </Text>

              <Text style={styles.historyText}>
                Dispositivo: {item.device}
              </Text>

              <Text style={styles.historyText}>
                Duración: {item.duration_seconds} s
              </Text>
            </View>
          ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: "#f5f7fb",
    minHeight: "100%",
  },

  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },

  statusCard: {
    backgroundColor: "white",
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
    alignItems: "center",
  },

  statusLabel: {
    fontSize: 18,
    color: "#555",
  },

  statusValue: {
    fontSize: 48,
    fontWeight: "bold",
    marginVertical: 10,
  },

  on: {
    color: "green",
  },

  off: {
    color: "red",
  },

  device: {
    color: "#666",
  },

  buttonContainer: {
    gap: 12,
    marginBottom: 20,
  },

  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },

  onButton: {
    backgroundColor: "#1f9d55",
  },

  offButton: {
    backgroundColor: "#d64545",
  },

  statusButton: {
    backgroundColor: "#2563eb",
  },

  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },

  loader: {
    marginVertical: 15,
  },

  messageBox: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },

  message: {
    textAlign: "center",
  },

  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
  },

  refreshButton: {
    backgroundColor: "#333",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },

  refreshText: {
    color: "white",
  },

  historyCard: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },

  historyTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  action: {
    fontSize: 18,
    fontWeight: "bold",
  },

  historyState: {
    fontWeight: "bold",
  },

  historyText: {
    color: "#555",
    marginTop: 4,
  },

  empty: {
    color: "#777",
    textAlign: "center",
    marginTop: 20,
  },
});
