from rest_framework import serializers
from django.contrib.auth.models import User
from .models import BrandProfile, Campaign, MarketingContent, NotificationPreference

class BrandProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = BrandProfile
        fields = [
            "id",
            "owner",
            "name",
            "vertical",
            "target_audience",
            "brand_voice",
            "description",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["owner"]


class CampaignSerializer(serializers.ModelSerializer):
    brand_detail = BrandProfileSerializer(source="brand", read_only=True)

    class Meta:
        model = Campaign
        fields = [
            "id",
            "brand",
            "brand_detail",
            "name",
            "objective",
            "start_date",
            "end_date",
            "budget",
            "status",
            "created_at",
            "updated_at",
        ]


class MarketingContentSerializer(serializers.ModelSerializer):
    campaign_detail = CampaignSerializer(source="campaign", read_only=True)
    platform_display = serializers.CharField(source="get_platform_display", read_only=True)
    content_type_display = serializers.CharField(source="get_content_type_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = MarketingContent
        fields = [
            "id",
            "campaign",
            "campaign_detail",
            "platform",
            "platform_display",
            "content_type",
            "content_type_display",
            "status",
            "status_display",
            "topic",
            "extra_info",
            "tone",
            "length",
            "scheduled_at",
            "generated_text",
            "media_url",
            "created_at",
            "updated_at",
        ]


class AgentCallbackSerializer(serializers.Serializer):
    content_id = serializers.IntegerField(required=True)
    status = serializers.ChoiceField(choices=MarketingContent.STATUS_CHOICES, required=True)
    generated_text = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    media_url = serializers.URLField(required=False, allow_blank=True, allow_null=True)

    def validate_content_id(self, value):
        try:
            return MarketingContent.objects.get(pk=value)
        except MarketingContent.DoesNotExist:
            raise serializers.ValidationError("Belirtilen ID'ye sahip bir içerik görevi bulunamadı.")

    def save(self):
        content = self.validated_data["content_id"]
        content.status = self.validated_data["status"]
        if "generated_text" in self.validated_data:
            content.generated_text = self.validated_data["generated_text"]
        if "media_url" in self.validated_data:
            content.media_url = self.validated_data["media_url"]
        content.save()
        return content


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name"]


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = [
            "email_notifications",
            "weekly_report",
            "push_notifications",
            "ai_tips",
            "content_ready",
            "dark_mode",
            "accent_color",
            "font_family",
            "color_saturation",
        ]