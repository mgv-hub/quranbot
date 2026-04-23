# QuranBot Proje Dokümantasyonu

## Genel Bakış

QuranBot, Discord platformu için tasarlanmış kapsamlı bir Node.js uygulamasıdır. Temel amacı, Kur'an tilaveti, radyo yayını, zikir otomasyonu ve namaz vakti bilgileri dahil olmak üzere İslami içerik hizmetleri sunmaktır. Proje, yüksek kullanılabilirlik, durum kalıcılığı ve modüler ölçeklenebilirlik için mühendislik yaklaşımıyla geliştirilmiştir.

## Hedef Kitle

- İslami içerik otomasyonu arayan Discord Sunucu Yöneticileri.
- Modüler Discord bot mimarisi ile ilgilenen Geliştiriciler.
- Güvenilir ses yayını ve dini araçlara ihtiyacı olan Son Kullanıcılar.

## Ana Özellikler

- Ses Çalma: Birçok kariden ve radyo istasyonundan Kur'an tilavetleri yayını.
- Durum Kalıcılığı: Firebase aracılığıyla sunucu yapılandırmalarının kaydedilmesi ve geri yüklenmesi.
- Otomatik Zikirler: Zikir mesajlarının planlı olarak otomatik gönderilmesi.
- Namaz Vakitleri: Konuma dayalı doğrulukla küresel namaz vakti araması.
- Yönetici Kontrolleri: Sunucu yönetimi için özel geliştirici paneli.
- Kurtarma Sistemleri: Yeniden başlatmadan sonra ses kanallarına otomatik yeniden bağlanma.

## Kurulum

1. Depoyu klonlayın.
2. Bağımlılıkları pnpm install kullanarak yükleyin.
3. .env dosyasında çevre değişkenlerini yapılandırın.
4. Botu pnpm start kullanarak başlatın.

## Lisans

MIT Lisansı
