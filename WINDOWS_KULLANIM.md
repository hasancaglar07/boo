# Windows Usage

This repo now includes batch files for easy Windows usage:

- [book-generator.bat](/mnt/c/Users/ihsan/Desktop/BOOK/book-generator.bat)
- [start-dashboard.bat](/mnt/c/Users/ihsan/Desktop/BOOK/start-dashboard.bat)
- [start-web.bat](/mnt/c/Users/ihsan/Desktop/BOOK/start-web.bat)

Usage:

```bat
cd C:\Users\ihsan\Desktop\BOOK
book-generator.bat
```

Open the web dashboard:

```bat
cd C:\Users\ihsan\Desktop\BOOK
book-generator.bat ui
```

or

```bat
cd C:\Users\ihsan\Desktop\BOOK
start-dashboard.bat
```

Open the new shadcn-based web interface:

```bat
cd C:\Users\ihsan\Desktop\BOOK
book-generator.bat web
```

or

```bat
cd C:\Users\ihsan\Desktop\BOOK
start-web.bat
```

Notes:

- `start-web.bat` runs in `dev` mode by default (stabil profile).
- Default `dev` mode starts dashboard and runs dependency/prisma checks.
- Use `start-web.bat dev-fast` for fast startup that skips dashboard/check steps.
- The server runs as long as the window stays open; closing the window stops the server.
- `book-generator.bat web` now cleanly shuts down old web and dashboard processes and restarts fresh.
- Use `start-web.bat reset` if needed.

Address:

```text
http://localhost:3000
```

To stop:

```bat
cd C:\Users\ihsan\Desktop\BOOK
start-web.bat stop
```

To clean restart:

```bat
cd C:\Users\ihsan\Desktop\BOOK
start-web.bat reset
```

To start with fast profile (skip dashboard/check steps):

```bat
cd C:\Users\ihsan\Desktop\BOOK
start-web.bat dev-fast
```

To repair Next.js dependencies and restart:

```bat
cd C:\Users\ihsan\Desktop\BOOK
start-web.bat repair
```

To watch live logs:

```bat
cd C:\Users\ihsan\Desktop\BOOK
start-web.bat logs-live
```

Generate a sample book with a single command:

```bat
book-generator.bat sample
```

Generate EPUB with a single command:

```bat
book-generator.bat epub "Ihsan"
```

Generate PDF with a single command:

```bat
book-generator.bat pdf "Ihsan"
```

Sample book output folder on Windows:

```text
C:\Users\ihsan\Desktop\BOOK\book_outputs\sample-book
```
