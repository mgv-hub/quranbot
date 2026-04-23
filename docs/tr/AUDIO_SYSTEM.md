# Ses Sistemi

## Çalma Motoru

Ses işleme için @discordjs/voice kullanır.

- Kaynaklar: HTTP akışlarından oluşturulur.
- Oynatıcı: Çalma durumunu ve hataları yönetir.
- Bağlantı: Ses ağ geçidi iletişimini yönetir.

## Akış İşleme

- Doğrulama: Çalmadan önce URL'ler kontrol edilir.
- Yeniden Deneme Mantığı: Başarısız akışlar yedeklerle yeniden denenir.
- Süre: Başlıklardan veya sure numarasından tahmin edilir.

## Kari Verileri

- Kaynaklar: mp3quran.net ve özel JSON depoları.
- Önbellekleme: Veriler bellekte ve Firebase'de önbelleklenir.
- Yedek: Uzaktan kaynaklar başarısız olursa yerel dosyalar kullanılır.

## Radyo Sistemi

- Sağlık Kontrolü: Akışlar periyodik olarak izlenir.
- Devralma: Çalışan akışlara otomatik geçiş.
- Sayfalama: Radyolar 25'er sayfa halinde listelenir.
