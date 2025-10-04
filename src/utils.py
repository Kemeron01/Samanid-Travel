from passlib.context import CryptContext

pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')

def hash_password(password: str) -> str:
    #return pwd_context.hash(password)
    password_bytes = password.encode("utf-8")[:72]
    return pwd_context.hash(password_bytes.decode("utf-8", errors="ignore"))

def verify_password(plain_password: str, hashed_password: str) -> bool:
    password_bytes = plain_password.encode("utf-8")[:72]
    return pwd_context.verify(password_bytes.decode("utf-8", errors="ignore"), hashed_password)