# EJEMPLO DE INICIACION AL WEBSCRAPPING CON PUPPETEER

El objetivo es obtener o "scrapear" los datos de una búsqueda que hagamos, en este caso, de la paǵina de Idealista, la conocida web de alquiler y compra de viviendas.

Antes de nada aclarar que Idealista proporciona una API con la cual acceder a los datos sin tener hacer scraping, es decir tienen sus datos abiertos al público. Realizar peticiones a una API requiere menos desarrollo que scrapear y, por otro, Idealista evita todo ese tráfico “indeseado”. 
Por lo que, lo que vamos a hacer en este ejemplo no es excesivamente práctico o útil, pero lo que importa es aprender.

[API de Idealista](http://developers.idealista.com/access-request)


Para ello utilizaremos *Puppeteer* que es una librearía de 




**¡¡ Al turrón !!**

## Procedimiento:
1. Lo primero que debemos hacer es convertir nuestro proyecto en un proyecto de NodeJS, para ello abrimos la terminal en nuestro proyecto:
```sh
npm init -y
```
Esto nos generará automáticamente el fichero  ```package.json``` donde podremos gestionar todas las dependencias.
El hecho de escribir ```-y``` nos evita tener que contestar o rellenar características del proyecto como el nombre del autor, versión, etc.

2. Instalar ```puppeteer```:
Escribimos en la terminal:
```sh
npm i puppeteer
```
Puppeteer incluye la última versión de **chrome / chromium**, que garantiza que podamos trabajar con Chrome en modo headless. Por lo tanto, que no os extrañe que esta instalación demore un poquito.

3. Creamos el archivo ```puppeteer.js``` donde probaremos escribiremos nuestro código.
```sh
touch puppeteer.js
```

4. Vamos a comprobar que `puppeteer` funciona correctamente haciendo algunos ejemplos sencillos. En este caso, vamos a hacer una captura de pantalla de alguna web que nos guste y, además, generar un archivo .pdf con esto:

```javascript
//Cargamos 'puppeteer'
const puppeteer = require('puppeteer');

(async () => {
  //Inicializar el navegador Chrome
  const browser = await puppeteer.launch(); 
  //Crear una nueva página en el contexto del navegador inicializado
  const page = await browser.newPage();
  //Navegar a una página determinada.
  await page.goto('https://example.com');
  //Genera el screenshot y lo salva el la ruta que le indiquemos
  await page.screenshot({path: 'example.png'});
  //Genera el archivo pdf y lo guarda en la ruta que le indiquemos
  await page.pdf({ path: 'example.pdf'});
  //Cierra el navegador
  await browser.close();
})();
```

Para probar este script hemos creado el archivo example.js

**¡Ahora si, empieza el Rock and roll!**

5. Vamos a hacer un script con el que podamos recoger algunos datos sobre viviendas publicadas en la página de Idealista.

```javascript
const puppeteer = require('puppeteer');

let url = 'insert idealista URL';

(async() => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);

    let data = await page.evaluate(() => {
        let housingData = [];
        let housing = document.querySelectorAll('#main-content > section > article');

        housing.forEach((house) => {
            let houseJson = {};
            try {
                houseJson.descripcion = house.querySelector('#main-content > section > article > div > a').innerText;
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
    });
    console.log(data)
})();
```
6. Hasta ahora vemos los datos desde la consola, lo que pretendemos a continuación es crear un JSON con esta información. Para ello utilizamos el  módulo de administración de archivos **fs** que ya viene implementado en NodeJS.
Este módulo nos permite acceder al sistema de archivos para poder leer sus contenidos y crear otros archivos o carpetas.

```javascript
const puppeteer = require('puppeteer');
const fs = require('fs');

let url = 'insert idealista URL';

(async() => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);

    let data = await page.evaluate(() => {
      ...
      ...
      ...
    });
    fs.writeFile('viviendas.json', JSON.stringify(data), (err) => {
      if (err) console.log(err);
      console.log("Successfully Written to File.");
      });
})();
```
7. Algunos sitios web tienen contramedidas para evitar el web scrapping. Por lo que es muy probable que Idealista nos restrinjan el número de peticiones. Es decir, toma sus medidas para no les scrapee un bot. 
Hay información recopilada sobre medidas para intentar detectar un headless y sus correspondientes medidas para saltarlas: [ejemplo](https://github.com/paulirish/headless-cat-n-mouse).

   Consejos: 
   - Con *puppeteer*, podemos controlar las solicitudes realizadas en un sitio web y evitar que se realicen.
   - Utilizar el método **page.wairFor** de una manera aleatoria para parece "más humano".

8. Lo siguiente que vamos a hacer sería modificar nuestros script para poder acceder a todas las páginas.
En la parte superior de la búsqueda puedes ver que hay 533 viviendas en el momento de escribir esto:

   ![search](pictures/search.png)

Copia el selector desde las herramientas de desarrollador de tu navegador. A continuación vamos a escribir una nueva función para determinar el número de páginas:

```javascript
const getNumPages = async(page) => {
//Determinados el número de ventas totales de nuestra búsqueda
    let numViviendas = await page.evaluate(() => {
        return parseInt(document.querySelector('#main > div > div.listing-top > nav > ul > li.current-level > span.breadcrumb-info').innerText);
    });
    //Determinados el número de viviendas por pagina del navegador
    let pisos = await page.evaluate(() => {
        let articles = [...document.querySelectorAll('#main-content > section > article')];
        return articles.length;
    });
    //Número de páginas de navegador que debemos iterar:
    let numPag = Math.ceil(numViviendas / pisos);
    return numPag;
}
```
9. Modificar nuestro script para que itere por todas las páginas:
```javascript
---------------------------------------
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
}
```

Para probar este script hemos creado el archivo puppeteer.js

También hemos creado una **rama "puppeteerPro"**, donde tenemos el código mucho más limpito y elegante por si te apetece darle una vuelta.



1. nomenclatura descriptiva (funciones de la ram de los pros);
2. template literal con los selctores
3. rama checkout para los sobraos
4. cats and dogs







