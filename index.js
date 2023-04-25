const puppeteer = require('puppeteer');
const fs = require('fs/promises');

const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe'; // Pfad zu Chrome
const timeForLogin = 20000; // Zeit in Millisekunden, die für den Login benötigt wird
const minDiscount = 25; // Mindestrabatt, den das gefundene Produkt haben muss
const minPrice = 100; // Mindestpreis, den das gefundene Produkt haben muss

(async () => {
    // Öffne einen neuen Browser und eine neue Seite
    const browser = await puppeteer.launch({ headless: false, executablePath: chromePath, args: ['--start-maximized', '--disable-blink-features=AutomationControlled'] });
    const page = await browser.newPage();

    // Setze die Größe des Browserfensters auf die Größe des Bildschirms
    await page.setViewport({ width: 1920, height: 1080 });

    // Laden der Cookies aus einer Datei, um den Login-Status aufrechtzuerhalten
    await setCookies(page, 'skinportCookies.json');
    await setCookies(page, 'steamCookies.json');


    // Öffne die Login-Seite von skinport.com
    await page.goto('https://skinport.com/de/signin');
    console.log(`time for login: ${timeForLogin}ms`);

    // Warte für eine bestimmte Zeit, damit der Benutzer sich einloggen kann
    setTimeout(async () => {


        await safeCookies(page, 'https://skinport.com', 'skinportCookies.json');
        await safeCookies(page, 'https://steamcommunity.com', 'steamCookies.json');

        // Versuche, nach Schnäppchen zu suchen, versuche es neu wenn ein Timeout auftritt
        while (true) {
            try {
                await startChecking(page)
                break;
            } catch (error) {
                console.log("Fehler aufgetreten:", error);
                if (error.name != "TimeoutError") {
                    break;
                }
            }
        }
    }, timeForLogin)
})();

async function setCookies(page, file) {
    // Laden der Cookies aus einer Datei und zum Browser geben
    const cookiesString = await fs.readFile(file);

    try {
        const cookies = JSON.parse(cookiesString);
        await page.setCookie(...cookies);
    } catch (error) {
        console.error('Error parsing JSON:', error);
    }
}

async function safeCookies(page, site, file) {
    // Navigiere zur Seite und hole alle Cookies
    await page.goto(site);

    try {
        // Speichern der Cookies in eine Datei
        const currentCookies = await page.cookies();
        await fs.writeFile(file, JSON.stringify(currentCookies));
    } catch (error) {
        console.error('error while getting Cookies', error);
    }
}

async function startChecking(page) {
    // Navigiere zur Seite und warte darauf, dass das Live-Button-Element verfügbar ist
    await page.goto('https://skinport.com/de/market?sort=date&order=desc');

    try {
        await page.waitForSelector('.LiveBtn');
        await page.click('.LiveBtn');
    } catch (error) {
        console.error('No button', error);
    }

    // Überwache die Änderungen auf der Katalogseite
    await repeatOnPageChange(page, '.CatalogPage-content');
}



async function goToProduct(page, itemLink) {
    // Zur Produktseite navigieren
    await page.goto(`https://skinport.com${itemLink}`);
    await page.waitForTimeout(500);

    try {
        // Warten, bis die "Submit"-Schaltfläche auf der Seite erscheint und dann klicken
        await page.waitForSelector('.SubmitButton', { visible: true });
        await page.click('.SubmitButton');

        // Checkout durchführen
        await checkout(page);

    } catch (error) {
        console.error('No button', error);
    }
}


async function checkout(page) {
    // Zur Kasse gehen
    await page.goto(`https://skinport.com/de/cart`);

    // Checkboxen auf der Seite auswählen und anklicken
    try {
        await page.waitForSelector('.Checkbox-input');
        const checkboxes = await page.$$('.Checkbox-input');
        for (const checkbox of checkboxes) {
            await checkbox.click();
        }
    } catch (error) {
        console.error('Error selecting checkboxes', error);
    }

    // Weiter zur Kasse
    try {
        await page.waitForSelector('.SubmitButton', { visible: true });
        await page.click('.SubmitButton');
    } catch (error) {
        console.error('Error clicking submit button', error);
    }

    // Sofort-Zahlungsmethode auswählen
    try {
        await page.waitForSelector('.adyen-checkout__button', { visible: true });
        await page.click('.adyen-checkout__button');
    } catch (error) {
        console.error('Error clicking paymethod button', error);
    }



}


