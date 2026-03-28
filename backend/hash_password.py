#Esto hay que borrarlo, es porque se me olvido la contraseña
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

print(pwd_context.hash("NuevaClave123!"))
