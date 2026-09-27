import os

from flask import Flask, request, jsonify
from flask_cors import CORS

from backend.upload import save_uploaded_image
from backend.ai_api import ask_gemini
from backend.database import (
    create_tables,
    create_chat,
    get_all_chats,
    get_chat_messages,
    chat_exists,
    delete_chat,
    update_chat_title
)

app = Flask(__name__)

CORS(app)




create_tables()




UPLOAD_FOLDER = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "uploads"
)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER


# -----------------------------
# Health check
# -----------------------------

@app.route("/health", methods=["GET"])
def health():

    return jsonify({
        "status": "success",
        "message": "PicChat backend is running!"
    })


# -----------------------------
# Create a new chat
# -----------------------------

@app.route("/new-chat", methods=["POST"])
def new_chat():

    try:

        data = request.get_json()

        title = data.get("title", "New Chat")

        chat_id = create_chat(title)

        return jsonify({
            "status": "success",
            "chat_id": chat_id,
            "title": title
        }), 201

    except Exception as error:

        print("NEW CHAT ERROR:", error)

        return jsonify({
            "status": "error",
            "message": "Could not create chat."
        }), 500




@app.route("/chats", methods=["GET"])
def chats():

    try:

        all_chats = get_all_chats()

        chat_list = []

        for chat in all_chats:

            chat_list.append({
                "id": chat[0],
                "title": chat[1],
                "created_at": chat[2]
            })

        return jsonify({
            "status": "success",
            "chats": chat_list
        }), 200

    except Exception as error:

        print("GET CHATS ERROR:", error)

        return jsonify({
            "status": "error",
            "message": "Could not retrieve chats."
        }), 500


@app.route("/chats/<int:chat_id>", methods=["GET"])
def get_chat(chat_id):

    try:

        if not chat_exists(chat_id):

            return jsonify({
                "status": "error",
                "message": "Chat not found."
            }), 404

        messages = get_chat_messages(chat_id)

        message_list = []

        for message in messages:

            message_list.append({
                "role": message[0],
                "message": message[1],
                "created_at": message[2]
            })

        return jsonify({
            "status": "success",
            "chat_id": chat_id,
            "messages": message_list
        }), 200

    except Exception as error:

        print("GET CHAT ERROR:", error)

        return jsonify({
            "status": "error",
            "message": "Could not retrieve chat."
        }), 500

@app.route("/chats/<int:chat_id>", methods=["DELETE"])
def remove_chat(chat_id):

    try:

        if not chat_exists(chat_id):

            return jsonify({
                "status": "error",
                "message": "Chat not found."
            }), 404

        delete_chat(chat_id)

        return jsonify({
            "status": "success",
            "message": "Chat deleted successfully.",
            "chat_id": chat_id
        }), 200

    except Exception as error:

        print("DELETE CHAT ERROR:", error)

        return jsonify({
            "status": "error",
            "message": "Could not delete chat."
        }), 500

@app.route("/chats/<int:chat_id>", methods=["PUT"])
def update_title(chat_id):

    try:

        if not chat_exists(chat_id):

            return jsonify({
                "status": "error",
                "message": "Chat not found."
            }), 404

        data = request.get_json()

        title = data.get("title")

        if not title:

            return jsonify({
                "status": "error",
                "message": "Title is required."
            }), 400

        update_chat_title(chat_id, title)

        return jsonify({
            "status": "success",
            "message": "Chat title updated successfully.",
            "chat_id": chat_id,
            "title": title
        }), 200

    except Exception as error:

        print("UPDATE TITLE ERROR:", error)

        return jsonify({
            "status": "error",
            "message": "Could not update chat title."
        }), 500



@app.route("/upload", methods=["POST"])
def upload_image():

    try:

        image = request.files.get("image")

        image_id, filename = save_uploaded_image(
            image,
            app.config["UPLOAD_FOLDER"]
        )

        return jsonify({
            "status": "success",
            "message": "Image uploaded successfully.",
            "image_id": image_id,
            "filename": filename
        }), 200

    except ValueError as error:

        return jsonify({
            "status": "error",
            "message": str(error)
        }), 400

    except Exception as error:

        print("UPLOAD ERROR:", error)

        return jsonify({
            "status": "error",
            "message": "Something went wrong while uploading the image."
        }), 500




@app.route("/ask", methods=["POST"])
def ask():

    try:

        question = request.form.get("question")
        chat_id = request.form.get("chat_id")
        learning_mode = request.form.get("learning_mode") == "true"

        if not question:

            return jsonify({
                "status": "error",
                "message": "Question is required."
            }), 400

        if not chat_id:

            return jsonify({
                "status": "error",
                "message": "Chat ID is required."
            }), 400

        chat_id = int(chat_id)

        image = request.files.get("image")

        image_path = None

        if image:

            image_id, filename = save_uploaded_image(
                image,
                app.config["UPLOAD_FOLDER"]
            )

            image_path = os.path.join(
                app.config["UPLOAD_FOLDER"],
                filename
            )

        answer = ask_gemini(
            chat_id,
            question,
            image_path,
            learning_mode
        )

        return jsonify({
            "status": "success",
            "answer": answer,
            "chat_id": chat_id
        }), 200

    except Exception as error:

        print("ASK ERROR:", error)

        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500


if __name__ == "__main__":
    app.run(debug=True)