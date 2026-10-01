import streamlit as st
import pandas as pd
import requests
from datetime import datetime

API_URL = "http://127.0.0.1:8000"

st.set_page_config(
    page_title="IoT Control Center",
    page_icon="💡",
    layout="wide",
    initial_sidebar_state="collapsed"
)

st.markdown(
    """
    <style>
    .stApp {
        background: linear-gradient(135deg, #f7f9fc 0%, #eef5ff 45%, #f5fbf8 100%);
    }

    .block-container {
        max-width: 1350px;
        padding-top: 2rem;
        padding-bottom: 3rem;
    }

    h1, h2, h3 {
        color: #0f172a;
    }

    div[data-testid="stMetric"] {
        background: white;
        border: 1px solid #e2e8f0;
        padding: 18px;
        border-radius: 18px;
        box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);
    }

    div[data-testid="stMetricLabel"] {
        color: #64748b;
        font-weight: 700;
    }

    div[data-testid="stMetricValue"] {
        color: #0f172a;
        font-weight: 800;
    }

    div[data-testid="stDataFrame"] {
        border-radius: 16px;
        overflow: hidden;
        border: 1px solid #e2e8f0;
    }

    div.stButton > button {
        border-radius: 12px;
        font-weight: 700;
        min-height: 46px;
    }

    #MainMenu {
        visibility: hidden;
    }

    footer {
        visibility: hidden;
    }

    header {
        visibility: hidden;
    }
    </style>
    """,
    unsafe_allow_html=True
)

def get_api_data():
    status_response = requests.get(f"{API_URL}/status", timeout=5)
    history_response = requests.get(f"{API_URL}/history", timeout=5)
    status_response.raise_for_status()
    history_response.raise_for_status()
    return status_response.json(), history_response.json()

try:
    status_data, history_data = get_api_data()

    estado_actual = status_data.get("led", "UNKNOWN")
    dispositivo = status_data.get("device", "ESP32-Wokwi")

    df = pd.DataFrame(history_data)

    if not df.empty:
        df["duration_seconds"] = pd.to_numeric(df["duration_seconds"], errors="coerce").fillna(0)
        df["date_time"] = pd.to_datetime(df["date_time"], errors="coerce")

        total_operaciones = len(df)
        encendidos = int((df["action"] == "ON").sum())
        apagados = int((df["action"] == "OFF").sum())
        consultas = int((df["action"] == "STATUS").sum())
        tiempo_total = float(df["duration_seconds"].sum())

        ultima = df.iloc[-1]
        ultima_operacion = ultima["action"]

        if pd.notna(ultima["date_time"]):
            ultima_fecha = ultima["date_time"].strftime("%d/%m/%Y %H:%M:%S")
        else:
            ultima_fecha = "-"
    else:
        total_operaciones = 0
        encendidos = 0
        apagados = 0
        consultas = 0
        tiempo_total = 0.0
        ultima_operacion = "SIN OPERACIONES"
        ultima_fecha = "-"

    left, right = st.columns([5, 1])

    with left:
        st.title("💡 IoT Control Center")
        st.caption("Monitoreo y analítica del foco inteligente conectado al ESP32 simulado en Wokwi.")

    with right:
        st.write("")
        st.success("Sistema conectado")

    st.write("")

    col1, col2, col3, col4 = st.columns(4)

    col1.metric("💡 Estado actual", estado_actual, help=dispositivo)
    col2.metric("📊 Total operaciones", total_operaciones)
    col3.metric("⚡ Encendidos", encendidos)
    col4.metric("⏻ Apagados", apagados)

    st.write("")

    col5, col6, col7 = st.columns(3)

    col5.metric("🔎 Consultas de estado", consultas)
    col6.metric("⏱️ Tiempo total encendido", f"{tiempo_total:.2f} s")
    col7.metric("🕒 Última actualización", datetime.now().strftime("%H:%M:%S"))

    st.write("")
    st.subheader("Actividad reciente")

    recent1, recent2 = st.columns([1, 2])

    with recent1:
        if ultima_operacion == "ON":
            st.success("⚡ Última operación: ON")
        elif ultima_operacion == "OFF":
            st.error("⏻ Última operación: OFF")
        elif ultima_operacion == "STATUS":
            st.info("🔎 Última operación: STATUS")
        else:
            st.info(f"Última operación: {ultima_operacion}")

        st.caption(f"Fecha y hora: {ultima_fecha}")

    with recent2:
        st.markdown(
            f"""
**Dispositivo:** {dispositivo}  
**Estado actual:** {estado_actual}  
**Total de operaciones:** {total_operaciones}  
**Tiempo acumulado encendido:** {tiempo_total:.2f} segundos
            """
        )

    st.write("")
    st.subheader("Historial de operaciones")

    if not df.empty:
        df_display = df.copy()
        df_display["date_time"] = df_display["date_time"].dt.strftime("%d/%m/%Y %H:%M:%S")
        df_display = df_display.rename(
            columns={
                "id": "ID",
                "date_time": "Fecha y hora",
                "action": "Acción",
                "state": "Estado",
                "device": "Dispositivo",
                "duration_seconds": "Duración (s)"
            }
        )

        st.dataframe(df_display, use_container_width=True, hide_index=True)
    else:
        st.info("No existen operaciones registradas.")

    st.write("")
    st.subheader("Analítica del dispositivo")

    if not df.empty:
        graph1, graph2 = st.columns(2)

        operaciones_tipo = (
            df["action"]
            .value_counts()
            .rename_axis("Operación")
            .reset_index(name="Cantidad")
        )

        estados = (
            df["state"]
            .value_counts()
            .rename_axis("Estado")
            .reset_index(name="Cantidad")
        )

        with graph1:
            st.markdown("#### Operaciones por tipo")
            st.bar_chart(operaciones_tipo, x="Operación", y="Cantidad")

        with graph2:
            st.markdown("#### Estados registrados")
            st.bar_chart(estados, x="Estado", y="Cantidad")

        st.markdown("#### Actividad por hora")

        df_time = df.dropna(subset=["date_time"]).copy()
        df_time["Hora"] = df_time["date_time"].dt.floor("h")

        operaciones_hora = (
            df_time.groupby("Hora")
            .size()
            .reset_index(name="Cantidad")
        )

        st.line_chart(operaciones_hora, x="Hora", y="Cantidad")

        st.subheader("Interpretación de resultados")

        if estado_actual == "ON":
            estado_texto = "El foco se encuentra actualmente encendido."
        else:
            estado_texto = "El foco se encuentra actualmente apagado."

        st.info(
            f"""
Se han registrado **{total_operaciones} operaciones**.

- **{encendidos} encendidos**
- **{apagados} apagados**
- **{consultas} consultas de estado**

{estado_texto}

El tiempo total registrado de funcionamiento es de **{tiempo_total:.2f} segundos**.
            """
        )
    else:
        st.warning("No existen suficientes datos para generar analítica.")

    st.write("")

    if st.button("🔄 Actualizar dashboard", use_container_width=True):
        st.rerun()

    st.caption("IoT LED Project · Fedora · FastAPI · PostgreSQL · MQTT · ESP32 Wokwi · Streamlit")

except requests.exceptions.ConnectionError:
    st.error("🔴 No se pudo conectar con FastAPI.")
    st.code("http://127.0.0.1:8000")

except Exception as e:
    st.error("Error cargando el dashboard.")
    st.exception(e)
