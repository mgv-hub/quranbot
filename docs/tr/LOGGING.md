# Günlük Kaydı ve İzleme

## Strateji

- Asenkron Kuyruk: Yüksek trafik sırasında G/Ç engellemesini önler.
- Arşivleme: Eski günlükler sıkıştırılır ve storage/logs/archive içinde saklanır.
- Temizleme: 60 günden eski günlükler otomatik olarak silinir.
- Hata İzleme: Yakalanmayan istisnalar ve reddedilen sözler yığın izleri ile kaydedilir.

## İzleme

- Sağlık Kontrolü: HTTP sunucusu /health ve /radio-health uç noktalarını sunar.
- Bellek Yönetimi: Bellek kullanımı eşikleri aşarsa periyodik kontroller çöp toplamayı tetikler.
- İstatistikler: Bot kullanım istatistikleri (sunucular, komutlar, zikirler) izlenir ve Firebase'e kaydedilir.

## Günlük Seviyeleri

- debug: Detaylı iç bilgiler.
- info: Genel operasyonel mesajlar.
- warn: Potansiyel sorunlar.
- error: Kritik arızalar.
- fatal: Sistemi durduran hatalar.
