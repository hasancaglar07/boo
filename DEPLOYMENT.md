# 🚀 BOOK Projesi Docker Deployment Rehberi

## 📋 Ön Hazırlık

### VPS Gereksinimleri
- **Minimum:** CPX21 (2 vCPU, 4GB RAM, 80GB Disk)
- **Önerilen:** CPX31 (4 vCPU, 8GB RAM, 160GB Disk)
- **İşletim Sistemi:** Ubuntu 22.04/24.04 veya Debian 12

### Domain (Opsiyonel)
- Domain satın alın (örn: cloudflare, namecheap)
- DNS'te VPS IP'sine A record ekleyin

---

## 🛠️ Adım 1: VPS Kurulumu

### 1.1 Sistem Güncelleme
```bash
# SSH ile VPS'e bağlanın
ssh root@your-vps-ip

# Sistemi güncelleyin
apt update && apt upgrade -y

# Zaman dilimini ayarlayın
timedatectl set-timezone Europe/Istanbul
```

### 1.2 Docker ve Docker Compose Kurulumu
```bash
# Docker kurulumu
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Docker'ı başlatın ve enable edin
systemctl start docker
systemctl enable docker

# Docker Compose kurulumu
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Kurulumu doğrulayın
docker --version
docker-compose --version
```

### 1.3 Firewall Ayarları
```bash
# UFW kurulumu ve yapılandırma
apt install -y ufw
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw --force enable
```

---

## 📦 Adım 2: Projeyi Deploy Edin

### 2.1 Projeyi İndirin
```bash
# Proje dizini oluşturun
mkdir -p /var/www/boo
cd /var/www/boo

# Repo'yu clone edın
git clone https://github.com/hasancaglar07/boo.git .

# .env.local dosyası oluşturun
cp .env.codefast.example .env.local
nano .env.local
```

### 2.2 Environment Variables
`.env.local` dosyasını düzenleyin:
```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://your-domain.com"
NEXTAUTH_SECRET="your-random-secret-key"

# AI API Keys
OPENAI_API_KEY="sk-..."
GEMINI_API_KEY="AI..."
GROQ_API_KEY="gsk_..."

# Email (Opsiyonel)
RESEND_API_KEY="re_..."
SMTP_HOST="smtp.resend.com"
SMTP_PORT="587"
SMTP_USER="resend"
SMTP_PASSWORD="your-api-key"

# Stripe (Opsiyonel)
STRIPE_PUBLIC_KEY="pk_..."
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

**Secret Key Oluşturma:**
```bash
openssl rand -base64 32
```

### 2.3 Docker Container'ları Başlatın
```bash
# Docker image'leri build edin
docker-compose build

# Container'ları başlatın
docker-compose up -d

# Logları kontrol edin
docker-compose logs -f
```

### 2.4 Container Durumunu Kontrol Edin
```bash
# Tüm container'ların durumunu görün
docker-compose ps

# Beklenen çıktı:
# NAME              STATUS         PORTS
# boo-web           Up             0.0.0.0:3000->3000/tcp
# boo-dashboard     Up             0.0.0.0:8765->8765/tcp
# boo-nginx         Up             0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
```

---

## 🔒 Adım 3: SSL Sertifikası (Let's Encrypt)

### 3.1 Certbot Kurulumu
```bash
# Certbot ve Docker plugin'ini kurun
apt install -y certbot python3-certbot-nginx

# SSL sertifikası alın
certbot --nginx -d your-domain.com

# Email girin ve terms kabul edin
```

### 3.2 Nginx Konfigürasyonunu Güncelleyin
```bash
# nginx.conf dosyasını düzenleyin
nano /var/www/boo/nginx.conf

# HTTPS bölümünü uncomment edin ve domain'i güncelleyin
```

### 3.3 Docker'ı Restart Edin
```bash
docker-compose restart nginx
```

---

## 🔄 Adım 4: Yönetim ve Bakım

### 4.1 Container Yönetimi
```bash
# Container'ları durdurun
docker-compose stop

# Container'ları başlatın
docker-compose start

# Container'ları restart edin
docker-compose restart

# Container'ları ve volume'ları silin
docker-compose down -v
```

### 4.2 Logları Görüntüleme
```bash
# Tüm loglar
docker-compose logs -f

# Sadece web logları
docker-compose logs -f web

# Sadece dashboard logları
docker-compose logs -f dashboard

# Son 100 satır
docker-compose logs --tail=100
```

### 4.3 Container İçine Girme
```bash
# Web container'ı
docker-compose exec web sh

# Dashboard container'ı
docker-compose exec dashboard bash

# Nginx container'ı
docker-compose exec nginx sh
```

### 4.4 Güncelleme
```bash
# En son kodu çekin
git pull origin main

# Docker image'leri rebuild edin
docker-compose build

# Container'ları restart edin
docker-compose down
docker-compose up -d
```

---

## 📊 Adım 5: Monitoring

### 5.1 Kaynak Kullanımı
```bash
# Docker istatistikleri
docker stats

# Disk kullanımı
df -h

# RAM kullanımı
free -h

# CPU kullanımı
top
```

### 5.2 Health Check
```bash
# Health check endpoint
curl http://localhost/health

# Web uygulaması
curl http://localhost:3000

# Dashboard API
curl http://localhost:8765/api/health
```

---

## 🐛 Troubleshooting

### Sorun: Container başlamıyor
```bash
# Logları kontrol edin
docker-compose logs

# Container detaylarını görün
docker inspect boo-web
```

### Sorun: Port zaten kullanımda
```bash
# Hangi process port kullanıyor kontrol edin
netstat -tulpn | grep :3000

# Process'i öldürün
kill -9 <PID>
```

### Sorun: Database hatası
```bash
# Volume'ları silin ve yeniden başlatın
docker-compose down -v
docker-compose up -d
```

### Sorun: SSL sertifikası yenileme
```bash
# Sertifikayı manuel yenileyin
certbot renew

# Docker'ı restart edin
docker-compose restart nginx
```

---

## 🔐 Güvenlik İpuçları

1. **SSH Key Kullanımı:** Password yerine SSH key kullanın
2. **Fail2Ban Kurulumu:** Brute force saldırılarını engelleyin
3. **Regular Updates:** Sistemi düzenli güncelleyin
4. **Backup:** Database ve dosyaları düzenli yedekleyin
5. **Monitor Logs:** Logları düzenli kontrol edin

---

## 📞 Destek

Sorun yaşarsanız:
1. Logları kontrol edin: `docker-compose logs`
2. GitHub Issues: https://github.com/hasancaglar07/boo/issues
3. Dokümantasyon: README.md

---

## ✅ Deployment Checklist

- [ ] VPS satın alındı
- [ ] Domain ayarlandı (opsiyonel)
- [ ] Docker ve Docker Compose kuruldu
- [ ] Projeyi indirildi
- [ ] .env.local dosyası oluşturuldu
- [ ] API keys girildi
- [ ] Docker container'ları başlatıldı
- [ ] Uygulama çalışıyor (http://your-vps-ip)
- [ ] SSL sertifikası alındı
- [ ] HTTPS çalışıyor
- [ ] Health check başarılı
- [ ] Monitor sistemi kuruldu

**Tebrikler! 🎉 Projeniz canlıda!**
