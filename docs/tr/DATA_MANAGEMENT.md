# Veri Yönetimi

## Çekme

core/data/ içinde bulunur.

- Kaynaklar: Veriler mp3quran.net, aladhan.com ve özel JSON depolarından çekilir.
- Yöntemler: Özel başlıklar ve zaman aşımı ile node-fetch kullanır.
- Doğrulama: Veri yapıları global duruma yüklenmeden önce doğrulanır.

## Önbellekleme

- Çalışma Zamanı Önbelleği: Hızlı erişim için veriler global değişkenlerde saklanır.
- Firebase Önbelleği: Kritik veriler kalıcılık için Firebase'e yedeklenir.
- Yerel Önbellek: Uzaktan kaynaklar başarısız olursa yedek olarak JSON dosyaları kullanılır.

## Saklama

- Firebase: Sunucu kurulumları, durumlar, kontrol kimlikleri ve kullanıcı webhookları için kullanılır.
- Yerel: Yedek dosyaları Discord kanallarına gönderilmeden önce sıkıştırılır ve yerel olarak saklanır.
- Ortam: Hassas yapılandırma özel Envira yükleyici aracılığıyla yüklenir.
