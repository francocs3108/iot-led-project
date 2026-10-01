from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

from database import get_connection
from mqtt_client import send_command, get_current_state

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

turned_on_at = None


def save_operation(
    action,
    state,
    duration_seconds=0
):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO operations
        (
            date_time,
            action,
            state,
            device,
            duration_seconds
        )
        VALUES (%s, %s, %s, %s, %s)
        """,
        (
            datetime.now(),
            action,
            state,
            "ESP32-Wokwi",
            duration_seconds
        )
    )

    conn.commit()

    cursor.close()
    conn.close()


@app.get("/")
def home():
    return {
        "message":
        "IoT LED API + PostgreSQL + MQTT + Wokwi"
    }


@app.get("/status")
def status():
    return {
        "device": "ESP32-Wokwi",
        "led": get_current_state()
    }


@app.post("/led/on")
def led_on():
    global turned_on_at

    try:
        state = send_command("ON")
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=str(e)
        )

    if state == "ON":
        turned_on_at = datetime.now()

    save_operation(
        "ON",
        state,
        0
    )

    return {
        "action": "ON",
        "status": state
    }


@app.post("/led/off")
def led_off():
    global turned_on_at

    now = datetime.now()

    try:
        state = send_command("OFF")
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=str(e)
        )

    duration = 0

    if turned_on_at is not None:
        duration = round(
            (now - turned_on_at).total_seconds(),
            2
        )

    save_operation(
        "OFF",
        state,
        duration
    )

    turned_on_at = None

    return {
        "action": "OFF",
        "status": state,
        "duration_seconds": duration
    }


@app.post("/led/status")
def led_status():
    try:
        state = send_command("STATUS")
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=str(e)
        )

    save_operation(
        "STATUS",
        state,
        0
    )

    return {
        "device": "ESP32-Wokwi",
        "led": state
    }


@app.get("/history")
def history():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT
            id,
            date_time,
            action,
            state,
            device,
            duration_seconds
        FROM operations
        ORDER BY date_time ASC
        """
    )

    operations = cursor.fetchall()

    cursor.close()
    conn.close()

    return operations
