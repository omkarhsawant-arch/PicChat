from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)

CORS(app)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "success",
        "message": "VisionChat backend is running!"
    })


if __name__ == "__main__":
    app.run(debug=True)