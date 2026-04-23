# Başlangıç ve Başlatma Akışı

## Sıra

1. Ortam Yükleme: core/config/envSwitcher.js çevre değişkenlerini yükler.
2. İstemci Başlatma: core/startup/botSetup.js Discord istemcisini ve global değişkenleri başlatır.
3. Veri Yükleme: core/data/data-manager.js Kur'an ve Kari verilerini çeker.
4. Giriş: Bot Discord'a giriş yapar.
5. Hazır Olayı: core/startup/readyHandler.js tetiklenir.
   - Firebase'i başlat.
   - Çalışma Zamanı Durumlarını Geri Yükle.
   - Ses Bağlantılarını Kurtar.
   - Komutları Kaydet.
   - Zamanlayıcıları Başlat (Zikirler, Yedekler, İstatistikler).

## Tekrarlanan Görevler

- Durum Kaydetme: Her 60 saniyede bir.
- Yedekleme: Her 5 dakikada bir.
- Radyo Sağlığı: Her 30 dakikada bir.
- Bellek Temizleme: Her 3 dakikada bir.
- İstatistik Güncelleme: Her 10 saniyede bir.
