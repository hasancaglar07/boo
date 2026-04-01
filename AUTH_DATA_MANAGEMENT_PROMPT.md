# 🔐 Complete Authentication & Data Management System - Implementation Prompt

## 📋 Özet

**signup-flow-cro** skill'i kullanarak Book Generator için complete authentication ve data management sistemi oluştur.

## 🎯 Hedefler

1. **Kullanıcı girişi/çıkışı optimizasyonu**
2. **Kayıt altına alma (tracking)**
3. **Kullanıcının kitapları yönetimi**
4. **Veritabanı oluşturma**
5. **Kullanıcı detaylarını loglama**

## 📊 Mevcut Durum Analizi

### Mevcut Auth Sistemi
```typescript
// web/src/lib/preview-auth.ts
- LocalStorage-based session management
- Şifre yok, email verification yok
- Basit account structure
- Rate limiting yok
- Password reset yok
```

### Mevcut Data
```typescript
// Kitaplar: JSON dosyalarında
// Kullanıcı verisi: LocalStorage'da
// Logging: Console.log
// Database: Yok
```

## 🏗️ Önerilen Mimari

### Frontend
- **Next.js 16** (App Router)
- **NextAuth.js v5** (Auth.js)
- **Prisma** veya **Drizzle ORM**
- **Zod** (Validation)

### Backend
- **Next.js API Routes** (Vercel Pro)
- **Prisma** veya **Drizzle ORM**
- **PostgreSQL** (Vercel Postgres) veya **Cloudflare D1**

### Database
```sql
-- users.sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  name TEXT NOT NULL,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free',
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);

-- books.sql
CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  topic TEXT NOT NULL,
  outline JSONB NOT NULL,
  style JSONB NOT NULL,
  status TEXT DEFAULT 'draft',
  preview JSONB,
  full_content JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_books_user_id ON books(user_id);
CREATE INDEX idx_books_status ON books(status);
CREATE INDEX idx_books_slug ON books(slug);

-- sessions.sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);

-- audit_logs.sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- analytics_events.sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  properties JSONB,
  pathname TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);
```

## 🚀 Implementation Prompt

```
Book Generator için complete authentication ve data management sistemi oluştur.

## HEDEFLER
1. Kullanıcı girişi/çıkışı optimizasyonu
2. Kayıt altına alma (tracking)
3. Kullanıcının kitapları yönetimi
4. Veritabanı oluşturma
5. Kullanıcı detaylarını loglama

## AUTHENTICATION SYSTEM

### 1. NextAuth.js v5 Kurulumu

```bash
# Install NextAuth.js
npm install next-auth@beta authjs @auth/prisma-adapter

# Install Prisma
npm install prisma @prisma/client

# Install Zod
npm install zod
```

### 2. Auth Configuration

```typescript
// auth.ts
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

export const { handlers, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    signOut: "/logout",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-posta" },
        password: { label: "Şifre" }
      },
      authorize: async (credentials) => {
        const { email, password } = credentials;
        
        // 1. User lookup
        const user = await prisma.user.findUnique({
          where: { email }
        });
        
        if (!user || !user.passwordHash) {
          throw new Error("Email veya şifre hatalı");
        }
        
        // 2. Password verify
        const isValid = await verify(password, user.passwordHash);
        
        if (!isValid) {
          throw new Error("Şifre hatalı");
        }
        
        // 3. Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        });
        
        return user;
      }
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // 1. Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email: account.email }
      });
      
      if (existingUser) {
        // 2. Update existing user
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            name: account.name,
            avatar_url: account.picture,
            emailVerified: true,
            lastLoginAt: new Date()
          }
        });
        
        // 3. Audit log
        await prisma.auditLog.create({
          data: {
            userId: existingUser.id,
            action: "user_logged_in",
            entityType: "user",
            entityId: existingUser.id,
            newValues: {
              provider: account.provider,
              lastLoginAt: new Date()
            }
          }
        });
        
        return existingUser;
      }
      
      // 4. Create new user
      const newUser = await prisma.user.create({
        data: {
          email: account.email,
          name: account.name || "",
          avatar_url: account.picture,
          emailVerified: true,
          subscriptionTier: "free",
          lastLoginAt: new Date()
        }
      });
      
      // 5. Audit log
      await prisma.auditLog.create({
        data: {
          userId: newUser.id,
          action: "user_registered",
          entityType: "user",
          entityId: newUser.id,
          newValues: {
            provider: account.provider,
            name: account.name,
            avatarUrl: account.picture
          }
        }
      });
      
      return newUser;
    }
  }
});
```

### 3. Auth API Routes

```typescript
// app/api/auth/[...nextauth]/route.ts
export { auth as handler } from "@/auth";

