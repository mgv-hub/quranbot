# Komut Sistemi

## Slash Komutları

- /kontrol: Çalma için ana kontrol panelini gösterir.
- /ayarla: Kur'an kategorisini ve kanallarını oluşturur.
- /katil: Yapılandırılmış ses kanalına katılır.
- /ayril: Ses kanalından ayrılır.
- /hiz: Bot gecikmesini ve istatistikleri gösterir.
- /namaz_vakitleri: Seçilen konumlar için namaz vakitlerini gösterir.
- /kaynaklar: Bot tarafından kullanılan veri kaynaklarını listeler.
- /rehber: Kullanım talimatlarını gösterir.

## İzin Seviyeleri

- Yönetici: Tüm komutlara tam erişim.
- Özel Kullanıcılar: Çevre değişkenlerinde tanımlanır.
- Herkes: Belirli modlarda sadece çalma gezintisi ile sınırlıdır.

## Bekleme Süreleri

Komutlar, kötüye kullanımı önlemek için bir bekleme süresi sistemi kullanır.

- Kullanıcı Bekleme Süreleri: Her komut için her kullanıcıya uygulanır.
- Sunucu Bekleme Süreleri: Ayar komutları için her sunucuya uygulanır.
- Global Bekleme Süreleri: Yüksek yük durumlarında uygulanır.

## Yürütme Akışı

1. Etkileşim alındı.
2. İzin kontrolü.
3. Bekleme süresi kontrolü.
4. Komut yürütme.
5. Durum güncelleme.
