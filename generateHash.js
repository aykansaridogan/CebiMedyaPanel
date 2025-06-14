// generateHash.js
import bcrypt from 'bcryptjs'; // 'require' yerine 'import' kullanıldı

const passwordToHash = 'sahin123'; // Şifreyi buraya yazın
const saltRounds = 10; // Salt round sayısını belirleyin (güvenlik için 10-12 arası idealdir)

bcrypt.hash(passwordToHash, saltRounds)
  .then(hash => {
    console.log(`Original Password: ${passwordToHash}`);
    console.log(`Hashed Password: ${hash}`);
  })
  .catch(err => {
    console.error('Error hashing password:', err);
  });

// Başka bir şifre için de aynı işlemi yapabilirsiniz
const anotherPasswordToHash = 'aykan280416';
bcrypt.hash(anotherPasswordToHash, saltRounds)
  .then(hash => {
    console.log(`Original Password: ${anotherPasswordToHash}`);
    console.log(`Hashed Password: ${hash}`);
  })
  .catch(err => {
    console.error('Error hashing password:', err);
  });