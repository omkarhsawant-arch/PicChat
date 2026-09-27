from google import genai
from google.genai import types

from backend.config import GEMINI_API_KEY
from backend.prompts import create_image_prompt
from backend.conversation import add_message, get_history

import mimetypes


client = genai.Client(api_key=GEMINI_API_KEY)


def ask_gemini(
    chat_id,
    question,
    image_path=None,
    learning_mode=False
):

    # Get history for this specific chat
    history = get_history(chat_id)

    prompt = create_image_prompt(
        question,
        history,
        learning_mode
    )

    if image_path:

        with open(image_path, "rb") as f:
            image_bytes = f.read()

        mime_type, _ = mimetypes.guess_type(image_path)

        if mime_type is None:
            mime_type = "application/octet-stream"

        response = client.models.generate_content(
            model="gemini-3.5-flash-lite",
            contents=[
                prompt,
                types.Part.from_bytes(
                    data=image_bytes,
                    mime_type=mime_type
                )
            ]
        )

    else:

        response = client.models.generate_content(
            model="gemini-3.5-flash-lite",
            contents=prompt
        )

    answer = response.text

    # Save the conversation to the current chat
    add_message(chat_id, "user", question)
    add_message(chat_id, "assistant", answer)

    return answer