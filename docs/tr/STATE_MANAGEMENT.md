# Durum Yönetimi

## Sunucu Durumu

Her sunucunun bellekte saklanan bir çalışma zamanı durum nesnesi vardır.

- Bağlantı: Ses bağlantı nesnesi.
- Çalma: Geçerli sure, kari ve mod.
- Zamanlayıcılar: Zikir ve hareketsizlik zamanlayıcıları.
- Yapılandırma: Kontrol modu ve kanal kimlikleri.

## Kalıcı Durum

Durum, Firebase Realtime Database ile senkronize edilir.

- Kurtarma: Bot yeniden başlatıldığında durumlar geri yüklenir.
- Yedekleme: Her 5 dakikada bir otomatik yedekleme.
- Temizleme: Ayrılan sunucular için eski veriler kaldırılır.

## Durum Geri Yükleme

1. Durumları Firebase'den yükle.
2. Kanal varlığını doğrula.
3. Ses kanallarına yeniden bağlan.
4. Varsa çalmayı devam ettir.

## Bellek Yönetimi

- Yüksek bellek kullanımında çöp toplayıcı tetiklenir.
- Etkileşim önbelleği periyodik olarak temizlenir.
- Yok edilen bağlantılar otomatik olarak temizlenir.
