from dotenv import load_dotenv
from google import genai
from google.genai import types
import os

load_dotenv()

api_key=os.getenv("GEMINI_API_KEY")

client = genai.Client(api_key=api_key)

with open("uploads/eagle.jpg", "rb") as f:
    image_bytes = f.read()

response = client.models.generate_content(
    model="gemini-3.5-flash-lite",
    contents=[
        "Describe this image. Tell me what objects, people, and important details you can see.",
        types.Part.from_bytes(
            data=image_bytes,
            mime_type="image/jpeg"
        )
    ]
)

print("\nGemini's response:")
print(response.text)