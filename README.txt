MOH Full-HD Offline Complete

Diese Version enthält garantiert die vier frisch hochgeladenen UI-Dateien:

- Score.ui
- ScoreDiagnostik.ui
- ScoreParkinson.ui
- ScorePostOP.ui

Start:
1. ZIP komplett entpacken
2. index.html per Doppelklick öffnen

Kein Server nötig.
Kein fetch.
Keine externen Dateien nötig.

Status Einbettung:
{
  "missing": [],
  "included": [
    "main",
    "diagnostik",
    "parkinson",
    "postop"
  ]
}


Patch v3:
- Kapitel-/Tabnavigation bleibt sticky sichtbar.
- Live-Score ist zustandsbasiert/idempotent.
- Score-Ausgabefelder werden nicht mehr in die Berechnung zurückaddiert.


Patch v4:
- Score wird nur für das aktive Kapitel / den aktiven Tab berechnet.
- Aktive Kapitelbezeichnung wird im Score-Panel angezeigt.
- Kapitelspalte bleibt auch beim horizontalen Scrollen links sichtbar.


Patch v5:
- Kapitel-/Tabnavigation wieder als kompakte Leiste oben.
- Keine breite fixierte Kapitelspalte mehr neben dem Inhalt.
- Der eigentliche Inhalt nutzt wieder die Breite.
- Score bleibt weiterhin pro aktivem Kapitel.


Patch v6:
- Kapitel-Leisten haben eigene horizontale Scrollbars.
- Bei ausgelagerten Modulen (Diagnostik, Parkinson, PostOP) wird die äußere Hauptleiste ausgeblendet.
- Die inneren Unterkapitel erscheinen dort direkt als primäre Kapitel-Leiste.


Patch v7:
- Die Kapitelleiste hat eine eigene horizontale Scrollbreite und scrollt unabhängig vom Formularinhalt.
- Bei Diagnostik, Parkinson und PostOP wird die künstliche Schein-Hauptkapitel-Ebene nicht nur versteckt, sondern aus dem DOM entfernt.
- Die echten Unterkapitel werden zur primären Kapitelleiste.


Patch v8:
- Pseudo-Kapitelleiste wird robuster entfernt: innere echte Tabstruktur mit mehreren Buttons ersetzt die Schein-Ebene.
- Auto-Regel-Engine ergänzt: Empfehlung-/Therapie-/Auswertung-/Beurteilungsfelder werden aus aktiven Kapitelwerten live befüllt.
- Automatisch befüllte Textfelder werden grünlich markiert und nur überschrieben, wenn sie leer oder bereits automatisch befüllt waren.


Patch v9:
- Erweiterte Auto-Regel-Engine ergänzt.
- Typische STARC-Automatiken werden browserseitig generisch abgebildet:
  * Zusatz-/Begründungsfelder aktivieren/deaktivieren
  * Textfelder aus Combobox-Auswahl spiegeln
  * Therapie-/Empfehlungs-/Auswertungstexte kapitelbezogen erzeugen
  * Progress-/Anzahlfelder befüllen
  * manuell geänderte Texte schützen
- Zusätzlich wurde eine Analyse der originalen Score.js als auto-rule-analysis.json beigelegt.

Aus Score.js automatisch erkannte Zuweisungs-Kandidaten:
{
  "total_assignment_candidates": 6408,
  "by_property": {
    "text": 891,
    "enabled": 1184,
    "currentIndex": 3936,
    "checked": 67,
    "value": 222,
    "styleSheet": 19,
    "plainText": 89
  }
}


Patch v10:
- Kapitelwechsel-Hinweise ergänzt.
- Passende Folgekapitel werden als Sprungbuttons vorgeschlagen, aber nicht automatisch erzwungen.
- Regeln u. a. für Tinnitus, CI, FDN/CRS/MUCS/FESS/DUPM, PostOP-Folgezeitpunkte, Parkinson/Logo/Ergo, Schwindel und Dysphagie.


Patch v11:
- Alternative Kapitelauswahl als Combobox repariert.
- Combobox wird aus der aktuell sichtbaren Kapitelleiste erzeugt.
- Auswahl in der Combobox löst denselben Klick aus wie ein Kapitelbutton.
- Aktiver Button synchronisiert zurück in die Combobox.


Patch v12:
- Bei Diagnostik, Parkinson und PostOP bleibt die äußere Ebene „Seite 2 / Seite 1“ erhalten.
- Die alte große Schein-Kapitelleiste innerhalb von Seite 2 wird durch das passende echte Unterkapitel-System ersetzt.
- Diagnostik -> Diagnostik-Unterkapitel, Parkinson -> Mb. Parkinson/PKS-Unterkapitel, PostOP -> post OP-Unterkapitel.


