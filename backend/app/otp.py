import hashlib
import secrets

def generate_otp_code() -> str:
    # 6 dígitos
    return f"{secrets.randbelow(1_000_000):06d}"

def hash_otp(code: str) -> str:
    # hash simple 
    return hashlib.sha256(code.encode("utf-8")).hexdigest()

def verify_otp(code: str, code_hash: str) -> bool:
    return hash_otp(code) == code_hash