// app/api/auth/register/route.ts
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email("Geçerli bir e-posta girin"),
  password: z.string().min(8, "En az 8 karakter"),
  name: z.string().min(2, "Adınızı girin"),
});

export async function POST(req: Request) {
  const body = await req.json();
  const { email, password, name } = registerSchema.parse(body);
  
  // 1. Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });
  
  if (existingUser) {
    return Response.json(
      { error: "Bu e-posta zaten kayıtlı" },
      { status: 400 }
    );
  }
  
  // 2. Hash password
  const passwordHash = await hash(password, 12);
  
  // 3. Create user
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      subscriptionTier: "free",
      emailVerified: false
    }
  });
  
  // 4. Create session
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  });
  
  // 5. Audit log
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "user_registered",
      entityType: "user",
      entityId: user.id,
      newValues: { email, name }
    }
  });
  
  // 6. Send verification email
  // (Email sending logic)
  
  return Response.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name
    }
  });
}

// app/api/auth/login/route.ts
export async function POST(req: Request) {
  const body = await req.json();
  const { email, password } = body;
  
  // 1. User lookup
  const user = await prisma.user.findUnique({
    where: { email }
  });
  
  if (!user) {
    return Response.json(
      { error: "Kullanıcı bulunamadı" },
      { status: 401 }
    );
  }
  
  // 2. Password verify
  const isValid = await verify(password, user.passwordHash);
  
  if (!isValid) {
    // Audit log
    await prisma.auditLog.create({
      data: {
        action: "login_failed",
        entityType: "user",
        entityId: user.id,
        userId: user.id,
        ipAddress: req.headers.get('x-forwarded-for'),
        userAgent: req.headers.get('user-agent')
      }
    });
    
    return Response.json(
      { error: "Şifre hatalı" },
      { status: 401 }
    );
  }
  
  // 3. Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });
  
  // 4. Create session
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  });
  
  // 5. Audit log
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "user_logged_in",
      entityType: "user",
      entityId: user.id,
      ipAddress: req.headers.get('x-forwarded-for'),
      userAgent: req.headers.get('user-agent')
    }
  });
  
  return Response.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name
    }
  });
}

// app/api/auth/logout/route.ts
export async function POST(req: Request) {
  const session = await auth();
  
  if (!session?.user) {
    return Response.json({ error: "Oturum açıksız" }, { status: 401 });
  }
  
  // 1. Audit log
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "user_logged_out",
      entityType: "user",
      entityId: session.user.id
    }
  });
  
  // 2. Destroy session
  await prisma.session.delete({
    where: { id: session.sessionToken }
  });
  
  return Response.json({ success: true });
}

// app/api/auth/forgot-password/route.ts
export async function POST(req: Request) {
  const body = await req.json();
  const { email } = z.object({ email: z.string().email() }).parse(body);
  
  // 1. User lookup
  const user = await prisma.user.findUnique({
    where: { email }
  });
  
  if (!user) {
    // Security: Don't reveal if email exists
    return Response.json({
      success: true,
      message: "Eğer bu e-posta kayıtlıysa, şifre sıfırlama linki gönderildi"
    });
  }
  
  // 2. Generate reset token
  const resetToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 3600000); // 1 hour
  
  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      token: resetToken,
      expiresAt
    }
  });
  
  // 3. Send reset email
  // (Email sending logic)
  
  return Response.json({
    success: true,
    message: "Şifre sıfırlama linki e-postanııza gönderildi"
  });
}

