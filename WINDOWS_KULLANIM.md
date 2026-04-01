# Windows Kullanim

Bu repo artik Windows tarafindan da kolay calissin diye bir batch dosyasi ile geliyor:

- [book-generator.bat](/mnt/c/Users/ihsan/Desktop/BOOK/book-generator.bat)
- [start-dashboard.bat](/mnt/c/Users/ihsan/Desktop/BOOK/start-dashboard.bat)
- [start-web.bat](/mnt/c/Users/ihsan/Desktop/BOOK/start-web.bat)

Kullanim:

```bat
cd C:\Users\ihsan\Desktop\BOOK
book-generator.bat
```

Web kontrol panelini ac:

```bat
cd C:\Users\ihsan\Desktop\BOOK
book-generator.bat ui
```

veya

```bat
cd C:\Users\ihsan\Desktop\BOOK
start-dashboard.bat
```

Yeni shadcn tabanli web arayuzunu ac:

```bat
cd C:\Users\ihsan\Desktop\BOOK
book-generator.bat web
```

veya

```bat
cd C:\Users\ihsan\Desktop\BOOK
start-web.bat
```

Not:

- `start-web.bat` varsayilan olarak `serve` modunda calisir.
- Yani pencere acik kaldigi surece sunucu calisir, pencereyi kapatinca sunucu durur.

Adres:

```text
http://127.0.0.1:3000
```

Durdurmak icin:

```bat
cd C:\Users\ihsan\Desktop\BOOK
start-web.bat stop
```

Next.js bagimliliklarini onarip tekrar acmak icin:

```bat
cd C:\Users\ihsan\Desktop\BOOK
start-web.bat repair
```

Canli log izlemek icin:

```bat
cd C:\Users\ihsan\Desktop\BOOK
start-web.bat logs-live
```

Tek komutla ornek kitap olustur:

```bat
book-generator.bat sample
```

Tek komutla EPUB uret:

```bat
book-generator.bat epub "Ihsan"
```

Tek komutla PDF uret:

```bat
book-generator.bat pdf "Ihsan"
```

Windows'ta olusan ornek kitap klasoru:

```text
C:\Users\ihsan\Desktop\BOOK\book_outputs\ornek-kitap
```