Patch v13:
- Diagnostik: altes Einstiegskapitel "Diagnostik" wird automatisch geöffnet.
- Parkinson: altes Einstiegskapitel "Mb. Parkinson" wird automatisch geöffnet.
- PostOP: altes Einstiegskapitel "post OP" wird automatisch geöffnet.
- Die Scheinleiste dieser Einstiegskapitel wird ausgeblendet.
- Seite 1 / Seite 2 bleibt weiterhin sichtbar.


Patch v14:
- Infofeld standardmäßig ausgeblendet.
- Einstiegskapitel Diagnostik / Mb. Parkinson / post OP werden automatisch geöffnet.
- Die Inhalte der Unterkapitel bleiben sichtbar.
- Die alte Schein-Kapitelleiste wird nur optisch reduziert, nicht mehr strukturell zerstört.


Patch v15:
- Expliziter verzögerter Auto-Klick auf Einstiegskapitel:
  Diagnostik, Mb. Parkinson/PKS, post OP.
- Fallback-Retries nach Rendering, damit verschachtelte Tabs bereits vorhanden sind.
- Prozesstreue-Berechnung pro aktivem Kapitel ergänzt.
- Prozesstreue zeigt Prozent und erledigte/relevante Felder.


Patch v16:
- Prozesstreue ist jetzt dauerhaft links unter dem Live-Score sichtbar.
- Haupt-/Pseudo-Kapitelleiste bei Diagnostik, PKS/Mb. Parkinson und PostOP bleibt vorerst sichtbar.
- Der automatische Klick auf das passende gleichlautende Kapitel bleibt aktiv und wird grün markiert.


Patch v17:
- Kapitelhinweise werden nur noch angezeigt, wenn ein starker, passender Trigger existiert.
- Ohne passenden Treffer wird der gesamte Hinweisbereich ausgeblendet.
- Leere oder generische Kapitelhinweise werden unterdrückt.


Patch v18:
- Die Hauptkapitelleiste bleibt nach dem Auto-Klick im DOM.
- Sie wird nur visuell ausgelagert (nicht gelöscht, nicht display:none).
- Die alternative Kapitelauswahl ignoriert diese versteckte DOM-Leiste und nutzt die sichtbare Unterkapitelleiste.


Patch v19:
- Prozesstreue aktualisiert jetzt unabhängig von ausgelagerten/versteckten Hauptleisten.
- Aktualisierung erfolgt bei Eingabe, Tabwechsel, Auto-Klick und zusätzlich periodisch.
- Inaktive/ausgelagerte Hauptleisten zählen nicht in die Prozesstreue hinein.


Patch v20:
- Prozesstreue nutzt jetzt den tiefsten sichtbaren aktiven Tab-Pane.
- Fallback auf activeScoreScope und danach auf alle sichtbaren RenderRoot-Felder.
- Zusätzliche globale Input/Change/Tabclick-Hooks aktualisieren die Anzeige sofort.


Patch v21:
- Prozesstreue wurde aus der linken Sidebar entfernt.
- Prozesstreue ist jetzt als fixierte Leiste unten rechts im Inhaltsbereich sichtbar.
- Berechnung wird nach Live-Score-Aktualisierung und zusätzlich über einen leichten Watchdog synchronisiert.


Patch v22:
- Ursache: Prozesstreue nutzte eigene Scope-Logik, während Live-Score korrekt über recalc() lief.
- Prozesstreue wird jetzt direkt aus demselben recalc()-Durchlauf gespeist wie der Live-Score.
- Damit kann die Anzeige nicht mehr vom Live-Score abweichen.


Patch v23:
- Prozesstreueberechnung wurde aus der funktionierenden Version 15 zurückübernommen.
- Anzeige bleibt unten rechts fixiert.
- Die Berechnung ist wieder vom späteren Scope-Umbau entkoppelt.


Patch v24:
- Zwischenscore-Logik ergänzt.
- Mucosa/MUCS-Teilscore wird aus naheliegenden Mucosa-Feldern berechnet.
- Generische Teilscore-Felder werden aus Feldern im gleichen Block berechnet.
- Zurück-/Return-Schaltflächen werden nur im aktiven Detail-/Unterkapitelbereich angezeigt.


Patch v27:
- Basis wieder v24.
- Keine großen Layoutänderungen.
- Nur Label- und Comboboxbreiten vereinheitlicht.
- Comboboxen enden jetzt sauber untereinander.


Patch v28:
- Comboboxen/Eingabefelder im rechten Eingabebereich rechtsbündig ausgerichtet.
- Alte STARC-Aktionsbuttons aktiviert:
  * Drucken / Print -> Browser-Druckdialog
  * Speichern / Save -> aktueller Datensatz wird gespeichert
  * Export -> JSON Export
  * Abbrechen / Cancel -> Eintrag neu laden oder neuen Eintrag zurücksetzen


