# Mimari ve Yapı

## Tasarım Felsefesi

Proje, modüler monolitik bir mimariyi takip eder. Bakımı kolaylaştırmak için mantık; Durum, Veri, Etkileşimler ve Yardımcı Programlar gibi farklı alanlara ayrılmıştır. Derin dizin yapılarını yönetmek için özel yol takma adı kullanır.

## Klasör Hiyerarşisi

- core/bot/: Giriş noktası ve ana istemci başlatma.
- core/startup/: Önyükleme mantığı ve komut kaydı.
- core/state/: Durum yönetimi ve kalıcılık.
- core/interactions/: Butonları, menüleri ve komutları işleme.
- core/data/: Veri çekme ve önbellekleme.
- core/utils/: Günlük kaydı ve Firebase dahil ortak yardımcı programlar.
- core/ui/: Embed oluşturucular ve bileşen oluşturucular.
- core/package/Envira/: Özel çevre değişkeni yükleyici.

## Ana Bileşenler

- İstemci: core/bot/core.js içinde yönetilen Discord.js Client örneği.
- Durum Yöneticisi: GuildStateManager ve PersistentStateManager, çalışma zamanı ve veritabanı durumunu yönetir.
- Etkileşim İşleyicisi: Tüm Discord etkileşimlerini belirli işleyicilere yönlendirir.
- Veri Yükleyici: Harici API çağrılarını ve kariler ve sureler için önbellekleme yönetir.

## Modül Etkileşimi

Başlatma sırası istemciyi başlatır, verileri yükler, Firebase'e bağlanır ve önceki durumları geri yükler. Etkileşimler, belirli işleyicileri çalıştırmadan önce izinleri ve bekleme sürelerini doğrulayan merkezi bir işleyici aracılığıyla yönlendirilir.
