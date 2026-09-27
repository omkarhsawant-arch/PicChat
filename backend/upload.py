import os
import uuid
from werkzeug.utils import secure_filename


def save_uploaded_image(image, upload_folder):

    if image is None:
        raise ValueError("No image provided.")

    if image.filename == "":
        raise ValueError("No image selected.")

    filename = secure_filename(image.filename)

    image_id = str(uuid.uuid4())

    saved_filename = f"{image_id}_{filename}"

    os.makedirs(upload_folder, exist_ok=True)

    image.save(os.path.join(upload_folder, saved_filename))

    return image_id, saved_filename