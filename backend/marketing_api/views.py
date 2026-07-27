import csv
import logging
from datetime import date, timedelta
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import viewsets, permissions, status, views, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from .models import BrandProfile, Campaign, MarketingContent, NotificationPreference, UserProfile, ActivityLog
from .serializers import (
    BrandProfileSerializer,
    CampaignSerializer,
    MarketingContentSerializer,
    AgentCallbackSerializer,
    UserSerializer,
    NotificationPreferenceSerializer,
    TOTPVerifySerializer,
    TOTPDisableSerializer,
    TOTPLoginVerifySerializer,
    ActivityLogSerializer,
)
from .totp import (
    generate_totp_secret,
    get_totp_uri,
    generate_qr_code_base64,
    verify_totp_token,
    generate_backup_codes,
)
from agent_service.gemini_client import GeminiClient
from agent_service.schemas import ContentGenerationRequest

logger = logging.getLogger(__name__)


def get_client_ip(request):
    if not request:
        return None
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0]
    return request.META.get("REMOTE_ADDR")


def log_activity(user, action, details="", request=None):
    if user and user.is_authenticated:
        ActivityLog.objects.create(
            user=user,
            action=action,
            details=details,
            ip_address=get_client_ip(request)
        )


class StandardPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100


class BrandProfileViewSet(viewsets.ModelViewSet):
    serializer_class = BrandProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "vertical", "description"]
    ordering_fields = ["created_at", "name"]

    def get_queryset(self):
        return BrandProfile.objects.filter(owner=self.request.user, is_deleted=False)

    def perform_create(self, serializer):
        brand = serializer.save(owner=self.request.user)
        log_activity(self.request.user, "Marka Oluşturuldu", f"Marka: {brand.name}", self.request)



class CampaignViewSet(viewsets.ModelViewSet):
    serializer_class = CampaignSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "objective"]
    ordering_fields = ["created_at", "start_date", "name"]

    def get_queryset(self):
        queryset = Campaign.objects.filter(brand__owner=self.request.user, is_deleted=False)
        brand_id = self.request.query_params.get("brand_id")
        if brand_id:
            queryset = queryset.filter(brand_id=brand_id)
        return queryset

    def perform_create(self, serializer):
        campaign = serializer.save()
        log_activity(self.request.user, "Kampanya Oluşturuldu", f"Kampanya: {campaign.name}", self.request)


