# Perde Konağı — Fatura ve Kargo Entegrasyon Planı

## Gerçekleştirilen
- Supabase tabloları: `shop_fulfillment_settings`, `shop_order_fulfillment`, `shop_invoices`, `shop_shipments`, `shop_fulfillment_events`.
- Yönetici paneli Ayarlar: e-belge sağlayıcısı, taşıyıcı seçimi, ücretsiz kargo eşiği, eşik altı kargo bedeli; son fatura ve gönderi kayıtları.
- Yönetici yetkisi DB RLS ile kontrol edilir. Genel kullanıcıya müşteri teslimat/fatura verisi açılmaz.
- Banka onayı `paid` statüsüne dönüştükten sonra, ancak gerekli müşteri/teslimat alanları ve ilgili etkinleştirme bayrakları hazırsa fatura/gönderi iş kuyruğuna kayıt ekleyen idempotent tetikleyici.
- Tüm otomatik işlem bayrakları başlangıçta `false`; gerçek servis çağrısı ve fatura kesimi yok.

## API bilgileri girilmeden tamamlanamayacak noktalar
1. **E-belge entegratörü seçimi**: e-Fatura/e-Arşiv servisinin kesin API sözleşmesi, kimlik doğrulaması, vergi/kdv satırları, alıcı e-Fatura mükellef sorgusu, fatura numaralandırması, iptal/iade ve PDF/UBL yanıt şemaları. Sağlayıcı adı seçmek API sözleşmesi yerine geçmez.
2. **Yurtiçi Kargo**: anlaşma hesabına ait web servis dokümanı, kimlik bilgileri, desi/paket ve fiyatlandırma yöntemi, gönderi oluşturma, barkod/etiket, takip, iptal ve hata kodları. Sadece firma adı üzerinden doğru API isteği varsayılamaz.
3. **QNB Pay**: banka tarafından onaylanan tahsilatın güvenli doğrulanması ve siparişin `paid` durumuna geçirilmesi. Tarayıcıdan gelen ödeme sonucuna güvenilmez.
4. **Siparişin kesinleştirilmesi**: ürün ve kupon fiyatları sunucuda yeniden hesaplanmalı; kargo, indirim, KDV, teslimat ve fatura bilgileri doğrulanmış bir siparişe kaydedilmeli. Şu anda müşteri ödeme hazırlık ekranı sipariş oluşturmaz.
5. **Test ortamı**: gerçek entegratör ve taşıyıcı test yanıtlarıyla e-Fatura/e-Arşiv, kargo etiketi, kargo takibi, iptal ve iade senaryoları.

## Önerilen otomasyon
Ödeme banka tarafından doğrulanır → sipariş kesinleşir → e-Fatura mükellefiyeti sorgulanır → e-Fatura/e-Arşiv kesilir → fatura PDF/UBL ve numarası kaydedilir → kargo gönderisi oluşturulur → etiket ve takip numarası kaydedilir → müşteriye bildirim gönderilir. Hatalar tekrar deneme kuyruğunda tutulur; aynı siparişe ikinci belge/gönderi otomatik oluşturulmaz.

## Güvenlik
- Gizli anahtarlar yalnızca Supabase Edge Function secrets; tarayıcıya ve GitHub'a yazılmaz.
- Tüm harici API çağrıları sunucu tarafında; servis yanıtları doğrulanır ve kişisel veri loglara gereksiz yazılmaz.
- Yetkisiz kullanıcıya sipariş adresi, VKN/TCKN veya fatura detayları açılmaz.
- Vergi mevzuatına uygun e-belge türü ve KDV bilgileri mali müşavir/entegratörle doğrulanmalıdır.
