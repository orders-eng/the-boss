# The Boss — Boutique Manager 🌸

ניהול עסק בוטיק — פשוט, מהיר, ויזואלי.
ממשק מבוסס אייקונים וצבעים, ללא צורך בקריאה.

---

## הפעלה מהירה

### שלב 1 — Supabase

1. צור פרויקט חדש ב-[supabase.com](https://supabase.com)
2. פתח **SQL Editor** והרץ את הקובץ:
   ```
   supabase/migrations/001_initial_schema.sql
   ```
3. העתק את ה-URL וה-ANON KEY מ-Settings → API

### שלב 2 — משתני סביבה

```bash
cp .env.example .env.local
```
מלאי את הערכים ב-.env.local

### שלב 3 — הפעלה

```bash
npm install
npm run dev
```

פתחי ב: http://localhost:3000

### שלב 4 — התקנה כ-PWA על הטלפון

1. פתחי ב-Safari (iOS) או Chrome (Android)
2. לחצי "Share" → "Add to Home Screen"
3. האפליקציה תיפתח כאפליקציה רגילה ✓

---

## ארכיטקטורה

```
the-boss/
├── supabase/migrations/     ← SQL לכל הטבלאות
├── src/
│   ├── app/                 ← Next.js pages
│   ├── components/
│   │   ├── screens/         ← מסכים ראשיים
│   │   └── ui/              ← רכיבים (NumPad, CategoryGrid...)
│   ├── lib/
│   │   ├── supabase/        ← client + queries
│   │   └── utils/           ← week, formatting
│   ├── types/               ← TypeScript interfaces
│   └── i18n/                ← תרגומים HE/EN/YI
└── public/
    └── manifest.json        ← PWA config
```

---

## מסכים (שלב א - MVP)

| מסך | תיאור |
|-----|--------|
| **בית** | מד רווחיות + כפתורי +/− ענקיים |
| **הוצאה** | CategoryGrid (אייקונים) → NumPad → שמור |
| **הכנסה** | PaymentPicker → NumPad → שמור |
| **ספקים** | רשימה + התראות זיכוי אדומות |
| **משלוח** | צילום תעודה + דיווח חוסר |
| **עובדים** | גריד תמונות + שעון נוכחות |
| **דוח** | דשבורד שבועי + ROI Matrix + PDF |

---

## שלבי פיתוח

- [x] **שלב א** — SQL + TypeScript types + מסך בית + NumPad
- [ ] **שלב ב** — ספקים + מצלמה + זיכויים
- [ ] **שלב ג** — דשבורד + ROI Matrix  
- [ ] **שלב ד** — Smart Reply + Caption (Claude API)
- [ ] **שלב ה** — נוכחות עובדים + דוח PDF

---

## סכמת DB

9 טבלאות, 2 views, 2 triggers:

```
owners → suppliers → inventory_batches → order_batch_links ← orders
                  ↓                                              ↑
           supplier_claims                              week_cycles
                                                               ↑
employees → staff_attendance ──────────────────────────────────┘
fixed_expenses ──────────────────────────────── weekly_profitability (view)
operational_expenses
```

**View קריטי:** `weekly_profitability` — מחשב אוטומטית:
- רווח גולמי = הכנסות − עלות סחורה
- רווח תפעולי = רווח גולמי − הוצאות תפעוליות  
- רווח נקי = רווח תפעולי − הוצאות קבועות שבועיות
- אחוז שולי רווח

---

Built with ❤️ — Next.js 14 + Supabase + TypeScript
