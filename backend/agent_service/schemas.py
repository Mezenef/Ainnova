from typing import Any, Literal

from pydantic import BaseModel, Field, model_validator


Platform = Literal[
    "linkedin",
    "x",
    "instagram",
    "blog",
    "email",
]

Language = Literal["tr", "en"]

AgentStatus = Literal[
    "pending",
    "running",
    "completed",
    "failed",
]


class ContentGenerationRequest(BaseModel):
    """AI içerik üretimi için kullanıcıdan alınan veriler."""

    brand_name: str = Field(
        min_length=1,
        max_length=150,
    )

    vertical: str = Field(
        min_length=1,
        max_length=150,
    )

    brief: str = Field(
        min_length=10,
        max_length=5000,
    )

    platform: Platform

    language: Language

    tone: str = Field(
        default="professional",
        min_length=1,
        max_length=150,
    )

    target_audience: str | None = Field(
        default=None,
        max_length=300,
    )


class CampaignPlan(BaseModel):
    """Campaign Planner Agent tarafından oluşturulan plan."""

    objective: str = Field(
        description=(
            "Kampanyanın temel amacı. Örneğin marka bilinirliği, etkileşim, bilgilendirme veya dönüşüm."
        )
    )

    target_audience: str = Field(
        description="İçeriğin hitap edeceği hedef kitle."
    )

    platform: Platform

    content_type: str = Field(
        description=(
            "Üretilecek içerik türü. Örneğin linkedin_post, email veya blog_outline."
        )
    )

    tone: str = Field(
        description="İçerikte kullanılacak iletişim tonu."
    )

    key_messages: list[str] = Field(
        min_length=1,
        description=(
            "İçerikte vurgulanması gereken temel mesajlar."
        ),
    )

    cta_strategy: str = Field(
        description=(
            "Kullanıcıyı yönlendirecek CTA yaklaşımı."
        )
    )

    constraints: list[str] = Field(
        default_factory=list,
        description=(
            "İçerik üretiminde uyulması gereken sınırlamalar."
        ),
    )


class GeneratedContent(BaseModel):
    """Content Generator tarafından üretilen yapılandırılmış içerik."""

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
            "Kaynak gerektiren, doğrulanamayan veya riskli iddialar hakkındaki uyarılar."
        ),
    )


class ReviewResult(BaseModel):
    """Brand Reviewer Agent tarafından oluşturulan inceleme sonucu."""

    approved: bool = Field(
        description=(
            "İçerik kullanıma uygunsa true, revizyon gerekiyorsa false."
        )
    )

    requires_revision: bool = Field(
        description=(
            "İçeriğin yeniden üretilmesi gerekip gerekmediği."
        )
    )

    feedback: list[str] = Field(
        default_factory=list,
        description=(
            "Content Generator için uygulanabilir revizyon veya geliştirme notları."
        ),
    )

    warnings: list[str] = Field(
        default_factory=list,
        description=(
            "İnsan kontrolü, kaynak doğrulaması veya risk değerlendirmesi gereken noktalar."
        ),
    )

    @model_validator(mode="after")
    def validate_review_decision(self) -> "ReviewResult":
        if self.approved == self.requires_revision:
            raise ValueError(
                "approved ve requires_revision alanları birbirinin tersi olmalıdır."
            )

        return self


class ContentArtifact(BaseModel):
    """Agent tarafından üretilen ve kullanıcıya döndürülen çıktı."""

    type: str
    title: str
    content: GeneratedContent


class ImageArtifact(BaseModel):
    """Görsel üretim ajanı tarafından oluşturulan görsel çıktısı."""

    type: str
    title: str
    file_path: str
    mime_type: str


class AgentStep(BaseModel):
    """Agent akışındaki tek bir çalışma adımı."""

    agent: str
    status: AgentStatus
    message: str | None = None

    attempt: int = Field(
        default=1,
        ge=1,
    )


class TokenUsage(BaseModel):
    """Bütün agent çağrılarının toplam token kullanımı."""

    input_tokens: int = Field(
        default=0,
        ge=0,
    )

    output_tokens: int = Field(
        default=0,
        ge=0,
    )

    def add(self, other: "TokenUsage") -> "TokenUsage":
        return TokenUsage(
            input_tokens=self.input_tokens + other.input_tokens,
            output_tokens=self.output_tokens + other.output_tokens,
        )


class AgentError(BaseModel):
    """Agent çalışması sırasında oluşan kontrollü hata."""

    agent: str
    message: str
    error_type: str | None = None
    retryable: bool = False


class AgentResponse(BaseModel):
    """Agent sisteminin Django backend'e döndüreceği ortak cevap."""

    session_id: str | None = None
    agent_run_id: str | None = None

    status: Literal["completed", "failed"]

    message: str

    campaign_plan: CampaignPlan | None = None
    review_result: ReviewResult | None = None

    artifacts: list[ContentArtifact | ImageArtifact] = Field(
        default_factory=list,
    )

    sources: list[dict[str, Any]] = Field(
        default_factory=list,
    )

    steps: list[AgentStep] = Field(
        default_factory=list,
    )

    errors: list[AgentError] = Field(
        default_factory=list,
    )

    usage: TokenUsage = Field(
        default_factory=TokenUsage,
    )