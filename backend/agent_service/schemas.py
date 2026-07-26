from typing import Literal

from pydantic import BaseModel, Field


class ContentGenerationRequest(BaseModel):
    """AI içerik üretimi için kullanıcıdan alınan veriler."""

    brand_name: str = Field(min_length=1, max_length=150)
    vertical: str = Field(min_length=1, max_length=150)
    brief: str = Field(min_length=10, max_length=5000)

    platform: Literal[
        "linkedin",
        "x",
        "instagram",
        "blog",
        "email",
    ]

    language: Literal["tr", "en"]

    tone: str = Field(
        default="professional",
        max_length=150,
    )

    target_audience: str | None = Field(
        default=None,
        max_length=300,
    )


class GeneratedContent(BaseModel):
    """Gemini modelinden beklenen yapılandırılmış içerik."""

    title: str = Field(
        description="İçeriğin kısa ve dikkat çekici başlığı."
    )

    body: str = Field(
        description="Seçilen platforma uygun ana içerik metni."
    )

    cta: str = Field(
        description="Kısa ve doğal harekete geçirici mesaj."
    )

    hashtags: list[str] = Field(
        default_factory=list,
        description="Platforma uygun hashtag listesi.",
    )

    warnings: list[str] = Field(
        default_factory=list,
        description=(
            "Kaynak gerektiren, doğrulanamayan veya "
            "riskli iddialar hakkındaki uyarılar."
        ),
    )


class ContentArtifact(BaseModel):
    type: str
    title: str
    content: GeneratedContent


class AgentStep(BaseModel):
    agent: str
    status: Literal[
        "pending",
        "running",
        "completed",
        "failed",
    ]


class TokenUsage(BaseModel):
    input_tokens: int = 0
    output_tokens: int = 0


class AgentResponse(BaseModel):
    status: Literal["completed", "failed"]
    message: str

    artifacts: list[ContentArtifact]

    sources: list[dict] = Field(
        default_factory=list,
    )

    steps: list[AgentStep]

    usage: TokenUsage = Field(
        default_factory=TokenUsage,
    )