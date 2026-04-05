"""Quick test: Generate 2 book covers using Vertex Imagen via Google API Key."""
import sys, os, time, json, base64, requests
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))

# ── Load env ────────────────────────────────────────────────
def load_env(path: Path):
    if not path.exists(): return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line: continue
        key, _, val = line.partition("=")
        key, val = key.strip(), val.strip().strip('"').strip("'")
        if key and val: os.environ.setdefault(key, val)

load_env(ROOT / ".env.codefast.local")

# ── Try Gemini API Key from other project if not set ────────
if not os.environ.get("GOOGLE_API_KEY") and not os.environ.get("VERTEX_API_KEY"):
    alt_key = "AIzaSyA1QoO6hSouF_MQpaOPMRcsmJHl5vEYYYg"
    os.environ["GOOGLE_API_KEY"] = alt_key
    print(f"[INFO] Using Gemini API Key from cursor-yediulya-proje")

# ── Config ──────────────────────────────────────────────────
API_KEY = os.environ.get("GOOGLE_API_KEY") or os.environ.get("VERTEX_API_KEY") or os.environ.get("CODEFAST_API_KEY", "")
PROJECT = os.environ.get("GOOGLE_CLOUD_PROJECT") or os.environ.get("GOOGLE_PROJECT_ID") or os.environ.get("VERTEX_PROJECT_ID", "")
LOCATION = os.environ.get("GOOGLE_CLOUD_LOCATION") or os.environ.get("VERTEX_LOCATION") or "us-central1"

print(f"[CONFIG] API_KEY: {'SET (' + API_KEY[:15] + '...)' if API_KEY else 'NOT SET'}")
print(f"[CONFIG] PROJECT: {PROJECT or 'NOT SET'}")
print(f"[CONFIG] LOCATION: {LOCATION}")

OUTPUT_DIR = ROOT / "test_cover_output"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# ── Books ───────────────────────────────────────────────────
BOOKS = [
    {
        "slug": "focus-by-design",
        "title": "Focus by Design",
        "author": "Elaine Mercer",
        "genre": "personal-development",
        "brief": "Elegant minimal cover with architectural shadows and disciplined cream accents",
    },
    {
        "slug": "silent-offers",
        "title": "Silent Offers",
        "author": "Jonah Vale",
        "genre": "business-marketing",
        "brief": "Moody editorial cover with quiet contrast, soft motion blur, and luxury spacing",
    },
]

# ── Prompt builder ──────────────────────────────────────────
def build_prompt(book: dict) -> str:
    return (
        f"Create premium portrait editorial background artwork for a {book['genre']} book cover. "
        f"Art direction: {book['brief']}. "
        f"Use layered composition, cinematic lighting, atmospheric depth, "
        f"and calm negative space near the top and bottom. "
        f"Make it feel like a high-end bestseller cover. "
        f"Leave generous empty space at top and bottom for typography overlay. "
        f"Rich colors, rich textures, professional editorial quality. "
        f"Background artwork only - do not include any text."
    )

# ── Vertex Imagen 4.0 via AI Platform ───────────────────────
def generate_vertex_imagen(prompt: str, output_path: Path) -> bool:
    """Use Vertex AI Imagen 3 via Gemini API (generateImages)."""
    if not API_KEY:
        print("  No API key for Vertex Imagen")
        return False

    # Imagen 3 via Generative AI API (works with API key, no project needed)
    url = f"https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key={API_KEY}"
    
    payload = {
        "instances": [{"prompt": prompt}],
        "parameters": {
            "sampleCount": 1,
            "aspectRatio": "3:4",
            "personGeneration": "allow_all",
        }
    }

    print(f"  [Vertex Imagen 3] Sending request...")
    try:
        resp = requests.post(url, json=payload, timeout=120)
        print(f"  Status: {resp.status_code}")
        
        if not resp.ok:
            error_text = resp.text[:300]
            print(f"  Error: {error_text}")
            
            # Try alternate endpoint
            print(f"  [Vertex Imagen - alternate] Trying generateImages endpoint...")
            url2 = f"https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key={API_KEY}"
            resp2 = requests.post(url2, json=payload, timeout=120)
            if resp2.ok:
                resp = resp2
            else:
                print(f"  Alternate also failed: {resp2.text[:200]}")
                return False
        
        data = resp.json()
        
        # Check for predictions with bytesBase64Encoded
        if "predictions" in data:
            for pred in data["predictions"]:
                b64 = pred.get("bytesBase64Encoded", "")
                if b64:
                    img_bytes = base64.b64decode(b64)
                    output_path.write_bytes(img_bytes)
                    print(f"  Saved: {output_path} ({len(img_bytes)} bytes)")
                    return True
        
        print(f"  No image data in response. Keys: {list(data.keys())}")
        print(f"  Response: {json.dumps(data)[:500]}")
        return False
        
    except Exception as e:
        print(f"  Exception: {e}")
        return False

