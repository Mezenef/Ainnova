from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BrandProfileViewSet,
    CampaignViewSet,
    MarketingContentViewSet,
    AgentCallbackAPIView,
    MeAPIView,
    NotificationPreferenceAPIView,
    PasswordChangeAPIView,
    RegisterAPIView,
    PasswordResetRequestAPIView,
    PasswordResetConfirmAPIView,
)

router = DefaultRouter()
router.register(r"brands", BrandProfileViewSet, basename="brand")
router.register(r"campaigns", CampaignViewSet, basename="campaign")
router.register(r"contents", MarketingContentViewSet, basename="content")

urlpatterns = [
    path("", include(router.urls)),
    path("agent/callback/", AgentCallbackAPIView.as_view(), name="agent-callback"),
    path("me/", MeAPIView.as_view(), name="me"),
    path("notifications/preferences/", NotificationPreferenceAPIView.as_view(), name="notification-preferences"),
    path("me/change-password/", PasswordChangeAPIView.as_view(), name="change-password"),
    path("register/", RegisterAPIView.as_view(), name="register"),
    path("password-reset/", PasswordResetRequestAPIView.as_view(), name="password-reset"),
    path("password-reset/confirm/", PasswordResetConfirmAPIView.as_view(), name="password-reset-confirm"),
]