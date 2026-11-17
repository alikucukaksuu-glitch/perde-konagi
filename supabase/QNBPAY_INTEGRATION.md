# QNB Pay — Perde Konağı entegrasyon sözleşmesi

Kaynak: kullanıcının paylaştığı `QNBpay Services.postman_collection.json`. Koleksiyondaki örnek kimlik bilgileri, kart numaraları, token ve hash değerleri **koda alınmamıştır**. Örneklerdeki değerler canlı kimlik bilgisi olarak kabul edilmez.

## Test uç noktaları
- Token: `POST https://test.qnbpay.com.tr/ccpayment/api/token` (`app_id`, `app_secret`)
- 3D ödeme: `POST https://test.qnbpay.com.tr/ccpayment/api/paySmart3D`
- Tamamlama: `POST https://test.qnbpay.com.tr/ccpayment/payment/complete`
- Durum sorgulama: `POST https://test.qnbpay.com.tr/ccpayment/api/checkstatus`
- Ödeme onayı: `POST https://test.qnbpay.com.tr/ccpayment/api/confirmPayment`
- İade: `POST https://test.qnbpay.com.tr/ccpayment/api/refund`
- Taksitler: `POST https://test.qnbpay.com.tr/ccpayment/api/installments`

3D ödeme dışındaki servisler için Bearer token gereksinimi kılavuzda belirtilmiştir. Bankanın `hash_key` oluşturma ve dönüş doğrulama algoritması bağımsız olarak doğrulanmadan ödeme veya iade çağrısı açılmayacaktır.

## Gerekli güvenlik kapıları
1. Siparişin sahibi ve durumu doğrulanmalı, ürün ve kargo tutarları sunucuda yeniden hesaplanmalı.
2. Tekil `invoice_id` ile idempotent ödeme denemesi oluşturulmalı; yarış koşullarına karşı kilit kullanılmalı.
3. Kart numarası/CVV hiçbir zaman veritabanına, günlük kayıtlarına veya GitHub'a yazılmamalı.
4. Banka dönüşü tek başına ödeme kanıtı değildir. İmza doğrulama ve bankadan durum sorgusu zorunludur.
5. Banka durumundaki tutar, para birimi, sipariş ve işlem numarası doğrulanmalı.
6. Ödeme onaylandıktan sonra sipariş statüsü yalnızca sunucu tarafında ilerletilmeli.
7. İade talebinde yönetici kimliği, toplam iade sınırı, işlem tekrarı ve banka cevabı kontrol edilmeli.
8. Canlı ortam yalnızca test senaryoları geçildikten sonra etkinleştirilmeli.

## Gizli değişkenler
`QNBPAY_APP_ID`, `QNBPAY_APP_SECRET`, `QNBPAY_MERCHANT_KEY`, `QNBPAY_ENV`. Diğer banka parametreleri, hash algoritması doğrulandıktan sonra tanımlanacaktır.

## Mevcut durum
- Supabase: ödeme, ödeme olayı ve iade kayıt tabloları mevcut; RLS açık.
- Supabase: yönetici bağlantı teşhis fonksiyonu mevcut.
- Yönetim paneli: ödeme ve iade geçmişi salt okunur.
- **Henüz yok:** gerçek 3D ödeme, güvenli callback, banka durum mutabakatı, iade API çağrısı, uçtan uca testler.
