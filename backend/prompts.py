def create_image_prompt(question, history):
    conversation_text = ""

    for message in history:
        role = message["role"]
        content = message["message"]

        conversation_text += f"{role.capitalize()}: {content}\n"

    return f"""
You are an intelligent image analysis assistant.

Answer the user's question based only on what you can determine
from the provided image.

If the answer cannot be determined from the image, clearly say
that you cannot determine it.

Previous conversation:
{conversation_text}

Current user question:
{question}
"""