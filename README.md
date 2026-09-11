# Crewmate — Project Sumber (Electron)

Ini adalah source project Electron untuk aplikasi desktop **Crewmate**.
Build siap-pakai (Windows & Linux) sudah disediakan terpisah; folder ini untuk kamu
yang ingin build ulang, build untuk macOS, atau mengubah tampilan/fitur.

## Struktur

- `app/index.html` — seluruh UI Crewmate (HTML/CSS/JS, satu file, tanpa dependency luar)
- `main.js` — proses utama Electron (membuka window, tanpa Node API di renderer)
- `build/icon.png`, `build/icon.ico` — icon aplikasi
- `package.json` — konfigurasi Electron + electron-builder

Data disimpan otomatis lewat `localStorage` bawaan Electron/Chromium,
tersimpan lokal di folder data aplikasi pada perangkat masing-masing
(tidak terkirim ke mana pun).

## Menjalankan langsung (mode development)

```
npm install
npm start
```

## Build ulang jadi aplikasi

```
npm install

# Windows (menghasilkan .zip berisi Crewmate.exe, portable — tanpa installer)
npm run dist:win

# Linux (menghasilkan .AppImage)
npm run dist:linux

# Kedua-duanya sekaligus
npm run dist
```

Hasil build akan muncul di folder `dist/`.

### Build untuk macOS

Build macOS idealnya dijalankan langsung di mesin Mac (electron-builder akan
otomatis membuat target `.app`/`.zip` yang sesuai):

```
npm run dist -- --mac zip
```

Tanpa code signing, macOS akan menampilkan peringatan Gatekeeper saat pertama
kali dibuka — klik kanan pada aplikasi lalu pilih "Open" untuk melewatinya.

## Mengubah tampilan / fitur

Karena UI sepenuhnya ada di `app/index.html` (HTML + CSS + JS vanilla, tanpa
framework/build step), kamu bisa langsung edit file itu dan jalankan ulang
`npm start` untuk melihat perubahan — tidak perlu proses compile apa pun.

## Mengganti icon

Ganti `build/icon.png` (disarankan 512x512 atau 1024x1024) dan `build/icon.ico`,
lalu build ulang.