Version v37:
- Stabiler Rücksprung auf v28 als Basis.
- Scoreberechnung und Prozesstreueberechnung entsprechen wieder dem funktionierenden Stand v28.
- Spätere experimentelle Eingriffe an Score/Prozesstreue wurden bewusst nicht übernommen.


Patch v38:
- Infofeld vollständig entfernt.
- Keine Ein-/Ausblendlogik mehr nötig.


Patch v39:
- Seite 1: nicht anwählbare Felder werden automatisch befüllt, wenn ableitbar.
- Ableitbar sind z. B. Datum, Uhrzeit, Score, Prozesstreue, Kapitel, Anzahl/Feldzählung, Modus.
- Wenn keine sichere Automatik existiert, wird das Feld entsperrt und manuell bearbeitbar.
- Automatisch befüllte Felder sind grün markiert, freigeschaltete Felder orange.


Patch v40:
- Seite 1: Diagnose- und Therapiefelder werden automatisch befüllt.
- Grundlage: aktives Kapitel, Score, Prozesstreue, gesetzte Kriterien und vorhandene Empfehlungs-/Therapietexte.
- Manuell geänderte Texte werden nicht überschrieben.


Patch v41:
- Diagnose und Therapie auf Seite 1 werden live immer vollständig neu berechnet.
- Alte automatisch erzeugte Inhalte werden vor jeder Neubefüllung ersetzt.
- Dadurch laufen die Felder nicht mehr voll.
- Wenn der Nutzer ein Auto-Feld manuell bearbeitet, wird es geschützt und nicht weiter überschrieben.


Patch v42:
- Diagnose/Therapie werden nur noch neu geschrieben, wenn sich der berechnete Text wirklich geändert hat.
- Kein vorheriges Leeren mehr.
- Kein Flackern/Unruhe durch dauerndes Neusetzen.
- Manuell geänderte Inhalte bleiben geschützt.


Patch v43:
- Diagnose verwendet nicht mehr den generischen Titel "Hauptteil".
- Therapie-Text wird normalisiert.
- Führende Punkte/Bullets werden bereinigt.
- Seite-1-Auto-Therapie wird nicht mehr erneut als Quelle eingelesen.


Patch v44:
- Diagnose enthält jetzt mindestens das konkrete aktive Kapitel/Unterkapitel.
- Technische Wrapper wie Hauptteil, Seite 1/2, Diagnostik, post OP, Mb. Parkinson werden als Diagnose-Titel gefiltert.
- Falls zusätzlich aus Kriterien ein Diagnosebereich ableitbar ist, wird er als Bereich ergänzt.


Patch v45:
- Tagesdatum-Felder werden automatisch auf das aktuelle Datum gesetzt.
- Alte Platzhalter wie 01.01.2018 werden ersetzt.
- Unterstützt deutsches Datumsformat und HTML-Datefelder.


Patch v47:
- Basis wieder v45-Darstellung.
- Nur Info-Button und Infofeld entfernt.
- Keine v46-Layoutänderungen übernommen.


Patch v48:
- Abschlusszeile mit Prozesstreue / Anzahl der Elemente / Gesamtscore entfernt.
- Schwebende Prozesstreue-Anzeige bleibt erhalten.


Patch v50:
- v49 zurückgenommen, weil es Kapitelcontainer ausblenden konnte.
- Abschlusszeile wird jetzt sicherer entfernt: nur Labels/Felder und sehr kleine direkte Hüllen.
- Kapitelinhalte bleiben sichtbar.


Patch v51:
- Linke Datensatz-Combobox ("Eintrag laden") jetzt exakt so breit wie die Buttons darüber.
- Restliches Layout unverändert.

MOH v1.1.0 – Prozesstreue 2.0

- Kapitelstatus in der linken Seitenleiste
- Status je Kapitel: vollständig / begonnen / offen
- Prozentanzeige je Kapitel
- Schaltfläche "Zum ersten offenen Feld"
- Markierung fehlender Prozess-/Pflichtfelder
- Markierung vollständig ausgefüllter Felder
- Kapitelbuttons erhalten Validierungsstatus


MOH v1.1.1 – Regelbasierte Prozesstreue

- System-/Auto-/Scorefelder aus Prozesstreue ausgeschlossen
- Kapitelstatus basiert auf relevanten Prozessfeldern
- Folgetermin-Freigabe strenger: vorheriger Termin muss ausreichend dokumentiert sein
- Tooltip für gesperrte Folgetermine ergänzt