// app/api/auth/reset-password/route.ts
export async function POST(req: Request) {
  const body = await req.json();
  const { token, newPassword } = z.object({
    token: z.string(),
    newPassword: z.string().min(8)
  }).parse(body);
  
  // 1. Find valid reset token
  const resetRecord = await prisma.passwordReset.findFirst({
    where: {
      token,
      expiresAt: { gte: new Date() }
    }
  });
  
  if (!resetRecord) {
    return Response.json(
      { error: "Geçersiz veya süresi geçmiş" },
      { status: 400 }
    );
  }
  
  // 2. Hash new password
  const passwordHash = await hash(newPassword, 12);
  
  // 3. Update user password
  await prisma.user.update({
    where: { id: resetRecord.userId },
    data: { passwordHash }
  });
  
  // 4. Delete reset token
  await prisma.passwordReset.delete({
    where: { token }
  });
  
  // 5. Audit log
  await prisma.auditLog.create({
    data: {
      userId: resetRecord.userId,
      action: "password_reset",
      entityType: "user",
      entityId: resetRecord.userId
    }
  });
  
  return Response.json({
    success: true,
    message: "Şifreniz güncellendi"
  });
}
```

## BOOK MANAGEMENT SYSTEM

### 1. Book API Routes

```typescript
// app/api/books/route.ts
export async function GET(req: Request) {
  const session = await auth();
  
  if (!session?.user) {
    return Response.json({ error: "Oturum açıksız" }, { status: 401 });
  }
  
  const books = await prisma.book.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' }
  });
  
  return Response.json({ books });
}

export async function POST(req: Request) {
  const session = await auth();
  
  if (!session?.user) {
    return Response.json({ error: "Oturum açıksız" }, { status: 401 });
  }
  
  const body = await req.json();
  const { title, topic, outline, style } = body;
  
  // 1. Create book
  const book = await prisma.book.create({
    data: {
      userId: session.user.id,
      slug: generateSlug(title),
      title,
      topic,
      outline,
      style,
      status: 'draft'
    }
  });
  
  // 2. Audit log
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "book_created",
      entityType: "book",
      entityId: book.id,
      newValues: { title, topic }
    }
  });
  
  return Response.json({ book });
}

// app/api/books/[id]/route.ts
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  
  if (!session?.user) {
    return Response.json({ error: "Oturum açıksız" }, { status: 401 });
  }
  
  const book = await prisma.book.findFirst({
    where: {
      id: params.id,
      userId: session.user.id
    }
  });
  
  if (!book) {
    return Response.json({ error: "Kitap bulunamadı" }, { status: 404 });
  }
  
  return Response.json({ book });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  
  if (!session?.user) {
    return Response.json({ error: "Oturum açıksız" }, { status: 401 });
  }
  
  const book = await prisma.book.findFirst({
    where: {
      id: params.id,
      userId: session.user.id
    }
  });
  
  if (!book) {
    return Response.json({ error: "Kitap bulunamadı" }, { status: 404 });
  }
  
  const body = await req.json();
  const { title, topic, outline, style, status } = body;
  
  // 1. Get old values for audit
  const oldValues = {
    title: book.title,
    topic: book.topic,
    status: book.status
  };
  
  // 2. Update book
  const updatedBook = await prisma.book.update({
    where: { id: params.id },
    data: {
      ...(title && { title }),
      ...(topic && { topic }),
      ...(outline && { outline }),
      ...(style && { style }),
      ...(status && { status })
    }
  });
  
  // 3. Audit log
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "book_updated",
      entityType: "book",
      entityId: book.id,
      oldValues,
      newValues: {
        ...(title && { title }),
        ...(topic && { topic }),
        ...(style && { style }),
        ...(status && { status })
      }
    }
  });
  
  return Response.json({ book: updatedBook });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  
  if (!session?.user) {
    return Response.json({ error: "Oturum açıksız" }, { status: 401 });
  }
  
  const book = await prisma.book.findFirst({
    where: {
      id: params.id,
      userId: session.user.id
    }
  });
  
  if (!book) {
    return Response.json({ error: "Kitap bulunamadı" }, { status:  404 });
  }
  
  // 1. Audit log
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "book_deleted",
      entityType: "book",
      entityId: book.id,
      oldValues: { title: book.title, topic: book.topic }
    }
  });
  
  // 2. Delete book
  await prisma.book.delete({
    where: { id: params.id }
  });
  
  return Response.json({ success: true });
}
```

## ANALYTICS TRACKING SYSTEM

### 1. Analytics Events

```typescript
// lib/analytics.ts
export type AnalyticsEvent =
  // Auth events
  | "user_registered"
  | "user_logged_in"
  | "user_logged_out"
  | "password_reset"
  | "email_verification_sent"
  
  // Book events
  | "book_created"
  | "book_updated"
  | "book_deleted"
  | "book_viewed"
  | "book_shared"
  
  // Funnel events
  | "wizard_started"
  | "wizard_topic_completed"
  | "title_ai_used"
  | "outline_ai_used"
  | "generate_started"
  | "preview_viewed"
  | "paywall_viewed"
  | "checkout_started"
  | "checkout_completed"
  
  // Premium events
  | "subscription_upgraded"
  | "payment_completed"
  | "download_clicked";

