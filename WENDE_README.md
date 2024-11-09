# Code Analyzer Assistant API Documentation

Base URL: `http://127.0.0.1:5000/api`

## Endpunkte

### 1. Code Analyse Anfragen

**Endpoint:** `/analyze`
**Method:** POST
**Content-Type:** application/json

**Request Body:**

```json
{
  "task": "string (required) - Beschreibung der Aufgabe/Anfrage",
  "repoPath": "string (required) - Pfad zum lokalen Repository",
  "confirm": "boolean (optional, default: false) - Direktanalyse überspringen"
}
```

**Response (bei confirm=false):**

```json
{
  "needsConfirmation": true,
  "requestId": "string - Unique ID für die Anfrage",
  "estimatedTokens": "number - Geschätzte Token-Anzahl",
  "estimatedCost": "number - Geschätzte Kosten in USD"
}
```

**Mögliche Fehler:**

- 400: "Task und Repository-Pfad sind erforderlich"
- 415: "Unsupported Media Type. Expected 'application/json'"
- 500: "Analyse-Fehler: [Fehlermeldung]"

### 2. Analyse Bestätigung

**Endpoint:** `/confirm_analysis`
**Method:** POST
**Content-Type:** application/json

**Request Body:**

```json
{
  "requestId": "string (required) - ID der ursprünglichen Analyse-Anfrage"
}
```

**Success Response:**

```json
{
  "files": ["array of strings - Relevante Dateipfade"],
  "recommendations": "string - Detaillierte Analyse und Empfehlungen",
  "needsConfirmation": false
}
```

**Mögliche Fehler:**

- 400: "Ungültige Anforderungs-ID oder die Anfrage ist abgelaufen"
- 415: "Unsupported Media Type"
- 500: "Analyse-Fehler: [Fehlermeldung]"

### 3. Follow-up Fragen

**Endpoint:** `/ask`
**Method:** POST
**Content-Type:** application/json

**Request Body:**

```json
{
  "question": "string (required) - Die Nachfrage zum vorherigen Kontext"
}
```

**Success Response:**

```json
{
  "recommendations": "string - Antwort auf die Nachfrage",
  "needsConfirmation": false
}
```

**Mögliche Fehler:**

- 400: "Frage ist erforderlich"
- 415: "Unsupported Media Type"
- 500: "Fehler bei der Nachfrage: [Fehlermeldung]"

## Allgemeine Informationen

### Authentifizierung

- Aktuell keine Authentifizierung erforderlich
- CORS ist aktiviert für Frontend-Zugriff

### Rate Limiting

- Aktuell kein Rate Limiting implementiert
- Timeout für Anfragen: 300 Sekunden (5 Minuten)

### Fehlerhandling

Alle Fehlerantworten folgen diesem Format:

```json
{
  "error": "string - Beschreibung des Fehlers"
}
```

### Best Practices

1. Immer zuerst eine Analyse mit `confirm=false` durchführen
2. Kosten und Token-Schätzung dem Benutzer anzeigen
3. Erst nach Bestätigung die vollständige Analyse durchführen
4. Follow-up Fragen nur nach erfolgreicher Initialanalyse stellen

### Caching

- Analyse-Anfragen werden temporär zwischengespeichert
- Cache-Dauer: Bis zur Bestätigung oder Serverneustart
- Request IDs verfallen nach Verwendung

### Performance

- Analysen können je nach Repositorygröße mehrere Sekunden dauern
- Timeout bei 300 Sekunden
- Große Repositories können zu längeren Verarbeitungszeiten führen

### Beispiel-Workflow

1. Initiale Anfrage an `/analyze` mit confirm=false
2. Kostenbestätigung vom Benutzer einholen
3. Bestätigung an `/confirm_analysis` senden
4. Ergebnisse anzeigen
5. Optional: Follow-up Fragen über `/ask` stellen
