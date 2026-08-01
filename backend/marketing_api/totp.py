import base64
import io
import secrets
import string
import pyotp
import qrcode


def generate_totp_secret() -> str:
    """Rastgele 32 karakterlik base32 TOTP secret anahtarı üretir."""
    return pyotp.random_base32()


def get_totp_uri(secret: str, email: str, issuer_name: str = "Ainnova Content Studio") -> str:
    """Authenticator uygulamaları için otpauth URI üretir."""
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(name=email, issuer_name=issuer_name)


def generate_qr_code_base64(otp_uri: str) -> str:
    """otpauth URI'sinden base64 formatında QR Kod PNG resmi üretir."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=8,
        border=4,
    )
    qr.add_data(otp_uri)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    img_str = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{img_str}"


def verify_totp_token(secret: str, token: str) -> bool:
    """Kullanıcının girdiği 6 haneli TOTP kodunu doğrular (30s pencere esnekliği ile)."""
    if not secret or not token:
        return False
    totp = pyotp.TOTP(secret)
    return totp.verify(token.strip(), valid_window=1)


def generate_backup_codes(count: int = 5) -> list[str]:
    """2FA erişimi kaybedildiğinde kullanılacak 8 karakterlik yedek kodlar üretir."""
    alphabet = string.ascii_uppercase + string.digits
    return ["".join(secrets.choice(alphabet) for _ in range(8)) for _ in range(count)]