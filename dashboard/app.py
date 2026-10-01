import streamlit as st
import pandas as pd
import requests

API_URL = "http://127.0.0.1:8000"

st.set_page_config(
    page_title="IoT LED Dashboard",
    page_icon="💡",
    layout="wide"
)

st.title("💡 Dashboard IoT - ESP32")

try:
    # Obtener estado actual
    status_response = requests.get(f"{API_URL}/status")
    status_data = status_response.json()

    # Obtener historial
    history_response = requests.get(f"{API_URL}/history")
    history_data = history_response.json()

    estado_actual = status_data.get("led", "UNKNOWN")

    df = pd.DataFrame(history_data)

    if not df.empty:
        total_operaciones = len(df)

        encendidos = len(
            df[df["action"] == "ON"]
        )

        apagados = len(
            df[df["action"] == "OFF"]
        )

        consultas_estado = len(
            df[df["action"] == "STATUS"]
        )

        ultima_operacion = df.iloc[-1]["action"]

        tiempo_total_funcionamiento = (
            pd.to_numeric(
                df["duration_seconds"],
                errors="coerce"
            )
            .fillna(0)
            .sum()
        )

    else:
        total_operaciones = 0
        encendidos = 0
        apagados = 0
        consultas_estado = 0
        ultima_operacion = "Sin operaciones"
        tiempo_total_funcionamiento = 0

    # =========================
    # INDICADORES PRINCIPALES
    # =========================

    col1, col2, col3, col4 = st.columns(4)

    col1.metric(
        "Estado actual",
        estado_actual
    )

    col2.metric(
        "Total operaciones",
        total_operaciones
    )

    col3.metric(
        "Encendidos",
        encendidos
    )

    col4.metric(
        "Apagados",
        apagados
    )

    col5, col6 = st.columns(2)

    col5.metric(
        "Consultas de estado",
        consultas_estado
    )

    col6.metric(
        "Tiempo total encendido",
        f"{tiempo_total_funcionamiento:.2f} s"
    )

    # =========================
    # ÚLTIMA OPERACIÓN
    # =========================

    st.subheader("Última operación")
    st.write(ultima_operacion)

    # =========================
    # HISTORIAL
    # =========================

    st.subheader("Historial de operaciones")

    if not df.empty:

        df_mostrar = df.copy()

        df_mostrar = df_mostrar.rename(
            columns={
                "date_time": "Fecha y hora",
                "action": "Acción",
                "state": "Estado",
                "device": "Dispositivo",
                "duration_seconds": "Duración (s)"
            }
        )

        st.dataframe(
            df_mostrar,
            width="stretch"
        )

    else:
        st.info(
            "Todavía no hay operaciones registradas."
        )

    # =========================
    # ANALÍTICA
    # =========================

    st.subheader("Analítica de datos")

    if not df.empty:

        # -------------------------
        # GRÁFICO 1
        # OPERACIONES POR TIPO
        # -------------------------

        st.write("### Operaciones por tipo")

        operaciones_tipo = (
            df["action"]
            .value_counts()
            .rename_axis("Acción")
            .reset_index(name="Cantidad")
        )

        st.bar_chart(
            operaciones_tipo,
            x="Acción",
            y="Cantidad"
        )

        # -------------------------
        # GRÁFICO 2
        # ESTADOS DEL FOCO
        # -------------------------

        st.write("### Estados del foco")

        estados = (
            df["state"]
            .value_counts()
            .rename_axis("Estado")
            .reset_index(name="Cantidad")
        )

        st.bar_chart(
            estados,
            x="Estado",
            y="Cantidad"
        )

        # -------------------------
        # OPERACIONES POR HORA
        # -------------------------

        st.write("### Operaciones por hora")

        df["date_time"] = pd.to_datetime(
            df["date_time"],
            errors="coerce"
        )

        df["Hora"] = df["date_time"].dt.strftime(
            "%Y-%m-%d %H:00"
        )

        operaciones_hora = (
            df.groupby("Hora")
            .size()
            .reset_index(name="Cantidad")
        )

        st.line_chart(
            operaciones_hora,
            x="Hora",
            y="Cantidad"
        )

        # =========================
        # INTERPRETACIÓN
        # =========================

        st.subheader("Interpretación de resultados")

        st.write(
            f"""
            Se han registrado **{total_operaciones} operaciones** sobre el dispositivo ESP32.
            De ellas, **{encendidos} corresponden a encendidos**,
            **{apagados} a apagados** y
            **{consultas_estado} a consultas de estado**.

            El foco se encuentra actualmente en estado **{estado_actual}**.

            El tiempo total registrado de funcionamiento del foco es de
            **{tiempo_total_funcionamiento:.2f} segundos**.
            """
        )

    else:

        st.warning(
            "No existen datos suficientes para realizar la analítica."
        )

except requests.exceptions.ConnectionError:

    st.error(
        "No se pudo conectar con el backend."
    )

    st.info(
        "Verifica que FastAPI esté ejecutándose en http://127.0.0.1:8000"
    )

except Exception as e:

    st.error(
        "Ocurrió un error al cargar el dashboard."
    )

    st.code(
        str(e)
    )
