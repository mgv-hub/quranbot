# Özel Yardımcı Programlar

## Envira Yükleyici

core/package/Envira/ içinde bulunur.

- Amaç: Şifreleme desteği ile dotenv için özel alternatif.
- Özellikler: .env dosyalarını ayrıştırır, şifreli değerleri destekler, çoklu ortamları yönetir.

## Yol Takma Adı

- Kütüphane: pathlra-aliaser.
- Kullanım: Göreceli yollar yerine @logger gibi içe aktarmalara izin verir.
- Yapılandırma: path*aliaser* altında package.json içinde tanımlanır.

## Ses Yardımcı Programları

- Yeniden Deneme Mantığı: fetchWithRetry ağ kararsızlığını yönetir.
- Akış Doğrulama: Çalmadan önce içerik türünü ve durumunu kontrol eder.
- Süre Hesaplama: İlerleme izleme için ses süresini tahmin eder.

## Veritabanı Temizleyici

core/utils/databaseCleaner.js içinde bulunur.

- Fonksiyon: Botun artık bulunmadığı sunucular için eski verileri kaldırır.
- Hedefler: Kurulum sunucuları, sunucu durumları ve kontrol kimlikleri.
