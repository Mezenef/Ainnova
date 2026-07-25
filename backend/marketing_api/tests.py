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
        self.assertEqual(len(response.data), 1)

        # Filtreleme testi
        response_filtered = self.client.get(url, {"brand_id": self.brand.id})
        self.assertEqual(response_filtered.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response_filtered.data), 1)

    def test_trigger_agent(self):
        """Ajanı tetikleme (trigger-agent) özel action testi"""
        url = reverse("content-trigger-agent", kwargs={"pk": self.content.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Veritabanında durum güncellendi mi kontrol et
        self.content.refresh_from_db()
        self.assertEqual(self.content.status, "GENERATING")
        self.assertEqual(response.data["content"]["status"], "GENERATING")

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