async function checkLiveBtn(page) {
    try {
        const btnSelector = '.LiveBtn';

        // Warten, bis der Button vorhanden und klickbar ist.
        await page.waitForSelector(btnSelector, { visible: true });

        // Überprüfen, ob der Button aktiv ist.
        const isActive = await page.$eval(btnSelector, (btn) =>
            btn.classList.contains('LiveBtn--isActive')
        );

        // Klicken auf den Button, falls er nicht aktiv ist.
        if (!isActive) {
            await page.click(btnSelector);
        }
    } catch (error) {
        console.error('Fehler bei der Überprüfung des Live-Buttons', error);
    }
}


async function checkItems(page) {
    // Alle Elemente mit der Klasse 'ItemPreview' auswählen
    const itemPreviewEls = await page.$$('.ItemPreview');

    // Schleife über alle Elemente mit der Klasse 'ItemPreview'
    for (const itemPreviewEl of itemPreviewEls) {
        // Rabatt-Element auswählen und Rabattwert ermitteln
        const discountEl = await itemPreviewEl.$('.ItemPreview-discount > span');

        if (discountEl) {
            // Rabattwert auslesen und in eine Zahl umwandeln
            const discountText = await discountEl.evaluate(element => element.textContent);
            const discountNumber = parseInt(discountText.match(/\d+/)[0]);

            // Preis auslesen und in eine Zahl umwandeln
            const priceEl = await itemPreviewEl.$('.ItemPreview-priceValue > .Tooltip-link');
            const priceText = await priceEl.evaluate(element => element.textContent.trim());
            const priceNumber = parseFloat(priceText.replace(/[^0-9,.]/g, '').replace(',', '.'));

            // Item- und Skin-Text auslesen
            const itemEl = await itemPreviewEl.$('.ItemPreview-itemTitle');
            const itemText = await itemEl.evaluate(element => element.textContent);
            const skinEl = await itemPreviewEl.$('.ItemPreview-itemName');
            const skinText = await skinEl.evaluate(element => element.textContent);

            // Auslesen des href-Attributs des Links
            const itemLinkEl = await itemPreviewEl.$('.ItemPreview-link');
            const itemLink = await itemLinkEl.evaluate(element => element.getAttribute('href'));

            console.log(`${itemText} ${skinText} ${priceNumber}€ -${discountNumber}% - ${itemLink}`)

            // Wenn Rabatt größer als minDiscount und Preis größer oder gleich minPrice, in den Warenkorb legen
            if (discountNumber >= minDiscount && priceNumber >= minPrice) {
                // Gehe zur Produktseite und füge das Produkt zum Warenkorb hinzu
                await goToProduct(page, itemLink)
            }
        }
    }
    console.log("---------------------------")
}


async function repeatOnPageChange(page, selector) {
    // Warten, bis das Element ausgewählt werden kann
    const el = await page.waitForSelector(selector);

    // Alten Wert des Elements speichern
    let oldValue = await el.evaluate(element => element.innerHTML);

    // Endlosschleife, die Änderungen überwacht
    while (true) {
        // Warten, bis sich der Wert des Elements ändert
        await page.waitForFunction((selector, oldValue) => {
            const el = document.querySelector(selector);
            const newValue = el.innerHTML;
            return newValue !== oldValue;
        }, {}, selector, oldValue);

        // Element auswählen
        const el = await page.$(selector);

        // Neuen Wert des Elements auswerten
        const newValue = await el.evaluate(element => element.innerHTML);

        // Wenn sich der Wert geändert hat
        if (newValue !== oldValue) {

            // Hier können weitere Aktionen bei einer Änderung durchgeführt werden
            await checkItems(page);
            await checkLiveBtn(page);

            // Alten Wert aktualisieren
            oldValue = newValue;
        }
    }
}
