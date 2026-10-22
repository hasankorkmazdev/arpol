# Ar-Pol — Telefon Aksesuarları Demo Mağazası

Ar-Pol Toptan GSM Aksesuarları için hazırlanmış e-ticaret tasarım demosu. Derleme adımı yok; düz HTML, CSS ve JavaScript.

- Ana sayfa (hero, kategoriler, vitrin, kampanya, Instagram hikâyeleri), kategori/arama, ürün, sepet, ödeme, sipariş onayı, hesabım ve favoriler sayfaları
- Sepet, favoriler, üyelik ve siparişler tarayıcının `localStorage`'ında tutulur; gerçek ödeme alınmaz
- Ürün verisi ve görselleri `tools/fetch-gsm.mjs` ile gsmaksesuari.com.tr'den çekilmiştir; fiyatlar demo amaçlıdır

## Yerelde çalıştırma

Node.js gerekir (ek paket yok):

```bash
node tools/serve.mjs
```

Ardından http://localhost:5173 adresini aç. Başka port için: `node tools/serve.mjs 8080`.

## Ürün kataloğunu yenileme

```bash
node tools/fetch-gsm.mjs
```

Ürünleri ve görselleri yeniden indirip `demo/assets/js/data.js` dosyasını yazar. Ana sayfadaki slaytlar `ap1009` gibi ürün kodlarıyla seçili olduğundan katalog değişirse `demo/assets/js/pages/home.js` içindeki kodları kontrol et.

## Cloudflare Pages ile yayınlama

1. Cloudflare panelinde **Workers & Pages → Create → Pages → Connect to Git** ile bu repoyu seç.
2. Ayarlar:
   - **Framework preset:** None
   - **Build command:** boş bırak
   - **Build output directory:** `demo`
3. Deploy sonrası **Custom domains** sekmesinden `arpol.<alan-adın>` alt alan adını ekle. Alan adı aynı Cloudflare hesabındaysa DNS kaydı otomatik oluşur.

## Klasör yapısı

```
demo/                 Yayınlanan site (Cloudflare çıktı klasörü)
  index.html …        Sayfalar
  assets/css/site.css Bileşen stilleri
  assets/js/          data.js (katalog), store.js (durum), ui.js (ortak arayüz), stories.js, pages/*
  assets/img/         Logo ve ürün görselleri
tools/
  serve.mjs           Yerel statik sunucu
  fetch-gsm.mjs       Katalog ve görsel indirici
```
