# Stack Guide: n8n och shadcn

## Stacköversikt

```
Cursor + Claude   → AI-assisterad utveckling
Next.js + Tailwind + shadcn  → Frontend
Supabase          → Backend (databas + auth + API)
n8n               → Automation
GitHub            → Versionskontroll
Vercel            → Hosting
```

---

## shadcn – Komponentbibliotek för Frontend

### Vad är shadcn?
shadcn/ui är ett **komponentbibliotek** byggt ovanpå Tailwind CSS och Radix UI.
Det är *inte* ett npm-paket du installerar – istället kopieras komponenternas
källkod direkt in i ditt projekt under `components/ui/`.

### Hur det passar in
- Används i **Next.js**-appen som färdiga, stilsatta UI-komponenter
- Bygger på **Tailwind CSS** (som redan finns i stacken) – inga extra stilfiler behövs
- Komponenter som `Button`, `Dialog`, `Form`, `Table`, `Card` m.fl. finns färdiga
- Eftersom koden ägs av dig kan du anpassa varje komponent fritt

### Typiskt användande
```tsx
// app/dashboard/page.tsx
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Dashboard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Välkommen</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Kom igång</Button>
      </CardContent>
    </Card>
  )
}
```

### Fördelar
| Fördel | Förklaring |
|---|---|
| Ingen overhead | Bara de komponenter du använder hamnar i projektet |
| Full kontroll | Du äger koden – anpassa fritt |
| Tailwind-native | Inga CSS-konflikter med resten av projektet |
| Tillgänglighet | Baserat på Radix UI som hanterar a11y åt dig |

---

## n8n – Automationslagret

### Vad är n8n?
n8n är ett **workflow-automationsverktyg** (liknande Zapier/Make) som du kan
köra self-hosted eller i molnet. Det kopplar ihop tjänster via ett visuellt
drag-and-drop-gränssnitt utan att du behöver skriva backend-kod för varje
integration.

### Hur n8n passar in i stacken

```
Next.js (Frontend)
     |
     | HTTP-anrop / Webhook
     ↓
   n8n Workflow
     |
     ├──→ Supabase (läs/skriv data)
     ├──→ Email (Sendgrid, Resend, SMTP)
     ├──→ Slack / Discord notiser
     ├──→ OpenAI / Claude API
     ├──→ Google Sheets, Airtable
     └──→ Valfri extern API
```

### Konkreta användningsfall

**1. Ny användare registrerar sig (via Supabase Auth)**
```
Supabase Webhook → n8n → Skicka välkomstmail → Lägg till i CRM → Notis i Slack
```

**2. Formulärinlämning från Next.js**
```
Next.js POST → n8n Webhook → Validera data → Spara i Supabase → Skicka bekräftelsemejl
```

**3. Schemalagda uppgifter**
```
Cron (varje natt) → n8n → Hämta data från Supabase → Generera rapport → Skicka via email
```

**4. AI-pipeline**
```
Trigger → n8n → Claude/OpenAI API → Bearbeta svar → Spara resultat i Supabase
```

### Varför n8n istället för att koda det i Next.js/Supabase?

| Scenario | Utan n8n | Med n8n |
|---|---|---|
| Skicka email vid ny order | Skriv API-route i Next.js, konfigurera email-SDK | Drag-and-drop i n8n, klart på minuter |
| Koppla in ny tjänst | Ny kod, deploy till Vercel | Ny nod i n8n, ingen deploy |
| Felhantering & retry | Bygg själv | Inbyggt i n8n |
| Icke-teknisk kan ändra flöden | Nej | Ja |

### n8n + Supabase – praktiskt
n8n har en inbyggd **Supabase-nod** som kan:
- Läsa/skriva rader
- Lyssna på Supabase Webhooks (Database Triggers)
- Anropa Supabase Edge Functions

### Hosting av n8n
- **n8n Cloud** – enklast, betaltjänst
- **Railway / Render** – self-hosted, billigt
- **VPS (t.ex. Hetzner)** – full kontroll, billigast i längden

---

## Hur delarna hänger ihop

```
Användaren interagerar med Next.js (shadcn-komponenter)
         |
         | Direkta anrop
         ↓
      Supabase
    (data, auth)
         |
         | Webhooks / Triggers
         ↓
        n8n
    (automation)
         |
         ├── Externa API:er
         ├── Email/notiser
         └── Tillbaka till Supabase
```

- **shadcn** = vad användaren *ser* (UI-lager i Next.js)
- **Supabase** = var data *lagras* och autentisering sker
- **n8n** = vad som *händer automatiskt* i bakgrunden när events triggas
