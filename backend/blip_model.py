import os
import torch
from PIL import Image
from transformers import BlipProcessor, BlipForConditionalGeneration, BlipForQuestionAnswering


class BLIPModelHandler:
    """
    Singleton wrapper for Salesforce BLIP models to handle
    Image Captioning and Visual Question Answering (VQA).
    """

    def __init__(self, caption_model_name="Salesforce/blip-image-captioning-base",
                 vqa_model_name="Salesforce/blip-vqa-base"):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        print(f"[BLIP] Using device: {self.device}")

        # Load Captioning Model & Processor
        print(f"[BLIP] Loading Captioning model: {caption_model_name}...")
        self.caption_processor = BlipProcessor.from_pretrained(caption_model_name)
        self.caption_model = BlipForConditionalGeneration.from_pretrained(
            caption_model_name
        ).to(self.device)

        # Load VQA Model & Processor (Optional direct visual QA support)
        print(f"[BLIP] Loading VQA model: {vqa_model_name}...")
        self.vqa_processor = BlipProcessor.from_pretrained(vqa_model_name)
        self.vqa_model = BlipForQuestionAnswering.from_pretrained(
            vqa_model_name
        ).to(self.device)

        print("[BLIP] All BLIP models loaded successfully!")

    def generate_caption(self, image_path: str, max_new_tokens: int = 75) -> str:
        """
        Generates a descriptive caption for the given image.
        """
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image not found at path: {image_path}")

        try:
            raw_image = Image.open(image_path).convert("RGB")
            
            # Unconditional captioning
            inputs = self.caption_processor(images=raw_image, return_tensors="pt").to(self.device)
            out = self.caption_model.generate(**inputs, max_new_tokens=max_new_tokens)
            caption = self.caption_processor.decode(out[0], skip_special_tokens=True)
            
            return caption
        except Exception as e:
            print(f"[BLIP Error] Caption generation failed: {e}")
            return "An error occurred while processing the image."

    def answer_visual_question(self, image_path: str, question: str) -> str:
        """
        Answers a specific direct question about the visual contents of the image.
        """
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image not found at path: {image_path}")

        try:
            raw_image = Image.open(image_path).convert("RGB")
            inputs = self.vqa_processor(images=raw_image, text=question, return_tensors="pt").to(self.device)
            out = self.vqa_model.generate(**inputs, max_new_tokens=30)
            answer = self.vqa_processor.decode(out[0], skip_special_tokens=True)
            
            return answer
        except Exception as e:
            print(f"[BLIP Error] VQA failed: {e}")
            return "Unable to answer question from image."


# Global instance for K and A to import directly
blip_handler = None


def get_blip_handler() -> BLIPModelHandler:
    """
    Returns or initializes the global BLIPModelHandler singleton.
    """
    global blip_handler
    if blip_handler is None:
        blip_handler = BLIPModelHandler()
    return blip_handler


def analyze_image(image_path: str) -> dict:
    """
    Main interface function for K's app.py or A's conversation pipeline.
    
    Returns:
        dict: {
            "status": "success",
            "caption": "A golden retriever sitting on grass",
            "image_path": image_path
        }
    """
    handler = get_blip_handler()
    caption = handler.generate_caption(image_path)
    
    return {
        "status": "success",
        "caption": caption,
        "image_path": image_path
    }