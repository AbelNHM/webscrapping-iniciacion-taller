// Recogemos los datos de Idelista

const puppeteer = require('puppeteer');
const fs = require('fs');

// Funcion que crea un número aleatorio 
const MIN_WAIT = 2000;
const MAX_WAIT = 5000;
const randomWait = () => {
    return Math.floor(Math.random() * (MAX_WAIT - MIN_WAIT + 1) + MIN_WAIT);
}

// url de búsqueda
let url = 'https://www.idealista.com/alquiler-viviendas/madrid/retiro/pacifico/';

(async() => {
    try {
        const browser = await puppeteer.launch({ headless: false });
        const context = await browser.createIncognitoBrowserContext();
        const page = await context.newPage();

        // Con la siguiente Linea podemos tomar el control de qué se carga y que no
        await page.setRequestInterception(true);

        page.on('request', request => {
            // Aquí localizamos el script que cargan anti-bot
            // mirad el contenido del script : https://www.idealista.com/px/client/main.min.js
            if (/main\.min.\js/.test(request.url())) {
                console.log(`Skipping : [${request.url()}]`);
                // Impedimos que se cargue
                request.abort();
            } else {
                request.continue();
            }
        });

        await page.goto(url);
        const numPages = await getNumPages(page);

        let housingData;
        let data;

        //Extraemos la información: creamos un bucle que itera cada una de las páginas del navegador.
        for (let i = 2; i <= numPages; i++) {
            (housingData === undefined) ? housingData = []: housingData = [...data];
            console.log(housingData);
            data = await page.evaluate((housingData) => {
                let housing = [...document.querySelectorAll('#main-content > section > article')];
                housing.forEach((house) => {
                    let houseJson = {};
                    try {
                        houseJson.descripcion = house.querySelector('#main-content > section > article > div > a').innerText;
                        //houseJson.id = house.querySelector('#main-content > section > article > div > a').getAttribute('adid');son uno misnistros y no puedo pillar el id
                        houseJson.id = house.querySelector('#main-content > section > article > div > a').href.slice(35, -1);;
                        houseJson.precio = house.querySelector('#main-content > section > article > div > div.row.price-row.clearfix > span').innerText;
                        houseJson.habitaciones = house.querySelector('#main-content > section > article > div > span:nth-child(4)').innerText;
                        houseJson.metros = house.querySelector('#main-content > section > article > div > span:nth-child(5)').innerText;
                    } catch (exception) {
                        console.log(exception);
                    }
                    housingData.push(houseJson);
                });
                return housingData;
            }, housingData);
            await page.waitFor(randomWait());
            let pageUrl = url + `pagina-${i}.htm`;
            await page.goto(pageUrl);
            console.log(data);
        }
        fs.writeFile('alquiler-distrito-retiro-pacifico.json', JSON.stringify(data), (err) => {
            if (err) console.log(err);
            console.log("Successfully Written to File.");
        });
    } catch (error) {
        console.log(error);
    };
})();


// Funciona que determina el número de páginas de nuestra búsqueda:
const getNumPages = async(page) => {
    let numViviendas = await page.evaluate(() => {
        return parseInt(document.querySelector('#main > div > div.listing-top > nav > ul > li.current-level > span.breadcrumb-info').innerText);
    });
    let numHousing = await page.evaluate(() => {
        let articles = [...document.querySelectorAll('#main-content > section > article')];
        return articles.length;
    });
    let numPag = Math.ceil(numViviendas / numHousing);
    console.log(numPag)
    return numPag;
}