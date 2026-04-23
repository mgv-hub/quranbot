# Dağıtım ve Yapılandırma

## Çevre Değişkenleri

- DISCORD_TOKEN: Bot kimlik doğrulama tokenı.
- FIREBASE_CONFIG: Veritabanı kimlik bilgileri.
- SPE_USER_ID: Özel geliştirici kullanıcı kimlikleri.
- NODE_ENV: Üretim veya geliştirme modu.

## Başlatma Betikleri

- start.bat: Windows başlatma betiği.
- start.sh: Linux başlatma betiği.
- Paket Yöneticisi: Bağımlılık yönetimi için pnpm kullanır.

## İzleme

- Sağlık Kontrolü: Durum için HTTP uç noktası.
- Günlük Kaydı: Dönme ve arşivleme ile dosya tabanlı.
- İstatistikler: Kullanım metrikleri Firebase'de izlenir.

## Yedekleme Sistemi

- Yerel: Yerel olarak saklanan sıkıştırılmış JSON dosyaları.
- Uzaktan: Webhook aracılığıyla Discord kanalına gönderilir.
- Zamanlama: Her 5 dakikada bir otomatik çalışır.

## Ölçekleme

- Bellek: Tek örnek dağıtım için optimize edilmiştir.
- Veritabanı: Paylaşılan durum için Firebase kullanılır.
