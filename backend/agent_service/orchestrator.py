from uuid import uuid4

from agent_service.agents.planner_agent import PlannerAgent
from agent_service.agents.reviewer_agent import ReviewerAgent
from agent_service.gemini_client import GeminiClient
from agent_service.schemas import (
    AgentError,
    AgentResponse,
    AgentStep,
    ContentGenerationRequest,
    GeneratedContent,
    ImageArtifact,
    ReviewResult,
    TokenUsage,
)

from agent_service.image_client import GeminiImageClient
from agent_service.prompts import build_image_prompt


class AgentOrchestrator:
    """
    Campaign Planner, Content Generator ve Brand Reviewer adımlarını sırasıyla çalıştıran ana agent servisi.

    Reviewer gerekli görürse içerik yalnızca bir kez revize edilir.
    """

    def __init__(self) -> None:
        self.planner = PlannerAgent()
        self.content_generator = GeminiClient()
        self.reviewer = ReviewerAgent()
        self.image_generator = GeminiImageClient()

    def run(
        self,
        request: ContentGenerationRequest,
        session_id: str | None = None,
    ) -> AgentResponse:
        current_session_id = session_id or str(uuid4())
        agent_run_id = str(uuid4())

        steps: list[AgentStep] = []
        errors: list[AgentError] = []
        total_usage = TokenUsage()

        # -------------------------------------------------
        # 1. CAMPAIGN PLANNER
        # -------------------------------------------------

        planner_result = self.planner.run(request)

        steps.append(planner_result.step)

        total_usage = total_usage.add(
            planner_result.usage
        )

        if planner_result.error is not None:
            errors.append(planner_result.error)

        if planner_result.plan is None:
            return AgentResponse(
                session_id=current_session_id,
                agent_run_id=agent_run_id,
                status="failed",
                message=(
                    "Agent akışı durduruldu. "
                    "Kampanya planı oluşturulamadı."
                ),
                campaign_plan=None,
                review_result=None,
                artifacts=[],
                sources=[],
                steps=steps,
                errors=errors,
                usage=total_usage,
            )

        campaign_plan = planner_result.plan

        # -------------------------------------------------
        # 2. İLK İÇERİK ÜRETİMİ
        # -------------------------------------------------

        content_response = (
            self.content_generator.generate_content(
                request=request,
                campaign_plan=campaign_plan,
            )
        )

        steps.extend(content_response.steps)

        total_usage = total_usage.add(
            content_response.usage
        )

        errors.extend(content_response.errors)

        if (
            content_response.status == "failed"
            or not content_response.artifacts
        ):
            return AgentResponse(
                session_id=current_session_id,
                agent_run_id=agent_run_id,
                status="failed",
                message=(
                    "Kampanya planı oluşturuldu ancak içerik üretimi başarısız oldu."
                ),
                campaign_plan=campaign_plan,
                review_result=None,
                artifacts=[],
                sources=content_response.sources,
                steps=steps,
                errors=errors,
                usage=total_usage,
            )

        generated_content: GeneratedContent = (
            content_response.artifacts[0].content
        )

        final_artifacts = content_response.artifacts
        final_generated_content = generated_content
        final_sources = content_response.sources

        # -------------------------------------------------
        # 3. İLK BRAND REVIEWER KONTROLÜ
        # -------------------------------------------------

        first_review_result = self.reviewer.run(
            request=request,
            campaign_plan=campaign_plan,
            generated_content=generated_content,
            attempt_number=1,
        )

        steps.append(first_review_result.step)

        total_usage = total_usage.add(
            first_review_result.usage
        )

        if first_review_result.error is not None:
            errors.append(first_review_result.error)

        if first_review_result.review is None:
            return AgentResponse(
                session_id=current_session_id,
                agent_run_id=agent_run_id,
                status="failed",
                message=(
                    "İçerik üretildi ancak marka ve risk incelemesi tamamlanamadı."
                ),
                campaign_plan=campaign_plan,
                review_result=None,
                artifacts=final_artifacts,
                sources=final_sources,
                steps=steps,
                errors=errors,
                usage=total_usage,
            )

        final_review: ReviewResult = (
            first_review_result.review
        )

        # -------------------------------------------------
        # 4. GEREKİRSE TEK SEFERLİK REVİZYON
        # -------------------------------------------------

        if final_review.requires_revision:
            revision_response = (
                self.content_generator.revise_content(
                    request=request,
                    campaign_plan=campaign_plan,
                    generated_content=generated_content,
                    review_feedback=final_review.feedback,
                    review_warnings=final_review.warnings,
                )
            )

            steps.extend(revision_response.steps)

            total_usage = total_usage.add(
                revision_response.usage
            )

            errors.extend(revision_response.errors)

            if (
                revision_response.status == "failed"
                or not revision_response.artifacts
            ):
                return AgentResponse(
                    session_id=current_session_id,
                    agent_run_id=agent_run_id,
                    status="failed",
                    message=(
                        "İlk içerik üretildi ancak Reviewer geri bildirimlerine göre yapılması gereken revizyon tamamlanamadı."
                    ),
                    campaign_plan=campaign_plan,
                    review_result=final_review,
                    artifacts=final_artifacts,
                    sources=final_sources,
                    steps=steps,
                    errors=errors,
                    usage=total_usage,
                )

            revised_content: GeneratedContent = (
                revision_response.artifacts[0].content
            )

            final_artifacts = revision_response.artifacts
            final_generated_content = revised_content
            final_sources = revision_response.sources

            # ---------------------------------------------
            # 5. İKİNCİ VE SON REVIEWER KONTROLÜ
            # ---------------------------------------------

            second_review_result = self.reviewer.run(
                request=request,
                campaign_plan=campaign_plan,
                generated_content=revised_content,
                attempt_number=2,
            )

            steps.append(second_review_result.step)

            total_usage = total_usage.add(
                second_review_result.usage
            )

            if second_review_result.error is not None:
                errors.append(second_review_result.error)

            if second_review_result.review is None:
                return AgentResponse(
                    session_id=current_session_id,
                    agent_run_id=agent_run_id,
                    status="failed",
                    message=(
                        "İçerik revize edildi ancak son marka ve risk kontrolü tamamlanamadı."
                    ),
                    campaign_plan=campaign_plan,
                    review_result=final_review,
                    artifacts=final_artifacts,
                    sources=final_sources,
                    steps=steps,
                    errors=errors,
                    usage=total_usage,
                )

            final_review = second_review_result.review

        # -------------------------------------------------
        # 6. GÖRSEL ÜRETİMİ
        # -------------------------------------------------

        image_generated = False

        if final_review.approved:
            try:
                image_path, image_mime_type = (
                    self.image_generator.generate_image(
                        prompt=build_image_prompt(
                            request=request,
                            campaign_plan=campaign_plan,
                            generated_content=final_generated_content,
                        ),
                        platform=request.platform,
                    )
                )

                final_artifacts.append(
                    ImageArtifact(
                        type=f"{request.platform}_image",
                        title=(
                            f"{final_generated_content.title} görseli"
                        ),
                        file_path=image_path,
                        mime_type=image_mime_type,
                    )
                )

                image_generated = True

                steps.append(
                    AgentStep(
                        agent="image_generator",
                        status="completed",
                        message=(
                            "Onaylanan içeriğe uygun kampanya görseli üretildi."
                        ),
                        attempt=1,
                    )
                )

            except Exception as exc:
                errors.append(
                    AgentError(
                        agent="image_generator",
                        message=(
                            "Görsel üretimi başarısız oldu: "
                            f"{exc}"
                        ),
                        error_type=type(exc).__name__,
                        retryable=False,
                    )
                )

                steps.append(
                    AgentStep(
                        agent="image_generator",
                        status="failed",
                        message=(
                            "Metin tamamlandı ancak kampanya görseli üretilemedi."
                        ),
                        attempt=1,
                    )
                )

        # -------------------------------------------------
        # 7. SONUÇ
        # -------------------------------------------------

        if final_review.approved:
            was_revised = any(
                step.agent == "content_generator"
                and step.attempt == 2
                for step in steps
            )

            if was_revised and image_generated:
                response_message = (
                    "Kampanya planı oluşturuldu, içerik Reviewer "
                    "geri bildirimlerine göre bir kez revize edildi, "
                    "son kontrolden geçti ve kampanya görseli üretildi."
                )

            elif was_revised and not image_generated:
                response_message = (
                    "Kampanya planı oluşturuldu, içerik Reviewer "
                    "geri bildirimlerine göre bir kez revize edildi "
                    "ve son kontrolden geçti. Görsel üretimi tamamlanamadı."
                )

            elif image_generated:
                response_message = (
                    "Kampanya planı, içerik üretimi, marka incelemesi "
                    "ve kampanya görseli üretimi tamamlandı."
                )

            else:
                response_message = (
                    "Kampanya planı, içerik üretimi ve marka incelemesi "
                    "tamamlandı. Görsel üretimi tamamlanamadı."
                )

        else:
            response_message = (
                "İçerik bir kez revize edildi ancak son Reviewer "
                "kontrolünde hâlâ insan incelemesi gerektiren "
                "önemli sorunlar tespit edildi."
            )

        return AgentResponse(
            session_id=current_session_id,
            agent_run_id=agent_run_id,
            status="completed",
            message=response_message,
            campaign_plan=campaign_plan,
            review_result=final_review,
            artifacts=final_artifacts,
            sources=final_sources,
            steps=steps,
            errors=errors,
            usage=total_usage,
        )