export async function trackEvent(
  eventName: AnalyticsEvent,
  properties?: Record<string, unknown>
) {
  const session = await auth();
  
  if (!session?.user) {
    console.log('[Analytics] No session, skipping analytics');
    return;
  }
  
  // Store in database
  await prisma.analyticsEvent.create({
    data: {
      userId: session.user.id,
      sessionId: session.sessionToken,
      eventName,
      properties,
      pathname: window.location.pathname
    }
  });
}
```

### 2. Frontend Components

```typescript
// components/auth/login-form.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { trackEvent } from "@/lib/analytics";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false
      });
      
      if (result?.error) {
        setError(result.error);
        trackEvent("login_failed", { email, error: result.error });
      } else {
        trackEvent("user_logged_in", { email });
        router.push("/app/library");
        router.refresh();
      }
    } catch (error) {
      setError("Bir hata oluştu");
      trackEvent("login_failed", { email, error: String(error) });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="text-sm font-semibold text-foreground">
          E-posta
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ornek:ornek@mail.com"
          required
          className="h-12"
        />
      </div>
      
      <div>
        <label htmlFor="password" className="text-semibold text-foreground">
          Şifre
        </label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          className="h-12"
        />
      </div>
      
      {error && (
        <div className="rounded-[16px] border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      
      <Button
        type="submit"
        size="lg"
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
      </Button>
      
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Hesabınız yok mu?{" "}
          <Link href="/signup" className="text-primary hover:underline">
            Ücretsiz kayıt ol
          </Link>
        </p>
      </div>
    </form>
  );
}

// components/auth/signup-form.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { trackEvent } from "@/lib/analytics";

export function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      // 1. Register API call
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Kayıt başarısız");
      }
      
      // 2. Auto login
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false
      });
      
      if (result?.error) {
        throw new Error(result.error);
      }
      
      trackEvent("user_registered", { email, name });
      trackEvent("user_logged_in", { email });
      
      router.push("/app/library");
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Bir hata oluştu");
      trackEvent("register_failed", { email, error: String(error) });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="text-sm font-semibold text-foreground">
          Ad Soyad
        </label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="İhsan Yılmaz"
          required
          className="h-12"
        />
      </div>
      
      <div>
        <label htmlFor="email" className="text-sm font-semibold text-foreground">
          E-posta
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ornek:ornek@mail.com"
          required
          className="h-12"
        />
      </div>
      
      <div>
        <label htmlFor="password" className="text-sm font-semibold text-foreground">
          Şifre (en az 8 karakter)
        </label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          className="h-12"
        />
      </div>
      
      {error && (
        <div className="rounded-[[16px] border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      
      <Button
        type="submit"
        size="lg"
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? "Kayıt yapılıyor..." : "Hesap Oluştur"}
      </Button>
      
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Zaten hesabınız var mı?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Giriş yap
          </Link>
        </p>
      </div>
    </form>
  );
}
```

## USER DASHBOARD COMPONENTS

```typescript
// components/user/user-dashboard.tsx
"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useEffect } from "react";