# ── Gemini 2.0 Flash Image Generation ──────────────────────
def generate_gemini_flash(prompt: str, output_path: Path) -> bool:
    """Use Gemini 2.0 Flash for image generation."""
    if not API_KEY:
        print("  No API key for Gemini Flash")
        return False

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key={API_KEY}"
    
    payload = {
        "contents": [{
            "parts": [
                {"text": prompt + " Generate a high quality image, not text description."}
            ]
        }],
        "generationConfig": {
            "responseModalities": ["TEXT", "IMAGE"]
        }
    }

    print(f"  [Gemini Flash] Sending request...")
    try:
        resp = requests.post(url, json=payload, timeout=120)
        print(f"  Status: {resp.status_code}")
        
        if not resp.ok:
            print(f"  Error: {resp.text[:300]}")
            return False
        
        data = resp.json()
        
        # Navigate response
        candidates = data.get("candidates", [])
        for cand in candidates:
            parts = cand.get("content", {}).get("parts", [])
            for part in parts:
                if "inlineData" in part:
                    b64 = part["inlineData"].get("data", "")
                    mime = part["inlineData"].get("mimeType", "image/png")
                    if b64:
                        img_bytes = base64.b64decode(b64)
                        output_path.write_bytes(img_bytes)
                        print(f"  Saved: {output_path} ({len(img_bytes)} bytes, {mime})")
                        return True
        
        print(f"  No image in response. Keys: {list(data.keys())}")
        # Print text response if any
        for cand in candidates:
            parts = cand.get("content", {}).get("parts", [])
            for part in parts:
                if "text" in part:
                    print(f"  Text response: {part['text'][:200]}")
        return False
        
    except Exception as e:
        print(f"  Exception: {e}")
        return False

# ── Nano Banana via Codefast ────────────────────────────────
def generate_nano_banana(prompt: str, output_path: Path) -> bool:
    """Use Nano Banana Pro via Codefast API."""
    api_key = os.environ.get("CODEFAST_API_KEY", "")
    if not api_key:
        print("  No CODEFAST_API_KEY")
        return False

    NANO_IMAGE_URL  = "https://geminiapi.codefast.app/v1/image"
    NANO_STATUS_URL = "https://geminiapi.codefast.app/v1/image/status"

    print(f"  [Nano Banana Pro] Sending request...")
    try:
        resp = requests.post(
            NANO_IMAGE_URL,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={"prompt": prompt, "aspect_ratio": "portrait", "model": "gemini-3.0-pro", "seed": None},
            timeout=180,
        )
        
        if not resp.ok:
            print(f"  Error: {resp.status_code} {resp.text[:200]}")
            return False
        
        payload = resp.json()
        job_id = payload.get("jobId") or payload.get("job_id")
        if not job_id:
            print(f"  No job ID: {json.dumps(payload)[:200]}")
            return False
        
        print(f"  Job ID: {job_id}, polling...")
        for attempt in range(30):
            time.sleep(5)
            status_resp = requests.post(
                NANO_STATUS_URL,
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={"job_id": job_id},
                timeout=180,
            )
            status_data = status_resp.json()
            job_status = ""
            if "job" in status_data and isinstance(status_data["job"], dict):
                job_status = status_data["job"].get("status", "")
            elif "status" in status_data:
                job_status = status_data["status"]
            
            print(f"    Poll {attempt+1}: {job_status}")
            
            if job_status == "SUCCESS":
                image_url = ""
                image_b64 = ""
                if "job" in status_data and isinstance(status_data["job"], dict):
                    image_url = status_data["job"].get("imageUrl") or status_data["job"].get("url") or ""
                    image_b64 = status_data["job"].get("imageBase64") or ""
                else:
                    image_url = status_data.get("imageUrl") or status_data.get("url") or ""
                
                if image_url:
                    img_resp = requests.get(image_url, timeout=120)
                    if img_resp.ok:
                        output_path.write_bytes(img_resp.content)
                        print(f"  Saved: {output_path} ({len(img_resp.content)} bytes)")
                        return True
                elif image_b64:
                    output_path.write_bytes(base64.b64decode(image_b64))
                    print(f"  Saved (base64): {output_path}")
                    return True
                else:
                    print(f"  SUCCESS but no image data!")
                    return False
            
            if job_status in {"ERROR", "CANCELED", "CANCELLED"}:
                print(f"  Job failed: {job_status}")
                return False
        
        print(f"  Timeout")
        return False
        
    except Exception as e:
        print(f"  Exception: {e}")
        return False


# ── Main ────────────────────────────────────────────────────
def main():
    print("=" * 60)
    print("BOOK COVER GENERATION TEST")
    print("=" * 60)
    
    providers = [
        ("vertex-imagen", generate_vertex_imagen),
        ("gemini-flash", generate_gemini_flash),
        ("nano-banana", generate_nano_banana),
    ]
    
    for book in BOOKS:
        print(f"\n{'='*60}")
        print(f"  {book['title']} by {book['author']}")
        print(f"  Genre: {book['genre']}")
        print(f"{'='*60}")
        
        prompt = build_prompt(book)
        print(f"  Prompt: {prompt[:150]}...")
        
        success = False
        for provider_name, generate_fn in providers:
            output_path = OUTPUT_DIR / f"{book['slug']}_{provider_name}.png"
            print(f"\n  --- Trying {provider_name} ---")
            if generate_fn(prompt, output_path):
                print(f"  SUCCESS with {provider_name}!")
                success = True
                break
            else:
                print(f"  {provider_name} failed, trying next...")
        
        if not success:
            print(f"  ALL PROVIDERS FAILED for {book['title']}")
    
    print(f"\n{'='*60}")
    print(f"  Output folder: {OUTPUT_DIR}")
    print(f"{'='*60}")
    
    # List generated files
    for f in OUTPUT_DIR.glob("*.png"):
        size_kb = f.stat().st_size / 1024
        print(f"  {f.name} ({size_kb:.0f} KB)")


if __name__ == "__main__":
    main()
