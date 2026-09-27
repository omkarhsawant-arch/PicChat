from backend.database import (
    create_chat,
    save_message,
    get_chat_messages
)


def start_new_chat(title):
    return create_chat(title)


def add_message(chat_id, role, message):
    save_message(chat_id, role, message)


def get_history(chat_id):
    messages = get_chat_messages(chat_id)

    history = []

    for role, message, created_at in messages:
        history.append({
            "role": role,
            "message": message
        })

    return history