export function UserDashboard() {
  const session = useSession();
  const [books, setBooks] = useState([]);
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    if (!session?.user) {
      redirect("/login");
    }
    
    // Load user data
    Promise.all([
      fetch('/api/user/books').then(r => r.json()),
      fetch('/api/user/stats').then(r => r.json())
    ]).then(([booksData, statsData]) => {
      setBooks(booksData.books);
      setStats(statsData.stats);
    });
  }, [session]);
  
  if (!session?.user) {
    return null;
  }
  
  return (
    <div className="user-dashboard">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Hoş geldin, {session.user.name}!</h1>
        <p className="text-muted-foreground">
          {books.length} kitabınız var
        </p>
      </div>
      
      {/* Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <StatCard
            title="Toplam Kitap"
            value={stats.totalBooks}
            icon="📚"
          />
          <StatCard
            title="Premium Kitap"
            value={stats.premiumBooks}
            icon="⭐"
          />
          <StatCard
            title="Toplam Kelime"
            value={stats.totalWords}
            icon="✍️"
          />
        </div>
      )}
      
      {/* Books Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {books.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>
      
      {/* Quick Actions */}
      <div className="mt-8">
        <Button onClick={() => router.push("/start/topic")}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Kitap Oluştur
        </Button>
      </div>
    </div>
  );
}
```

## SECURITY BEST PRACTICES

### 1. Password Security
```typescript
// lib/auth.ts
import bcrypt from "bcryptjs";

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

### 2. Rate Limiting
```typescript
// lib/rate-limit.ts
import { headers } from "next/headers";

export async function rateLimit(
  identifier: string,
  limit: number = 5,
  windowMs: number = 60000
) {
  const headersList = headers();
  
  const ip = headersList.get('x-forwarded-for') || 
         headersList.get('x-real-ip') ||
         'unknown';
  
  const key = `ratelimit:${identifier}:${ip}`;
  
  // Check KV store
  const count = await kv.get(key);
  
  if (count && parseInt(count) >= limit) {
    throw new Error('Çok fazla deneme. Lütfen biraz bekleyin.');
  }
  
  // Increment counter
  await kv.put(key, String(parseInt(count || '0') + 1), {
    expirationTtl: windowMs
  });
}
```

### 3. Input Validation
```typescript
// lib/validation.ts
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta girin"),
  password: z.string().min(8, "En az 8 karakter")
});

export const registerSchema = z.object({
  email: z.string().email("Geçerli bir e-posta girin"),
  password: z.string()
    .min(8, "En az 8 karakter")
    .regex(/[A-Z]/, "En az bir büyük harf içermeli")
    .regex(/[a-z]/, "En az bir küçük harf içermeli")
    .regex(/[0-9]/, "En az bir rakam içermeli"),
  name: z.string().min(2, "Adınızı en az 2 karakter"),
});

export const bookSchema = z.object({
  title: z.string().min(3, "Başlık en az 3 karakter"),
  topic: z.string().min(10, "Konu en az 10 karakter"),
  outline: z.array().min(3, "En az 3 bölüm gerekli"),
  style: z.object({
    language: z.string(),
    tone: z.string(),
    depth: z.string(),
    coverDirection: z.string()
  })
});
```

## SUCCESS CRITERIA

- ✅ Secure authentication system
- ✅ User registration <30 saniye
- ✅ User login <10 saniye
- ✅ Zero data loss
- ✅ Complete audit trail
- ✅ Real-time analytics
- ✅ Production ready

## TECH STACK

