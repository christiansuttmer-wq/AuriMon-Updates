# AuriMon Autopilot – GitHub baut und signiert die APK

Das ist das komplette AuriMon-v1.4.22-Projekt (Code 160) mit einer NEUEN, cloudbasierten Update-Pipeline.

## Wichtige Voraussetzung / Datenschutz

Das bestehende GitHub-Repository `christiansuttmer-wq/AuriMon-Updates` ist OEFFENTLICH.
Wer die Einrichtung startet, laedt auch den AuriMon-QUELLCODE in dieses oeffentliche Repository hoch.
Die privaten Dateien `release-key.jks` / `release-signing.properties` werden NICHT in Git eingecheckt.
Falls du den Quellcode nicht oeffentlich machen moechtest, EINRICHTUNG NICHT STARTEN.
Dann sollte erst ein privates Quell-Repository angelegt und ein separater Release-Zugang eingerichtet werden.

## Nur EINMAL notwendig

1. ZIP in eigenen Ordner entpacken.
2. Git und GitHub CLI `gh` muessen installiert und bei GitHub angemeldet sein (aus den bisherigen Updates meist vorhanden).
3. `AURIMON_AUTOPILOT_EINRICHTEN.cmd` doppelt anklicken.

Das Skript sucht den BISHERIGEN Signaturschluessel aus den alten AuriMon-Projektordnern.
Es erstellt keinen neuen Schluessel. Es uebertraegt den alten Keystore und die Passwoerter ausschliesslich als
GitHub Actions Secrets in verschluesselter Form und schiebt den bereinigten Quellcode ins Repo.
Der erstmalige Push startet einen Build von v1.4.22.

## Danach

Ab dann kann ChatGPT ueber die verbundene GitHub-Integration den Quellcode im Repository bearbeiten.
Eine Veroeffentlichung wird durch eine Aenderung von `release/next-release.txt` gestartet.
Der Eintrag muss mit `versionName` in `app/build.gradle.kts` uebereinstimmen, und `versionCode` muss groesser sein
als die bisherige APK. Erst wenn APK-Paketkennung, Version und Signatur exakt passen,
veroeffentlicht GitHub Actions die neue `AuriMon-release.apk` und deren SHA-256-Pruefsumme.

Bis dahin gibt es KEINE neue APK. GitHub Actions muss fuer das Repo aktiviert sein.
Fuer spaetere Updates ist kein PC erforderlich (ausser wenn einmalige GitHub-Berechtigungen auslaufen).

Pruefseite: https://github.com/christiansuttmer-wq/AuriMon-Updates/actions
Release-Seite: https://github.com/christiansuttmer-wq/AuriMon-Updates/releases

## Sicherheitsregeln

- Niemals Keystore, Passwoerter, Token oder lokale Properties in den Chat oder Git-Commits hochladen.
- Niemals die installierte App deinstallieren muessen: Bei abweichender Signatur stoppt der Build.
- Versionscode wird nicht heimlich geaendert; er ist im Projekt festgelegt.
- Kein automatischer Upload beim blossen Aendern von anderen Projektdateien.
- Es gibt keinen Beweis fuer funktionierendes CI bis ein echter GitHub-Run erfolgreich durch ist.
