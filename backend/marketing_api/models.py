from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone



class SoftDeleteModel(models.Model):
    is_deleted = models.BooleanField(default=False, verbose_name="Silindi mi?")
    deleted_at = models.DateTimeField(null=True, blank=True, verbose_name="Silinme Tarihi")

    class Meta:
        abstract = True

    def delete(self, using=None, keep_parents=False):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(using=using)

    def restore(self):
        self.is_deleted = False
        self.deleted_at = None
        self.save()


class BrandProfile(SoftDeleteModel):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="brands", null=True, blank=True, verbose_name="Sahip Kullanıcı")
    name = models.CharField(max_length=255, verbose_name="Marka Adı")
    vertical = models.CharField(max_length=100, verbose_name="Dikey/Sektör", help_text="Örn: Ai-Juris, Ai-Health")
    target_audience = models.TextField(verbose_name="Hedef Kitle")
    brand_voice = models.CharField(max_length=100, verbose_name="Marka Tonu/Sesi", help_text="Örn: Profesyonel, Samimi")
    description = models.TextField(verbose_name="Marka Açıklaması", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Marka Profili"
        verbose_name_plural = "Marka Profilleri"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} ({self.vertical})"


class Campaign(SoftDeleteModel):
    STATUS_CHOICES = [
        ("DRAFT", "Taslak"),
        ("ACTIVE", "Aktif"),
        ("COMPLETED", "Tamamlandı"),
    ]

    brand = models.ForeignKey(BrandProfile, on_delete=models.CASCADE, related_name="campaigns", verbose_name="Marka")
    name = models.CharField(max_length=255, verbose_name="Kampanya Adı")
    objective = models.TextField(verbose_name="Kampanya Amacı/Hedefi")
    start_date = models.DateField(verbose_name="Başlangıç Tarihi")
    end_date = models.DateField(verbose_name="Bitiş Tarihi")
    budget = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, verbose_name="Bütçe")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="DRAFT", verbose_name="Durum")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Kampanya"
        verbose_name_plural = "Kampanyalar"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} - {self.brand.name}"


class MarketingContent(SoftDeleteModel):
    PLATFORM_CHOICES = [
        ("LINKEDIN", "LinkedIn"),
        ("X", "X (Twitter)"),
        ("INSTAGRAM", "Instagram"),
        ("FACEBOOK", "Facebook"),
        ("GOOGLE_ADS", "Google Ads"),
        ("META_ADS", "Meta Ads"),
        ("BLOG", "Blog Post"),
        ("EMAIL", "E-posta Kampanyası"),
    ]

    CONTENT_TYPE_CHOICES = [
        ("TEXT", "Sadece Metin"),
        ("IMAGE", "Metin & Görsel"),
        ("VIDEO", "Metin & Video"),
    ]

    STATUS_CHOICES = [
        ("PENDING", "Ajan Bekleniyor"),
        ("GENERATING", "Üretiliyor"),
        ("READY", "İncelemeye Hazır"),
        ("FAILED", "Başarısız Oldu"),
        ("PUBLISHED", "Yayınlandı"),
    ]

    LANGUAGE_CHOICES = [
        ("tr", "Türkçe"),
        ("en", "İngilizce"),
    ]

    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name="contents", verbose_name="Kampanya")
    platform = models.CharField(max_length=50, choices=PLATFORM_CHOICES, verbose_name="Platform")
    content_type = models.CharField(max_length=20, choices=CONTENT_TYPE_CHOICES, default="TEXT", verbose_name="İçerik Tipi")
    language = models.CharField(max_length=10, choices=LANGUAGE_CHOICES, default="tr", verbose_name="Dil")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="PENDING", verbose_name="Durum")


    topic = models.CharField(max_length=255, blank=True, null=True, verbose_name="Konu")
    extra_info = models.TextField(blank=True, null=True, verbose_name="Ek Bilgi")
    tone = models.CharField(max_length=50, blank=True, null=True, verbose_name="Ton")
    length = models.CharField(max_length=20, blank=True, null=True, verbose_name="Uzunluk")
    scheduled_at = models.DateTimeField(blank=True, null=True, verbose_name="Planlanan Tarih/Saat")

    generated_text = models.TextField(blank=True, null=True, verbose_name="Üretilen Metin")
    media_url = models.URLField(blank=True, null=True, verbose_name="Medya Bağlantısı (Görsel/Video)")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Pazarlama İçeriği"
        verbose_name_plural = "Pazarlama İçerikleri"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.platform} ({self.get_content_type_display()}) - {self.campaign.name}"


class NotificationPreference(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="notification_preference")
    email_notifications = models.BooleanField(default=True, verbose_name="E-posta Bildirimleri")
    weekly_report = models.BooleanField(default=True, verbose_name="Haftalık Performans Raporu")
    push_notifications = models.BooleanField(default=False, verbose_name="Tarayıcı (Push) Bildirimleri")
    ai_tips = models.BooleanField(default=True, verbose_name="AI Önerileri ve İpuçları")
    content_ready = models.BooleanField(default=True, verbose_name="İçerik Hazır Olduğunda")

    dark_mode = models.BooleanField(default=False, verbose_name="Koyu Tema")
    accent_color = models.CharField(max_length=20, default="#4a47a3", verbose_name="Vurgu Rengi")
    font_family = models.CharField(max_length=50, default="Inter", verbose_name="Yazı Tipi")
    color_saturation = models.CharField(max_length=20, default="orta", verbose_name="Renk Yoğunluğu")

    class Meta:
        verbose_name = "Bildirim Tercihi"
        verbose_name_plural = "Bildirim Tercihleri"

    def __str__(self):
        return f"{self.user.username} - Bildirim Tercihleri"


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    totp_secret = models.CharField(max_length=64, blank=True, null=True, verbose_name="TOTP Secret Anahtarı")
    is_totp_enabled = models.BooleanField(default=False, verbose_name="2FA Aktif mi?")
    backup_codes = models.JSONField(default=list, blank=True, verbose_name="Yedek Kodlar")

    class Meta:
        verbose_name = "Kullanıcı Profili"
        verbose_name_plural = "Kullanıcı Profilleri"

    def __str__(self):
        return f"{self.user.username} - Profil (2FA: {'Aktif' if self.is_totp_enabled else 'Pasif'})"


class ActivityLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="activity_logs", verbose_name="Kullanıcı")
    action = models.CharField(max_length=255, verbose_name="Eylem")
    details = models.TextField(blank=True, null=True, verbose_name="Detaylar")
    ip_address = models.GenericIPAddressField(blank=True, null=True, verbose_name="IP Adresi")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Tarih")

    class Meta:
        verbose_name = "İşlem Logu"
        verbose_name_plural = "İşlem Logları"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.username} - {self.action} ({self.created_at.strftime('%Y-%m-%d %H:%M')})"