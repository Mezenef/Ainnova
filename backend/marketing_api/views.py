import logging
from datetime import date, timedelta
from rest_framework import viewsets, permissions, status, views
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from .models import BrandProfile, Campaign, MarketingContent, NotificationPreference
from .serializers import (
    BrandProfileSerializer,
    CampaignSerializer,
    MarketingContentSerializer,
    AgentCallbackSerializer,
    UserSerializer,
    NotificationPreferenceSerializer,
)
from agent_service.gemini_client import GeminiClient
from agent_service.schemas import ContentGenerationRequest

logger = logging.getLogger(__name__)

class BrandProfileViewSet(viewsets.ModelViewSet):
    serializer_class = BrandProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return BrandProfile.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class CampaignViewSet(viewsets.ModelViewSet):
    serializer_class = CampaignSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Campaign.objects.filter(brand__owner=self.request.user)
        brand_id = self.request.query_params.get("brand_id")
        if brand_id:
            queryset = queryset.filter(brand_id=brand_id)
        return queryset


class MarketingContentViewSet(viewsets.ModelViewSet):
    serializer_class = MarketingContentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = MarketingContent.objects.filter(campaign__brand__owner=self.request.user)
        campaign_id = self.request.query_params.get("campaign_id")
        if campaign_id:
            queryset = queryset.filter(campaign_id=campaign_id)
        return queryset

    @action(detail=True, methods=["post"], url_path="trigger-agent")
    def trigger_agent(self, request, pk=None):
        content = self.get_object()

        if content.status in ["GENERATING", "PUBLISHED"]:
            return Response(
                {"error": f"İçerik şu an tetiklenemez. Mevcut durum: {content.get_status_display()}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        content.status = "GENERATING"
        content.save()

        platform_map = {
            "LINKEDIN": "linkedin",
            "X": "x",
            "INSTAGRAM": "instagram",
            "BLOG": "blog",
            "EMAIL": "email",
            "FACEBOOK": "instagram",
            "GOOGLE_ADS": "blog",
            "META_ADS": "instagram",
        }

        uzunluk_talimati = {
            "kisa": "İçerik kısa ve öz olsun (2-3 cümle).",
            "orta": "İçerik orta uzunlukta olsun (1-2 paragraf).",
            "uzun": "İçerik detaylı ve uzun olsun (3+ paragraf).",
        }

        brief = content.topic or ""
        if content.extra_info:
            brief = f"{brief}\n\n{content.extra_info}"
        if content.length in uzunluk_talimati:
            brief = f"{brief}\n\n{uzunluk_talimati[content.length]}"
        if len(brief) < 10:
            brief = f"{brief} (detay belirtilmedi, marka bilgisine göre üret)"

        agent_request = ContentGenerationRequest(
            brand_name=content.campaign.brand.name,
            vertical=content.campaign.brand.vertical,
            brief=brief,
            platform=platform_map.get(content.platform, "blog"),
            language="tr",
            tone=content.tone or "professional",
            target_audience=content.campaign.brand.target_audience,
        )

        try:
            client = GeminiClient()
            agent_response = client.generate_content(agent_request)
        except Exception as exc:
            content.status = "FAILED"
            content.save()
            logger.error(f"Ajan çağrısı başarısız: {exc}")
            return Response(
                {"error": f"Ajan çağrısı başarısız oldu: {exc}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        if agent_response.status == "completed" and agent_response.artifacts:
            generated = agent_response.artifacts[0].content
            metin_parcalari = [generated.body]
            if generated.cta:
                metin_parcalari.append(generated.cta)
            if generated.hashtags:
                metin_parcalari.append(" ".join(f"#{h}" for h in generated.hashtags))

            content.generated_text = "\n\n".join(metin_parcalari)
            content.status = "READY"
            hashtag_listesi = generated.hashtags
        else:
            content.status = "FAILED"
            hashtag_listesi = []
            logger.error(f"Ajan üretimi başarısız: {agent_response.message}")

        content.save()

        serializer = self.get_serializer(content)
        return Response(
            {
                "message": agent_response.message,
                "content": serializer.data,
                "hashtags": hashtag_listesi,
            },
            status=status.HTTP_200_OK
        )


class AgentCallbackAPIView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = AgentCallbackSerializer(data=request.data)
        if serializer.is_valid():
            content = serializer.save()
            logger.info(f"Ajan callback başarılı. İçerik ID: {content.id}, Yeni Durum: {content.status}")

            content_serializer = MarketingContentSerializer(content)
            return Response(
                {
                    "message": "İçerik durumu ajan tarafından başarıyla güncellendi.",
                    "content": content_serializer.data
                },
                status=status.HTTP_200_OK
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MeAPIView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class NotificationPreferenceAPIView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        pref, _ = NotificationPreference.objects.get_or_create(user=request.user)
        serializer = NotificationPreferenceSerializer(pref)
        return Response(serializer.data)

    def put(self, request):
        pref, _ = NotificationPreference.objects.get_or_create(user=request.user)
        serializer = NotificationPreferenceSerializer(pref, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordChangeAPIView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        eski_sifre = request.data.get("eski_sifre")
        yeni_sifre = request.data.get("yeni_sifre")

        if not eski_sifre or not yeni_sifre:
            return Response({"error": "Eski ve yeni şifre gerekli."}, status=status.HTTP_400_BAD_REQUEST)

        if not request.user.check_password(eski_sifre):
            return Response({"error": "Mevcut şifre yanlış."}, status=status.HTTP_400_BAD_REQUEST)

        if len(yeni_sifre) < 6:
            return Response({"error": "Yeni şifre en az 6 karakter olmalı."}, status=status.HTTP_400_BAD_REQUEST)

        request.user.set_password(yeni_sifre)
        request.user.save()
        return Response({"message": "Şifre başarıyla güncellendi."})


class RegisterAPIView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        first_name = request.data.get("first_name")
        last_name = request.data.get("last_name")
        email = request.data.get("email")
        password = request.data.get("password")

        if not first_name or not last_name or not email or not password:
            return Response({"error": "Ad, soyad, e-posta ve şifre gerekli."}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(email=email).exists():
            return Response({"error": "Bu e-posta zaten kayıtlı."}, status=status.HTTP_400_BAD_REQUEST)
        if len(password) < 6:
            return Response({"error": "Şifre en az 6 karakter olmalı."}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(
            username=email,
            email=email,
            first_name=first_name,
            last_name=last_name,
            password=password,
        )

        brand = BrandProfile.objects.create(
            owner=user,
            name=f"{first_name} {last_name}",
            vertical="Genel",
            target_audience="Belirtilmedi",
            brand_voice="Profesyonel",
        )
        Campaign.objects.create(
            brand=brand,
            name="İlk Kampanyam",
            objective="Genel içerik üretimi",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=90),
        )

        return Response({"message": "Kayıt başarılı."}, status=status.HTTP_201_CREATED)


class PasswordResetRequestAPIView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get("email")
        if not email:
            return Response({"error": "E-posta gerekli."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"message": "Eğer bu e-posta kayıtlıysa, sıfırlama linki gönderildi."})

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        reset_link = f"http://localhost:5173/sifre-sifirla?uid={uid}&token={token}"

        send_mail(
            subject="Ainnova - Şifre Sıfırlama",
            message=f"Şifrenizi sıfırlamak için bu linke tıklayın: {reset_link}",
            from_email=None,
            recipient_list=[email],
        )
        return Response({"message": "Eğer bu e-posta kayıtlıysa, sıfırlama linki gönderildi."})


class PasswordResetConfirmAPIView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        uid = request.data.get("uid")
        token = request.data.get("token")
        yeni_sifre = request.data.get("yeni_sifre")

        if not uid or not token or not yeni_sifre:
            return Response({"error": "Eksik bilgi."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user_pk = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_pk)
        except (User.DoesNotExist, ValueError, TypeError):
            return Response({"error": "Geçersiz bağlantı."}, status=status.HTTP_400_BAD_REQUEST)
        if not default_token_generator.check_token(user, token):
            return Response({"error": "Bağlantının süresi dolmuş ya da geçersiz."}, status=status.HTTP_400_BAD_REQUEST)
        if len(yeni_sifre) < 6:
            return Response({"error": "Yeni şifre en az 6 karakter olmalı."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(yeni_sifre)
        user.save()
        return Response({"message": "Şifre başarıyla sıfırlandı."})