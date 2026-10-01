import threading
import time
import paho.mqtt.client as mqtt

MQTT_BROKER = "broker.hivemq.com"
MQTT_PORT = 1883

TOPIC_COMMAND = "usil/iot-led/franco/command"
TOPIC_STATE = "usil/iot-led/franco/state"

current_state = "OFF"
state_event = threading.Event()


def on_connect(client, userdata, flags, reason_code, properties=None):
    print("MQTT conectado")

    client.subscribe(TOPIC_STATE)

    print(f"Suscrito a: {TOPIC_STATE}")


def on_message(client, userdata, msg):
    global current_state

    state = msg.payload.decode().strip().upper()

    if state in ["ON", "OFF"]:
        current_state = state
        state_event.set()

        print(f"Estado recibido desde Wokwi: {state}")


client = mqtt.Client(
    mqtt.CallbackAPIVersion.VERSION2
)

client.on_connect = on_connect
client.on_message = on_message

client.connect(
    MQTT_BROKER,
    MQTT_PORT,
    60
)

client.loop_start()


def send_command(command: str):
    global current_state

    state_event.clear()

    client.publish(
        TOPIC_COMMAND,
        command
    )

    print(f"Comando MQTT enviado: {command}")

    received = state_event.wait(timeout=5)

    if not received:
        raise Exception(
            "Wokwi no respondió al comando MQTT"
        )

    return current_state


def get_current_state():
    return current_state
