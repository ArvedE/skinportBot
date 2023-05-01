# README

Dies ist ein Node.js-Skript, das Puppeteer verwendet, um nach Schnäppchen auf der Website skinport.com zu suchen und den Checkout-Vorgang durchzuführen.

## Voraussetzungen

- Node.js installiert: [Node.js-Website](https://nodejs.org/)
- Puppeteer-Paket installieren: Führe `npm install puppeteer` im Terminal aus.

## Konfiguration

1. Pfade anpassen:
   - Überprüfe den Pfad zu deiner Chrome-Installation und aktualisiere `chromePath` in der `index.js`-Datei, falls erforderlich.
2. Einstellungen anpassen:
   - Du kannst die Wartezeit für den Login (`timeForLogin`), den Mindestrabatt (`minDiscount`) und den Mindestpreis (`minPrice`) in der `index.js`-Datei anpassen.

## Ausführen des Skripts

1. Stelle sicher, dass du dich im Projektverzeichnis befindest.
2. Öffne ein Terminal und führe `node index.js` aus.
3. Das Skript öffnet einen neuen Browser, dort hast du solange Zeit dich anzumelden wie du in der `index.js`-Datei angegeben hast. Nach dem Login wechselt der Bot auf die Kategorieseite und überwacht dann die neuen Skins die auf dem Marktplatz zum Verkauf gestellt wurden.
4. Wenn ein Produkt mit ausreichendem Rabatt und Preis gefunden wird, wird der Checkout-Vorgang automatisch durchgeführt.


## Hinweise

- Die Dateien `skinportCookies.json` und `steamCookies.json` werden verwendet, um den Login-Status aufrechtzuerhalten. Stelle sicher, dass diese Dateien vorhanden sind.
- Die gefundenen Schnäppchen werden in der Konsole ausgegeben.
- Der Checkout-Vorgang führt bis zur Zahlungsmethode "Sofort" durch. Du kannst diese Methode nach deinen Bedürfnissen anpassen.
- Das Skript überwacht die Katalogseite auf Änderungen und führt die Schnäppchenprüfung erneut durch, wenn sich etwas ändert.

Viel Spaß beim Verwenden des Skripts! Bei Fragen oder Problemen kannst du dich gerne an mich wenden.