class MarketingContentViewSet(viewsets.ModelViewSet):
    serializer_class = MarketingContentSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["topic", "generated_text", "extra_info", "platform"]
    ordering_fields = ["created_at", "scheduled_at"]

    def get_queryset(self):
        # Otomatik Kurtarma: 5 dakikadan uzun süre GENERATING durumunda kalan içerikleri FAILED yap
        stuck_threshold = timezone.now() - timedelta(minutes=5)
        MarketingContent.objects.filter(
            campaign__brand__owner=self.request.user,
            status="GENERATING",
            updated_at__lt=stuck_threshold
        ).update(status="FAILED")

        include_deleted = self.request.query_params.get("include_deleted") == "true"
        queryset = MarketingContent.objects.filter(campaign__brand__owner=self.request.user)

        if not include_deleted:
            queryset = queryset.filter(is_deleted=False)

        campaign_id = self.request.query_params.get("campaign_id")
        if campaign_id:
            queryset = queryset.filter(campaign_id=campaign_id)

        platform = self.request.query_params.get("platform")
        if platform:
            queryset = queryset.filter(platform=platform.upper())

        status_param = self.request.query_params.get("status")
        if status_param:
            queryset = queryset.filter(status=status_param.upper())

        return queryset

    def perform_create(self, serializer):
        content = serializer.save()
        log_activity(self.request.user, "İçerik Görevi Oluşturuldu", f"Platform: {content.platform}, Konu: {content.topic}", self.request)

    @action(detail=True, methods=["post"])
    def restore(self, request, pk=None):
        try:
            content = MarketingContent.objects.get(pk=pk, campaign__brand__owner=request.user)
            content.restore()
            log_activity(request.user, "İçerik Geri Yüklendi", f"İçerik ID: {content.id}", request)
            return Response({"message": "İçerik başarıyla geri yüklendi.", "content": self.get_serializer(content).data})
        except MarketingContent.DoesNotExist:
            return Response({"error": "İçerik bulunamadı."}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=["get"], url_path="export-csv")
    def export_csv(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        response = HttpResponse(content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = 'attachment; filename="ainnova_icerik_takvimi.csv"'

        response.write('\ufeff')  # UTF-8 BOM for Excel compatibility
        writer = csv.writer(response)
        writer.writerow(["ID", "Kampanya", "Platform", "İçerik Tipi", "Konu", "Durum", "Planlanan Tarih", "Üretilen Metin"])

        for item in queryset:
            writer.writerow([
                item.id,
                item.campaign.name,
                item.get_platform_display(),
                item.get_content_type_display(),
                item.topic or "",
                item.get_status_display(),
                item.scheduled_at.strftime("%Y-%m-%d %H:%M") if item.scheduled_at else "",
                item.generated_text or "",
            ])

        log_activity(request.user, "İçerikler CSV Olarak Dışa Aktarıldı", f"Toplam Kayıt: {queryset.count()}", request)
        return response

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
        log_activity(request.user, "AI Ajan Tetiklendi", f"İçerik ID: {content.id}", request)

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
            language=content.language or "tr",
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
        first_name = (request.data.get("first_name") or "").strip()
        last_name = (request.data.get("last_name") or "").strip()
        email = (request.data.get("email") or "").strip().lower()
        password = request.data.get("password")

        if not first_name or not last_name or not email or not password:
            return Response({"error": "Ad, soyad, e-posta ve şifre gerekli."}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(email__iexact=email).exists():
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

        log_activity(user, "Hesap Oluşturuldu", f"E-posta: {email}", request)
        return Response({"message": "Kayıt başarılı."}, status=status.HTTP_201_CREATED)


class PasswordResetRequestAPIView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        if not email:
            return Response({"error": "E-posta gerekli."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(email__iexact=email)
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
        log_activity(user, "Şifre Sıfırlama İsteği", f"E-posta: {email}", request)
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
        log_activity(user, "Şifre Sıfırlandı", "", request)
        return Response({"message": "Şifre başarıyla sıfırlandı."})


class CustomTokenObtainPairView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email_or_username = (request.data.get("username") or request.data.get("email") or "").strip().lower()
        password = request.data.get("password")

        if not email_or_username or not password:
            return Response({"error": "Kullanıcı adı/e-posta ve şifre gerekli."}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(username=email_or_username, password=password)
        if not user:
            try:
                user_obj = User.objects.get(email__iexact=email_or_username)
                user = authenticate(username=user_obj.username, password=password)
            except User.DoesNotExist:
                user = None

        if not user:
            return Response({"detail": "No active account found with the given credentials"}, status=status.HTTP_401_UNAUTHORIZED)

        profile, _ = UserProfile.objects.get_or_create(user=user)

        if profile.is_totp_enabled:
            pre_auth_token = AccessToken()
            pre_auth_token["user_id"] = user.id
            pre_auth_token["pre_auth"] = True
            pre_auth_token.set_exp(lifetime=timedelta(minutes=5))

            log_activity(user, "Giriş 1. Aşama Başarılı (2FA Bekleniyor)", "", request)
            return Response({
                "totp_required": True,
                "pre_auth_token": str(pre_auth_token),
                "message": "İki Faktörlü Kimlik Doğrulama (2FA) kodu gerekli."
            }, status=status.HTTP_200_OK)

        refresh = RefreshToken.for_user(user)
        log_activity(user, "Kullanıcı Girişi Yapıldı", "", request)
        return Response({
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "totp_required": False
        }, status=status.HTTP_200_OK)


class TOTPSetupAPIView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)

        if not profile.totp_secret or not profile.is_totp_enabled:
            profile.totp_secret = generate_totp_secret()
            profile.save()

        otp_uri = get_totp_uri(profile.totp_secret, request.user.email)
        qr_code = generate_qr_code_base64(otp_uri)

        log_activity(request.user, "2FA Kurulumu Başlatıldı", "", request)
        return Response({
            "secret": profile.totp_secret,
            "otp_uri": otp_uri,
            "qr_code": qr_code,
            "is_totp_enabled": profile.is_totp_enabled
        })


class TOTPEnableAPIView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = TOTPVerifySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        code = serializer.validated_data["code"]
        profile, _ = UserProfile.objects.get_or_create(user=request.user)

        if not profile.totp_secret:
            return Response({"error": "Önce 2FA kurulumu başlatılmalıdır."}, status=status.HTTP_400_BAD_REQUEST)

        if verify_totp_token(profile.totp_secret, code):
            profile.is_totp_enabled = True
            backup_codes = generate_backup_codes()
            profile.backup_codes = backup_codes
            profile.save()

            log_activity(request.user, "2FA Aktifleştirildi", "", request)
            return Response({
                "message": "2FA (Zaman Tabanlı Tek Kullanımlık Şifre) başarıyla aktifleştirildi.",
                "is_totp_enabled": True,
                "backup_codes": backup_codes
            })

        return Response({"error": "Geçersiz 6 haneli doğrulama kodu."}, status=status.HTTP_400_BAD_REQUEST)


class TOTPDisableAPIView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = TOTPDisableSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        password = serializer.validated_data["password"]
        code = serializer.validated_data["code"]

        if not request.user.check_password(password):
            return Response({"error": "Mevcut şifreniz yanlış."}, status=status.HTTP_400_BAD_REQUEST)

        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        if not profile.is_totp_enabled:
            return Response({"error": "2FA zaten pasif durumda."}, status=status.HTTP_400_BAD_REQUEST)

        is_code_valid = verify_totp_token(profile.totp_secret, code) or (code.upper() in profile.backup_codes)

        if is_code_valid:
            profile.is_totp_enabled = False
            profile.totp_secret = None
            profile.backup_codes = []
            profile.save()

            log_activity(request.user, "2FA Devre Dışı Bırakıldı", "", request)
            return Response({"message": "2FA başarıyla devre dışı bırakıldı.", "is_totp_enabled": False})

        return Response({"error": "Geçersiz doğrulama kodu veya yedek kod."}, status=status.HTTP_400_BAD_REQUEST)


class TOTPLoginVerifyAPIView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = TOTPLoginVerifySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        token_str = serializer.validated_data["pre_auth_token"]
        code = serializer.validated_data["code"].strip()

        try:
            token = AccessToken(token_str)
            if not token.get("pre_auth"):
                return Response({"error": "Geçersiz doğrulama jetonu."}, status=status.HTTP_400_BAD_REQUEST)

            user_id = token.get("user_id")
            user = User.objects.get(pk=user_id)
        except Exception:
            return Response({"error": "Doğrulama jetonunun süresi dolmuş veya geçersiz."}, status=status.HTTP_400_BAD_REQUEST)

        profile, _ = UserProfile.objects.get_or_create(user=user)

        is_valid_totp = verify_totp_token(profile.totp_secret, code)
        is_valid_backup = False

        if not is_valid_totp and code.upper() in profile.backup_codes:
            is_valid_backup = True
            profile.backup_codes.remove(code.upper())
            profile.save()

        if is_valid_totp or is_valid_backup:
            refresh = RefreshToken.for_user(user)
            log_activity(user, "2FA ile Tam Giriş Yapıldı", "", request)
            return Response({
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "message": "Giriş başarılı."
            }, status=status.HTTP_200_OK)

        return Response({"error": "Geçersiz 2FA doğrulama kodu veya yedek kod."}, status=status.HTTP_400_BAD_REQUEST)


class ActivityLogAPIView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        logs = ActivityLog.objects.filter(user=request.user)[:50]
        serializer = ActivityLogSerializer(logs, many=True)
        return Response(serializer.data)