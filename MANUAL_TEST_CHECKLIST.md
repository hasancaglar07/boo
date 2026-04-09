# Manual Test Checklist - Preview Page Redesign
**Date:** 2026-04-09
**Server:** http://localhost:3000

---

## 🎯 TEST SCENARIOS

### 1. Preview Page - Free User Test

**Setup:**
1. Open http://localhost:3000
2. Login as a free user (or create a test book)
3. Navigate to a preview page

**Expected Results:**
- ✅ Hero section shows book cover prominently
- ✅ Status message: "Writing your book... (usually takes 1-2 minutes)"
- ✅ Three large buttons: "Read Chapter 1", "Download PDF", "Download EPUB"
- ✅ All buttons are **h-14 px-8** size (larger than before)
- ✅ Lock icons appear on download buttons if preview not ready
- ✅ "Read Chapter 1" button scrolls to content

**After First Chapter Ready:**
- ✅ Status: "Preview Ready - First chapter is ready!"
- ✅ Chapter content displays with serif fonts
- ✅ **"Want to read more?" card appears** with:
  - "Want to read the rest?" heading
  - "Get instant access to all X chapters plus downloads"
  - Three benefit icons (Full book access, PDF & EPUB downloads, Cover customization)
  - "Unlock Full Book · $4" button
- ✅ Download buttons still show lock icons for free users

---

### 2. Preview Page - Premium User Test

**Setup:**
1. Upgrade to premium or login as premium user
2. Navigate to preview page

**Expected Results:**
- ✅ NO "Want to read more?" card (premium users don't see it)
- ✅ Download buttons are unlocked (no lock icons)
- ✅ "Download PDF" and "Download EPUB" work correctly
- ✅ Cover upload section is visible and functional

---

### 3. Button Size Verification

**Inspect Elements:**
1. Right-click on "Read Chapter 1" button → Inspect
2. Check CSS classes: Should include `h-14 px-8`
3. Check font-size: Should be `text-base` (16px)
4. Repeat for PDF and EPUB buttons

**Expected:**
- ✅ All buttons are significantly larger than before
- ✅ Buttons are easy to click on mobile
- ✅ Icons are `size-5` (20px)

---

### 4. Status Messaging Test

**While Book is Generating:**
- ✅ Status: "Writing your book... (usually takes 1-2 minutes)"
- ✅ Spinner animation visible
- ✅ Page updates automatically

**After First Chapter Ready:**
- ✅ Status: "Preview Ready - First chapter is ready!"
- ✅ Green checkmark icon
- ✅ No more spinner

**After Book Complete:**
- ✅ Status: "Complete - Your book is ready!"
- ✅ All chapters accessible

---

### 5. Responsive Design - Mobile Test

**Setup:**
1. Open Chrome DevTools (F12)
2. Click device toolbar icon
3. Select iPhone 12 Pro or similar

**Expected Results:**
- ✅ Book cover is appropriately sized
- ✅ Three buttons stack vertically on mobile
- ✅ "Want to read more?" card fits mobile screen
- ✅ All text is readable without horizontal scrolling
- ✅ Buttons remain tappable (minimum 44px height)

---

### 6. CTA Functionality Test

**Test Each Button:**

**"Read Chapter 1" Button:**
- [ ] Click button
- [ ] Page scrolls smoothly to chapter preview
- [ ] Chapter content is visible
- [ ] No console errors

**"Download PDF" Button (Free User):**
- [ ] Click button
- [ ] Upgrade dialog appears
- [ ] Event tracking fires: `paywall_pdf_clicked`

**"Download PDF" Button (Premium User):**
- [ ] Click button
- [ ] PDF generation starts
- [ ] "Generating..." text appears
- [ ] PDF downloads successfully

**"Unlock Full Book" Button:**
- [ ] Click button in "Want to read more?" card
- [ ] Upgrade dialog appears
- [ ] Event tracking fires: `paywall_full_unlock_clicked`

---

### 7. Console Error Check

**Open Browser Console (F12 → Console):**

**Expected:**
- ✅ NO red errors
- ✅ NO React warnings
- ✅ NO TypeScript runtime errors
- ✅ All images load successfully
- ✅ All API calls return 200 status

**Common Issues to Check:**
- Missing images (book covers, avatars)
- Failed API calls
- Undefined variables
- Component lifecycle warnings

---

### 8. Typography Test

**Expected Fonts:**
- ✅ Headings use `Playfair Display` (serif)
- ✅ Body text uses `Source Serif Pro` (serif)
- ✅ Buttons use sans-serif font
- ✅ All text is readable and properly spaced

**Check Elements:**
- Book title: Large, bold, serif
- Chapter content: Readable serif font, proper line height
- Button labels: Clear, appropriately sized

---

### 9. Performance Test

**Check Page Load:**
1. Open DevTools → Network tab
2. Reload preview page
3. Check load time

**Expected:**
- ✅ Initial load < 5 seconds
- ✅ Time to Interactive < 8 seconds
- ✅ No large layout shifts (CLS < 0.1)
- ✅ Images are optimized (WebP format)

---

### 10. Cross-Browser Test (Optional)

**Test In:**
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if on Mac)

**Expected:**
- ✅ All features work identically
- ✅ No browser-specific bugs
- ✅ Consistent styling

---

## 🐛 BUG REPORTING TEMPLATE

If you find any issues, report them with:

```markdown
**Bug Title:** [Brief description]

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Screenshot:**
[Attach screenshot]

**Console Errors:**
[Paste any console errors]

**Browser:**
[Chrome/Firefox/Safari + Version]
```

---

## ✅ SUCCESS CRITERIA

All tests pass if:
- [ ] No console errors
- [ ] All buttons are correct size (h-14 px-8)
- [ ] "Want to read more?" card appears for free users
- [ ] "Want to read more?" card does NOT appear for premium users
- [ ] All CTAs are functional
- [ ] Mobile responsive design works
- [ ] Typography looks correct (serif fonts)
- [ ] Status messages are clear and helpful

---

**Next Steps After Testing:**
1. Fix any bugs found
2. Merge `ux-ui-improvements` → `main`
3. Deploy to staging
4. Run final smoke tests
