import os
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType

conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    MAIL_FROM=os.getenv("MAIL_FROM"),
    MAIL_SERVER=os.getenv("MAIL_SERVER", "smtp.gmail.com"),
    MAIL_PORT=int(os.getenv("MAIL_PORT", "587")),
    MAIL_STARTTLS=os.getenv("MAIL_STARTTLS", "True") == "True",
    MAIL_SSL_TLS=os.getenv("MAIL_SSL_TLS", "False") == "True",
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=False,
)

fm = FastMail(conf)

async def send_otp_email(to_email: str, code: str):
    html = f"""
    <p>Tu código de verificación (2FA) es:</p>
    <h2>{code}</h2>
    <p>Expira en pocos minutos. Si no fuiste tú, ignora este mensaje.</p>
    """
    message = MessageSchema(
        subject="Código de verificación ATLAS Infancias",
        recipients=[to_email],
        body=html,
        subtype=MessageType.html,
    )
    await fm.send_message(message)