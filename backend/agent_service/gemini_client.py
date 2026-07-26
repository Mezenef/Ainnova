import os
import random
import time

from dotenv import load_dotenv
from google import genai
from google.genai import types

from agent_service.prompts import (
    SYSTEM_PROMPT,
    build_content_prompt,
)
from agent_service.schemas import (
    AgentResponse,
    AgentStep,
    ContentArtifact,
    ContentGenerationRequest,
    GeneratedContent,
    TokenUsage,
)


load_dotenv()


class GeminiClient:
    """Gemini API üzerinden içerik üreten istemci."""

    def __init__(self) -> None:
        api_key = os.getenv("GEMINI_API_KEY")

        if not api_key:
            raise ValueError(
                "GEMINI_API_KEY bulunamadı. "
                "Proje kökündeki .env dosyasını kontrol et."
            )

        self.client = genai.Client(
            api_key=api_key,
            http_options=types.HttpOptions(
                timeout=30_000,
            ),
        )

    def generate_content(
        self,
        request: ContentGenerationRequest,
    ) -> AgentResponse:
        try:
            response = None
            last_error: Exception | None = None

            for attempt in range(2):
                print(f"Gemini isteği gönderiliyor. Deneme: {attempt + 1}")
                try:
                    response = (
                        self.client.models.generate_content(
                            model="gemini-3.1-flash-lite",
                            contents=build_content_prompt(
                                request
                            ),
                            config=types.GenerateContentConfig(
                                system_instruction=(
                                    SYSTEM_PROMPT
                                ),
                                response_mime_type=(
                                    "application/json"
                                ),
                                response_schema=(
                                    GeneratedContent
                                ),
                            ),
                        )
                    )
                    break

                except Exception as exc:
                    last_error = exc
                    error_message = str(exc)

                    is_temporary_error = any(
                        value.lower() in error_message.lower()
                        for value in (
                            "429",
                            "500",
                            "502",
                            "503",
                            "504",
                            "unavailable",
                            "resource_exhausted",
                            "server disconnected",
                            "remoteprotocolerror",
                            "connection reset",
                            "connection error",
                            "timeout",
                            "timed out",
                        )
                    )

                    if not is_temporary_error:
                        raise

                    if attempt == 1:
                        raise

                    delay = (
                        2**attempt
                    ) + random.uniform(0, 1)

                    time.sleep(delay)

            if response is None:
                raise RuntimeError(
                    "Gemini isteği tamamlanamadı: "
                    f"{last_error}"
                )

            generated_text = (
                response.text or ""
            ).strip()

            if not generated_text:
                raise RuntimeError(
                    "Gemini boş cevap döndürdü."
                )

            generated_content = (
                GeneratedContent.model_validate_json(
                    generated_text
                )
            )

            usage_metadata = response.usage_metadata

            input_tokens = (
                getattr(
                    usage_metadata,
                    "prompt_token_count",
                    0,
                )
                or 0
            )

            output_tokens = (
                getattr(
                    usage_metadata,
                    "candidates_token_count",
                    0,
                )
                or 0
            )

            return AgentResponse(
                status="completed",
                message="İçerik başarıyla üretildi.",
                artifacts=[
                    ContentArtifact(
                        type=(
                            f"{request.platform}_content"
                        ),
                        title=generated_content.title,
                        content=generated_content,
                    )
                ],
                sources=[],
                steps=[
                    AgentStep(
                        agent="content_generator",
                        status="completed",
                    )
                ],
                usage=TokenUsage(
                    input_tokens=input_tokens,
                    output_tokens=output_tokens,
                ),
            )

        except Exception as exc:
            return AgentResponse(
                status="failed",
                message=(
                    "İçerik üretimi başarısız oldu: "
                    f"{exc}"
                ),
                artifacts=[],
                sources=[],
                steps=[
                    AgentStep(
                        agent="content_generator",
                        status="failed",
                    )
                ],
                usage=TokenUsage(
                    input_tokens=0,
                    output_tokens=0,
                ),
            )