import os

from flask import Flask, request, jsonify
from flask_cors import CORS

from upload import save_uploaded_image


app = Flask(__name__)

CORS(app)



UPLOAD_FOLDER = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "uploads"
)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "success",
        "message": "PicChart backend is running!"
    })


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


if __name__ == "__main__":
    app.run(debug=True)