# Etkileşim İşleyicileri

## İşleyiciler

core/interactions/ içinde bulunur.

- interactionProcessor.js: Tüm etkileşimler için ana yönlendirici.
- proc-buttons.js: Buton tıklamalarını belirli mantık dosyalarına yönlendirir.
- proc-menus.js: Seçim menü etkileşimlerini yönetir.
- proc-modals.js: Modal gönderimlerini işler.
- proc-commands.js: Slash komutlarını yürütür.

## Sistem Mantığı

- Ses Durumu: Çalma komutlarına izin vermeden önce botun ses kanalında olup olmadığını kontrol eder.
- Yetkilendirme: Hassas işlemleri yürütmeden önce kullanıcı izinlerini doğrular.
- Bekleme Süreleri: Kötüye kullanımı önlemek için hız sınırlamasını uygular.
- Hata İşleme: Kullanıcı dostu mesajlarla merkezi hata yakalama.

## Belirli İşleyiciler

- Çalma: Oynat, duraklat, devam et, sonraki, önceki.
- Gezinti: Sure listeleri ve Kari listeleri için sayfalama.
- Yönetici: Sunucu yönetimi ve istatistikler için yalnızca geliştirici kontrolleri.
- Webhooklar: Harici webhook Zikir hizmetlerinin kaydı ve yönetimi.
