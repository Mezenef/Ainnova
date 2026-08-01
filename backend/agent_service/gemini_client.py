import os
import random
import time

from dotenv import load_dotenv
from google import genai
from google.genai import types

from agent_service.prompts import (
    SYSTEM_PROMPT,
    build_content_prompt,
    build_revision_prompt,
)
from agent_service.schemas import (
    AgentResponse,
    AgentStep,
    CampaignPlan,
    ContentArtifact,
    ContentGenerationRequest,
    GeneratedContent,
    TokenUsage,
)


load_dotenv()


class GeminiClient:
    """Gemini API üzerinden içerik üreten ve revize eden istemci."""

    def __init__(self) -> None:
        api_key = os.getenv("GEMINI_API_KEY")

        if not api_key:
            raise ValueError(
                "GEMINI_API_KEY bulunamadı. "
                "Proje kökündeki .env dosyasını kontrol et."
            )

        self.model_name = os.getenv(
            "GEMINI_MODEL",
            "gemini-3.1-flash-lite",
        )

        self.client = genai.Client(
            api_key=api_key,
            http_options=types.HttpOptions(
                timeout=30_000,
            ),
        )

    @staticmethod
    def _is_temporary_error(exc: Exception) -> bool:
        error_message = str(exc).lower()

        return any(
            value in error_message
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

    @staticmethod
    def _extract_usage(
        response: object,
    ) -> TokenUsage:
        usage_metadata = getattr(
            response,
            "usage_metadata",
            None,
        )

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

        return TokenUsage(
            input_tokens=input_tokens,
            output_tokens=output_tokens,
        )

    def _generate_structured_content(
        self,
        prompt: str,
        operation_name: str,
    ) -> tuple[GeneratedContent, TokenUsage]:
        response = None
        last_error: Exception | None = None

        for attempt in range(2):
            print(
                f"{operation_name} gönderiliyor. "
                f"Deneme: {attempt + 1}"
            )

            try:
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=SYSTEM_PROMPT,
                        response_mime_type="application/json",
                        response_schema=GeneratedContent,
                    ),
                )
                break

            except Exception as exc:
                last_error = exc

                if not self._is_temporary_error(exc):
                    raise

                if attempt == 1:
                    raise

                delay = (
                    2**attempt
                ) + random.uniform(0, 1)

                time.sleep(delay)

        if response is None:
            raise RuntimeError(
                f"{operation_name} tamamlanamadı: "
                f"{last_error}"
            )

        generated_text = (
            response.text or ""
        ).strip()

        if not generated_text:
            raise RuntimeError(
                f"{operation_name} sırasında "
                "Gemini boş cevap döndürdü."
            )

        generated_content = (
            GeneratedContent.model_validate_json(
                generated_text
            )
        )

        usage = self._extract_usage(response)

        return generated_content, usage

    def generate_content(
        self,
        request: ContentGenerationRequest,
        campaign_plan: CampaignPlan | None = None,
    ) -> AgentResponse:
        try:
            generated_content, usage = (
                self._generate_structured_content(
                    prompt=build_content_prompt(
                        request=request,
                        campaign_plan=campaign_plan,
                    ),
                    operation_name="Gemini içerik isteği",
                )
            )

            return AgentResponse(
                status="completed",
                message="İçerik başarıyla üretildi.",
                campaign_plan=campaign_plan,
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
                        message=(
                            "Kampanya planına uygun içerik üretildi."
                        ),
                        attempt=1,
                    )
                ],
                usage=usage,
            )

        except Exception as exc:
            return AgentResponse(
                status="failed",
                campaign_plan=campaign_plan,
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
                        message=(
                            "İlk içerik üretimi tamamlanamadı."
                        ),
                        attempt=1,
                    )
                ],
                usage=TokenUsage(),
            )

    def revise_content(
        self,
        request: ContentGenerationRequest,
        campaign_plan: CampaignPlan,
        generated_content: GeneratedContent,
        review_feedback: list[str],
        review_warnings: list[str],
    ) -> AgentResponse:
        try:
            revised_content, usage = (
                self._generate_structured_content(
                    prompt=build_revision_prompt(
                        request=request,
                        campaign_plan=campaign_plan,
                        generated_content=generated_content,
                        review_feedback=review_feedback,
                        review_warnings=review_warnings,
                    ),
                    operation_name=(
                        "Gemini içerik revizyon isteği"
                    ),
                )
            )

            return AgentResponse(
                status="completed",
                message="İçerik başarıyla revize edildi.",
                campaign_plan=campaign_plan,
                artifacts=[
                    ContentArtifact(
                        type=(
                            f"{request.platform}_content"
                        ),
                        title=revised_content.title,
                        content=revised_content,
                    )
                ],
                sources=[],
                steps=[
                    AgentStep(
                        agent="content_generator",
                        status="completed",
                        message=(
                            "Reviewer geri bildirimlerine göre içerik revize edildi."
                        ),
                        attempt=2,
                    )
                ],
                usage=usage,
            )

        except Exception as exc:
            return AgentResponse(
                status="failed",
                campaign_plan=campaign_plan,
                message=(
                    "İçerik revizyonu başarısız oldu: "
                    f"{exc}"
                ),
                artifacts=[],
                sources=[],
                steps=[
                    AgentStep(
                        agent="content_generator",
                        status="failed",
                        message=(
                            "İçerik revizyonu tamamlanamadı."
                        ),
                        attempt=2,
                    )
                ],
                usage=TokenUsage(),
            )

    def generate_image(
        self,
        brand_name: str,
        vertical: str,
        platform: str,
        tone: str,
        topic: str,
    ) -> tuple[bytes | None, str | None]:
        """
        Metin içeriğine dayanarak bir kampanya görseli üretir.
        Ücretsiz Pollinations.ai servisi kullanılır (API anahtarı gerektirmez).
        Başarılıysa (görsel_bytes, hata_yok) döner, başarısızsa (None, hata_mesaji).
        """
        import urllib.parse
        import requests

        prompt = (
            f"{topic}, marketing campaign photo for {brand_name} ({vertical}), "
            f"{tone} mood, professional photography, natural lighting, "
            f"no text, no logo, no watermark, realistic, sharp focus"
        )

        encoded_prompt = urllib.parse.quote(prompt)
        seed = abs(hash(topic)) % 100000
        url = (
            f"https://image.pollinations.ai/prompt/{encoded_prompt}"
            f"?width=1024&height=1024&nologo=true&seed={seed}&model=flux"
        )

        try:
            response = requests.get(url, timeout=60)
            if response.status_code == 200 and response.content:
                return response.content, None
            return None, f"Pollinations hata döndürdü: {response.status_code}"
        except Exception as exc:
            return None, str(exc)