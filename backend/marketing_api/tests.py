from unittest.mock import patch, MagicMock
from django.urls import reverse
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status
from .models import BrandProfile, Campaign, MarketingContent


class AinnovaAPITests(APITestCase):
    def setUp(self):
        # Test kullanıcısı oluştur ve giriş yap (JWT bypass etmek için force_authenticate kullanıyoruz)
        self.user = User.objects.create_user(username="testuser", password="testpassword")
        self.client.force_authenticate(user=self.user)
        
        # Test verileri oluştur
        self.brand = BrandProfile.objects.create(
            owner=self.user,
            name="Ainnova Tech",
            vertical="Pazarlama Teknolojileri",
            target_audience="Dijital Pazarlama Uzmanları ve Ajanslar",
            brand_voice="Yenilikçi ve Profesyonel",
            description="Yapay zeka tabanlı dijital pazarlama platformu"
        )
        
        self.campaign = Campaign.objects.create(
            brand=self.brand,
            name="Lansman Kampanyası",
            objective="Ainnova pazarlama araçlarının sektöre tanıtılması ve marka bilinirliği",
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + timezone.timedelta(days=30),
            budget=5000.00,
            status="DRAFT"
        )
        
        self.content = MarketingContent.objects.create(
            campaign=self.campaign,
            platform="LINKEDIN",
            content_type="TEXT",
            status="PENDING"
        )

    def test_create_brand(self):
        """Marka profili oluşturma API testi"""
        url = reverse("brand-list")
        data = {
            "name": "Yeni Girişim",
            "vertical": "Genel Pazarlama",
            "target_audience": "Girişimciler",
            "brand_voice": "Enerjik",
            "description": "Yeni nesil e-ticaret çözümü"
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(BrandProfile.objects.count(), 2)

    def test_get_campaigns(self):
        """Kampanya listeleme ve filtreleme API testi"""
        url = reverse("campaign-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(len(response.data["results"]), 1)

        # Filtreleme testi
        response_filtered = self.client.get(url, {"brand_id": self.brand.id})
        self.assertEqual(response_filtered.status_code, status.HTTP_200_OK)
        self.assertEqual(response_filtered.data["count"], 1)
        self.assertEqual(len(response_filtered.data["results"]), 1)


    @patch("marketing_api.views.GeminiClient")
    def test_trigger_agent(self, mock_gemini_cls):
        """Ajanı tetikleme (trigger-agent) özel action testi"""
        mock_client = MagicMock()
        mock_gemini_cls.return_value = mock_client
        mock_response = MagicMock()
        mock_response.status = "completed"
        mock_artifact = MagicMock()
        mock_artifact.content.body = "Örnek metin"
        mock_artifact.content.cta = "Tıklayın"
        mock_artifact.content.hashtags = ["ai", "marketing"]
        mock_response.artifacts = [mock_artifact]
        mock_response.message = "İçerik başarıyla üretildi."
        mock_client.generate_content.return_value = mock_response

        url = reverse("content-trigger-agent", kwargs={"pk": self.content.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Veritabanında durum güncellendi mi kontrol et
        self.content.refresh_from_db()
        self.assertEqual(self.content.status, "READY")


    def test_agent_callback(self):
        """Ajanın işi bitirip callback endpoint'ine dönme testi"""
        # Callback public olduğundan authenticate edilmemiş bir client kullanalım
        self.client.force_authenticate(user=None)
        
        url = reverse("agent-callback")
        data = {
            "content_id": self.content.id,
            "status": "READY",
            "generated_text": "Dijital pazarlamada yapay zeka devri! Ainnova ile kampanyalarınızı saniyeler içinde planlayın ve optimize edin.",
            "media_url": "https://example.com/assets/ainnova-promo.jpg"
        }
        
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Veritabanında güncelleme yapıldı mı kontrol et
        self.content.refresh_from_db()
        self.assertEqual(self.content.status, "READY")
        self.assertEqual(self.content.generated_text, data["generated_text"])
        self.assertEqual(self.content.media_url, data["media_url"])


class TOTP2FATests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="totpuser@example.com", email="totpuser@example.com", password="SecurePassword123!")
        self.client.force_authenticate(user=self.user)

    def test_totp_full_flow(self):
        import pyotp
        # 1. Setup TOTP
        setup_url = reverse("totp-setup")
        res_setup = self.client.post(setup_url)
        self.assertEqual(res_setup.status_code, status.HTTP_200_OK)
        self.assertIn("secret", res_setup.data)
        self.assertIn("qr_code", res_setup.data)
        secret = res_setup.data["secret"]

        # 2. Enable TOTP with 6-digit code
        enable_url = reverse("totp-enable")
        totp = pyotp.TOTP(secret)
        code = totp.now()

        res_enable = self.client.post(enable_url, {"code": code}, format="json")
        self.assertEqual(res_enable.status_code, status.HTTP_200_OK)
        self.assertTrue(res_enable.data["is_totp_enabled"])
        self.assertEqual(len(res_enable.data["backup_codes"]), 5)

        # 3. Login step 1: should return totp_required and pre_auth_token
        self.client.force_authenticate(user=None)
        login_url = reverse("token_obtain_pair")
        res_login = self.client.post(login_url, {"username": "totpuser@example.com", "password": "SecurePassword123!"}, format="json")
        self.assertEqual(res_login.status_code, status.HTTP_200_OK)
        self.assertTrue(res_login.data["totp_required"])
        self.assertIn("pre_auth_token", res_login.data)
        pre_auth_token = res_login.data["pre_auth_token"]

        # 4. Login step 2: verify 2FA token
        verify_login_url = reverse("totp-verify-login")
        totp_code = totp.now()
        res_verify = self.client.post(verify_login_url, {"pre_auth_token": pre_auth_token, "code": totp_code}, format="json")
        self.assertEqual(res_verify.status_code, status.HTTP_200_OK)
        self.assertIn("access", res_verify.data)
        self.assertIn("refresh", res_verify.data)

        # 5. Disable 2FA
        self.client.force_authenticate(user=self.user)
        disable_url = reverse("totp-disable")
        res_disable = self.client.post(disable_url, {"password": "SecurePassword123!", "code": totp.now()}, format="json")
        self.assertEqual(res_disable.status_code, status.HTTP_200_OK)
        self.assertFalse(res_disable.data["is_totp_enabled"])


class AdvancedBackendEnhancementsTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="CaseUser@Domain.Com", email="CaseUser@Domain.Com", password="MyPassword123!")
        self.client.force_authenticate(user=self.user)

        self.brand = BrandProfile.objects.create(owner=self.user, name="SoftDelete Brand", vertical="Tech", target_audience="Everyone")
        self.campaign = Campaign.objects.create(brand=self.brand, name="Test Campaign", objective="Test", start_date=timezone.now().date(), end_date=timezone.now().date())
        self.content = MarketingContent.objects.create(campaign=self.campaign, platform="LINKEDIN", content_type="TEXT", topic="Soft Delete Topic")

    def test_email_case_insensitivity(self):
        self.client.force_authenticate(user=None)
        login_url = reverse("token_obtain_pair")
        # Try logging in with lowercase email
        res = self.client.post(login_url, {"username": "caseuser@domain.com", "password": "MyPassword123!"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("access", res.data)

    def test_soft_delete_and_restore(self):
        content_url = reverse("content-detail", kwargs={"pk": self.content.id})
        # Soft delete content
        res_delete = self.client.delete(content_url)
        self.assertEqual(res_delete.status_code, status.HTTP_204_NO_CONTENT)

        self.content.refresh_from_db()
        self.assertTrue(self.content.is_deleted)

        # Restore content
        restore_url = reverse("content-restore", kwargs={"pk": self.content.id})
        res_restore = self.client.post(restore_url)
        self.assertEqual(res_restore.status_code, status.HTTP_200_OK)

        self.content.refresh_from_db()
        self.assertFalse(self.content.is_deleted)

    def test_export_csv(self):
        export_url = reverse("content-export-csv")
        res = self.client.get(export_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res["Content-Type"], "text/csv; charset=utf-8")
        self.assertIn("Soft Delete Topic", res.content.decode("utf-8"))

    def test_activity_log(self):
        from .views import log_activity
        log_activity(self.user, "Test Eylemi", "Detay", None)

        log_url = reverse("activity-logs")
        res = self.client.get(log_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(len(res.data) > 0)