- Frontend: Next.js 16, React 19, TypeScript
- Auth: NextAuth.js v5
- Database: Prisma ORM
- Database Client: PostgreSQL / Vercel Postgres / Cloudflare D1
- Validation: Zod
- Analytics: Custom + Vercel Analytics
- Security: bcrypt, rate limiting, audit logging
```

## 💡 Ek İpuçları

### 1. Social Auth Priority
```typescript
// components/auth/social-auth.tsx
export function SocialAuthButtons() {
  return (
    <div className="flex flex-col gap-3">
      <Button
        onClick={() => signIn("google", { callback: "/api/auth/callback/google" })}
        className="w-full"
      >
        <Google className="mr-2 h-4 w-4" />
        Google ile Devam Et
      </Button>
    </div>
  );
}
```

### 2. Password Strength Meter
```typescript
// components/auth/password-strength.tsx
export function PasswordStrengthMeter({ password }: { password: string }) {
  const strength = calculatePasswordStrength(password);
  
  return (
    <div className="password-strength">
      <div className="strength-bar">
        <div 
          className="strength-fill" 
          style={{ 
            width: `${strength.percentage}%`,
            backgroundColor: strength.color 
          }} 
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {strength.message}
      </p>
    </div>
  );
}
```

### 3. Email Verification
```typescript
// app/api/auth/send-verification/route.ts
export async function POST(req: Request) {
  const { email } = await req.json();
  
  // 1. Generate verification code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 3600000); // 1 hour
  
  // 2. Save to database
  await prisma.verificationCode.create({
    data: {
      email,
      code,
      expiresAt
    }
  });
  
  // 3. Send email
  // (Email sending logic)
  
  return Response.json({
    success: true,
    message: "Doğrulama kodu e-postanıza gönderildi"
  });
}
```

## 📊 Analytics Dashboard

```typescript
// components/admin/analytics-dashboard.tsx
export function AnalyticsDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBooks: 0,
    activeUsers: 0,
    conversionRate: 0
  });
  
  useEffect(() => {
    // Load analytics data
    fetch('/api/admin/analytics')
      .then(r => r.json())
      .then(data => setStats(data));
  }, []);
  
  return (
    <div className="analytics-dashboard">
      <h1>Analytics Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-4">
        <MetricCard
          title="Toplam Kullanıcı"
          value={stats.totalUsers}
          change="+12%"
        />
        <MetricCard
          title="Aktif Kullanıcı"
          value={stats.activeUsers}
          change="+8%"
        />
        <MetricCard
          title="Toplam Kitap"
          value={stats.totalBooks}
          change="+23%"
        />
        <MetricCard
          title="Dönüşüm Oranı"
          value={`${stats.conversionRate}%`}
          change="+2.3%"
        />
      </div>
      
      {/* Charts */}
      <div className="mt-8">
        <ConversionFunnel />
        <UserRetentionChart />
        <BookCreationChart />
      </div>
    </div>
  );
}
```

## 🚀 Implementation Steps

### Phase 1: Setup (1-2 gün)
1. NextAuth.js kurulumu
2. Prisma kurulumu
3. Database schema oluştur
4. Environment variables ayarla
5. Migration yap

### Phase 2: Auth Routes (2-3 gün)
1. Login/register API routes
2. Password reset flow
3. Email verification
4. Social auth integration
5. Session management

### Phase 3: Book Management (2-3 gün)
1. Book CRUD API routes
2. User dashboard
3. Book list/detail pages
4. Book sharing

### Phase 4: Analytics (2-3 gün)
1. Event tracking system
2. Analytics dashboard
3. User behavior tracking
4. Conversion funnel tracking

### Phase 5: Testing & Launch (1-2 gün)
1. Unit tests
2. Integration tests
3. Security audit
4. Performance test
5. Deploy to production

## 📚 Referanslar

- **Skill:** signup-flow-cro
- **Product Context:** `.agents/product-marketing-context.md`
- **Current Auth:** `web/src/lib/preview-auth.ts`
- **Current Forms:** `web/src/components/forms/auth-form.tsx`

---

**Son Güncelleme:** 2026-04-01  
**Versiyon:** 1.0.0  
**Durum:** 🚀 Ready to Implement
