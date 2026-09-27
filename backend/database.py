import sqlite3

DATABASE = "chats.db"


def get_connection():
    return sqlite3.connect(DATABASE)


def create_tables():
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS chats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            chat_id INTEGER NOT NULL,
            role TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (chat_id) REFERENCES chats(id)
        )
    """)

    connection.commit()
    connection.close()


def create_chat(title):
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        "INSERT INTO chats (title) VALUES (?)",
        (title,)
    )

    chat_id = cursor.lastrowid

    connection.commit()
    connection.close()

    return chat_id


def save_message(chat_id, role, message):
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        INSERT INTO messages (chat_id, role, message)
        VALUES (?, ?, ?)
        """,
        (chat_id, role, message)
    )

    connection.commit()
    connection.close()

def get_all_chats():
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT id, title, created_at
        FROM chats
        ORDER BY created_at DESC
    """)

    chats = cursor.fetchall()

    connection.close()

    return chats

def chat_exists(chat_id):
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        "SELECT id FROM chats WHERE id = ?",
        (chat_id,)
    )

    chat = cursor.fetchone()

    connection.close()

    return chat is not None


def get_chat_messages(chat_id):
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT role, message, created_at
        FROM messages
        WHERE chat_id = ?
        ORDER BY id ASC
    """, (chat_id,))

    messages = cursor.fetchall()

    connection.close()

    return messages

def delete_chat(chat_id):
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        "DELETE FROM messages WHERE chat_id = ?",
        (chat_id,)
    )

    cursor.execute(
        "DELETE FROM chats WHERE id = ?",
        (chat_id,)
    )

    deleted = cursor.rowcount

    connection.commit()
    connection.close()

    return deleted > 0

def update_chat_title(chat_id, title):
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        UPDATE chats
        SET title = ?
        WHERE id = ?
        """,
        (title, chat_id)
    )

    connection.commit()
    connection.close()