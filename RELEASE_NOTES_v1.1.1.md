# MOH v1.1.1 – Regelbasierte Prozesstreue

## Highlights

- Strengere und medizinisch sinnvollere Prozesstreueberechnung
- System-, Score-, Anzeige- und automatisch generierte Felder werden nicht mehr mitgezählt
- Folgetermine werden erst nach ausreichender Dokumentation des vorherigen Termins freigegeben
- Kapitelstatus bleibt erhalten, basiert jetzt aber auf relevanteren Prozessfeldern

## Geändert

### Prozesstreue

Die Prozesstreue zählt jetzt nur noch relevante Prozess-/Dokumentationsfelder. Ausgeschlossen werden u. a.:

- Scorefelder
- Gesamtscore
- Prozesstreue-Anzeigen
- Anzahl-/Systemfelder
- Tagesdatum / Uhrzeit
- automatisch generierte Diagnose-/Therapie-/Empfehlungsfelder
- technische Meta-Felder

Dadurch entspricht die Prozesstreue besser der tatsächlichen medizinischen Dokumentationsqualität.

### Folgetermin-Logik

Folgetermine werden nicht mehr durch wenige beliebige Eingaben freigeschaltet. Ein Folgetermin wird erst aktiv, wenn der vorherige Untersuchungstermin ausreichend dokumentiert ist.

Aktuell gilt:
- mindestens 80 % der relevanten Prozessfelder des Vortermins müssen dokumentiert sein
- gesperrte Folgetermine bleiben ausgegraut
- Tooltip erklärt den Sperrgrund

## Weiterhin enthalten

- Kapitelstatus mit offen / begonnen / vollständig
- Sprung zum ersten offenen Feld
- Scoreberechnung
- Prozesstreueanzeige
- Diagnose-/Therapie-Automatik
- Tagesdatum-Automatik
- Datensatzverwaltung
- Drucken, Speichern und Export
- Offline-Betrieb ohne Server

## Technischer Hinweis

v1.1.1 basiert auf v1.1.0 und ersetzt die generische Feldzählung durch eine regelbasierte Prozessfeld-Erkennung.
