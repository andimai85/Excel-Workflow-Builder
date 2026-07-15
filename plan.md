
# Workflow-Generator aus Excel

Ein 100% offline im Browser laufendes Tool. Excel-Datei wird lokal geparst (kein Server, kein Upload), Bearbeitungsstand wird automatisch im LocalStorage gespeichert, Export als Excel/CSV mit Status möglich.

## Umfang

### 1. Startseite (Generator-Konfiguration)
- Drag-and-drop / Datei-Auswahl für die `.xlsx`
- Auswahl der Darstellung: **Vertikal**, **Horizontal**, **Swimlane**
- Button "Workflow generieren"
- Anzeige zuletzt geladener Workflows aus LocalStorage (weiterarbeiten / löschen)

### 2. Excel-Parsing (Browser, via `xlsx` / SheetJS)
Erwartete Struktur (aus der Beispieldatei erkannt):
- Zeile 1: RACI-Gruppen-Kopf (R=Responsible, A=Accountable, C=Consulted, I=Informed) über den FB-Spalten
- Zeile 2: Spaltenüberschriften `Deliverables | Dauer | Phase | Ablage in | MS | Schritt | FB1 … FB23`
- Ab Zeile 3: Schritte
  - `Schritt`: Titel
  - `Phase`: nur erste Zelle jeder Phase gefüllt → nach unten "durchreichen" bis nächste Phase
  - `MS = "x"` → Meilenstein
  - `Ablage in` (z.B. `PO`) → automatisch Checklisten-Punkt "Abgelegt in {Wert}"
  - `Deliverables` → automatisch Checklisten-Punkt "Deliverable erstellt: {Wert}"
  - `Dauer` → im Detail angezeigt
  - `FB1..FB23`-Zellen: `R`, `A`, `C`, `I` oder Kombinationen (`A/R`) → RACI je Schritt

### 3. Editierbare Verantwortlichen-Tabelle (RACI-Header)
- Panel mit einer Zeile je FB (FB1 … FB23, nur belegte)
- Felder: Vorname, Nachname, optional Rolle
- Speicherung pro Workflow im LocalStorage
- Namen ersetzen die FB-Kürzel in allen Ansichten und der RACI-Matrix

### 4. Ansichten (umschaltbar zur Laufzeit)
Alle drei stellen dieselben Daten dar; oben ein Umschalter (Vertikal / Horizontal / Swimlane).
- **Vertikal**: Karten untereinander, Phasen als farbige Hintergrundbänder, Meilenstein als Rautenform mit Stern und Gold-Akzent
- **Horizontal**: Karten in Reihe, Phasen als farbige Spalten-Abschnitte, horizontal scrollbar
- **Swimlane**: Zeilen pro Verantwortlichem (Person mit R-Rolle im Schritt); mehrere R? → Schritt erscheint in der Lane des ersten Responsible, weitere Rollen sichtbar auf Karte

Gemeinsam auf jeder Karte:
- Titel (Schritt-Name)
- Kompakt-Badges für Rollen mit Namens-Kürzel (R rot, A blau, C gelb, I grau)
- Meilenstein-Kennzeichnung (Rautenform + Stern-Icon + Rahmenfarbe)
- Ablage-Chip (z.B. "PO") wenn `Ablage in` gesetzt
- Status: offen / in Arbeit / erledigt (Häkchen)
- Klick auf Karte → Detail-Panel

### 5. Detail-Panel je Schritt
- Voll ausgeklappte RACI-Matrix mit Personennamen
- Deliverable, Ablage-Ort, Dauer, Phase
- Konfigurierbare Checkliste: 
  - Vorbelegt (aus Excel abgeleitet): "Deliverable erstellt", "Abgelegt in {Ablage in}"
  - Nutzer kann Punkte hinzufügen, umbenennen, löschen
  - Schritt gilt automatisch als abgeschlossen, wenn alle Punkte gehakt sind (oder manuell per "Erledigt"-Toggle bei leerer Checkliste)
- Freitext-Notiz je Schritt

### 6. Persistenz & Export
- **Auto-Save**: Bei jeder Änderung in LocalStorage (Schlüssel je Workflow: Datei-Hash + Name)
- **Export**: Button "Als Excel exportieren" → aktualisiertes `.xlsx` mit zusätzlichen Spalten `Status`, `Checkliste`, `Notizen`, `Verantwortliche (Namen)`
- Alternativ CSV-Export

## Technische Details

- Stack: TanStack Start (bereits vorhanden), React, Tailwind v4, shadcn/ui
- Excel-Parsing und -Export: `xlsx` (SheetJS) — läuft rein im Browser
- Alles clientseitig — keine Server-Function, keine Lovable Cloud nötig
- Routen:
  - `/` — Generator-Startseite (Datei-Upload, Ansichts-Auswahl, gespeicherte Workflows)
  - `/workflow/$id` — geladene Workflow-Ansicht mit Ansichts-Umschalter und Detail-Panel
- State: Zustand-Store oder React Context + `useSyncExternalStore` auf LocalStorage
- Design-Tokens für die 3 RACI-Farben und bis zu ~8 Phasen-Farben werden in `src/styles.css` als semantische Tokens angelegt (HSL/oklch), damit Dark-Mode später möglich ist
- Meilenstein: eigenes Karten-Variant (Raute via CSS-Transform oder SVG-Wrapper)

## Offen (kann während des Bauens entschieden werden)
- Farb-Zuordnung der Phasen: automatisch aus fester Palette in Reihenfolge (Phase 1 = blau, Phase 2 = grün, Phase 3 = amber, …) — änderbar später
- Bei Swimlane werden nur FBs als Lanes angezeigt, die in mindestens einem Schritt eine `R` (oder `A/R`) haben
