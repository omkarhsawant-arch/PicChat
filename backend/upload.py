import os
import uuid
from werkzeug.utils import secure_filename


ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}


def save_uploaded_image(image, upload_folder):

    if image is None:
        raise ValueError("No image provided.")

    if image.filename == "":
        raise ValueError("No image selected.")

    filename = secure_filename(image.filename)

    if not filename or "." not in filename:
        raise ValueError("Image must have a valid filename.")

    extension = filename.rsplit(".", 1)[1].lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise ValueError("Only PNG, JPG, JPEG, GIF, and WEBP images are supported.")

    if image.mimetype and not image.mimetype.startswith("image/"):
        raise ValueError("The uploaded file must be an image.")

    image_id = str(uuid.uuid4())

    saved_filename = f"{image_id}_{filename}"

    os.makedirs(upload_folder, exist_ok=True)

    image.save(os.path.join(upload_folder, saved_filename))

    return image_id, saved_filename
