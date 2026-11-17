# Perde Konağı — E-ticaret Sitesi

Bu depo, perdekonagi.com müşteri sitesi ve yönetim panelinin GitHub Pages üzerinden yayımlanan ön yüzünü içerir. Supabase; oturum, veri ve sunucu işlevleri için kullanılır.

## Mevcut durum
- Ürün sayfaları, ölçüye göre fiyatlama, sepet, müşteri hesabı ve yönetim paneli.
- QNB Pay bağlantı kontrolü ve sunucu fiyat sorgusu için hazırlık fonksiyonları.
- Fatura ve kargo sağlayıcısı seçim ekranları, kayıt ve işlem hazırlık tabloları.
- **Canlı ödeme ve otomatik fatura/kargo gönderimi henüz etkin değildir.** Ödeme hazırlığı ekranı sipariş veya tahsilat oluşturmaz.
- 2.000 TL ve üzeri ücretsiz kargo; alt limit ücreti henüz tanımlanmamıştır.

## Yayın ve güvenlik
`.github/workflows/publish-pages.yml` GitHub Pages dağıtımından önce JavaScript sözdizimi kontrolü çalıştırır. Tarayıcıda yayın öncesi mobil ve masaüstü işlev testleri ayrıca gereklidir.

Özel API anahtarları, ödeme sağlayıcısı sırları ve servis yetkileri **istemci JavaScript dosyalarına yazılmamalıdır**. Supabase sunucu gizli değişkenlerinde tutulmalıdır. GitHub'daki `sb_publishable_...` anahtarı istemciye açık yayın anahtarıdır; servis rolü anahtarı değildir.

## Öncelikli kalan işler
1. Sunucu tarafından doğrulanmış ve güvenli şekilde oluşturulan sipariş kayıtları.
2. QNB Pay test ve canlı ödeme akışı, doğrulanmış callback/webhook ve mutabakat.
3. e-Fatura/e-Arşiv entegratör bağlantısı ve belge üretimi.
4. Kargo API, desi, etiket, takip ve gönderi yönetimi.
5. KVKK ve mesafeli satış metinlerinin resmi işletme bilgileriyle tamamlanması.
6. Otomatik fonksiyon testleri, erişilebilirlik ve mobil regresyon kontrolleri.

Bu depo KONAK ERP, PERDE TAKİP ve bayi/panel projelerinden ayrıdır.
