const playwright = require('playwright');
const compareImages = require("resemblejs/compareImages")
const config = require("./config.json");
const fs = require('fs');
const { readdirSync } = require('fs')

const { viewportHeight, viewportWidth, browsers, options } = config;

const img = 'capturas_v3';
const _img = 'capturas_v4'
//const img1 = 'http://localhost:8080/' + img + '.png'
//const img2 = 'http://localhost:8081/' + img + '.png'
const img1 = 'ss2.png';
const img2 = 'screenshot1.png';

async function executeTest(){
    if(browsers.length === 0){
      return;
    }

    let results = [];
    let datetime = new Date().toISOString().replace(/:/g,".");

    let folders = readdirSync(`./results/${img}`, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    console.log(JSON.stringify(folders));
    for(let folder of folders){
      console.log(JSON.stringify(folder));
      let resultInfo = {}
      let files = readdirSync(`./results/${img}/${folder}`, { withFileTypes: true })
        .filter(dirent => dirent.isFile())
        .map(dirent => dirent.name);
      
      console.log(JSON.stringify(files));
      for(let file of files)
      {
        console.log(JSON.stringify(file));
        for(b of browsers){
          if(!b in ['chromium', 'webkit', 'firefox']){
              return;
          }
          if (!fs.existsSync(`./results/${folder}}`)){
              fs.mkdirSync(`./results/${folder}`, { recursive: true });
          }
  
          const data = await compareImages(
              fs.readFileSync(`./results/${img}/${folder}/${file}`),
              fs.readFileSync(`./results/${_img}/${folder}/${file}`),
              options
          );
          resultInfo[b] = {
              isSameDimensions: data.isSameDimensions,
              dimensionDifference: data.dimensionDifference,
              rawMisMatchPercentage: data.rawMisMatchPercentage,
              misMatchPercentage: data.misMatchPercentage,
              diffBounds: data.diffBounds,
              analysisTime: data.analysisTime
          }

          if (!fs.existsSync(`./results/${folder}/${file}`)){
            fs.mkdirSync(`./results/${folder}/${file}`, { recursive: true });
          }
          fs.writeFileSync(`./results/${folder}/${file}/compare-${folder}-${b}.png`, data.getBuffer());
  
        }
  
        fs.writeFileSync(`./results/${folder}/${file}/report.html`, createReport(datetime, resultInfo, `../../${img}/${folder}/${file}`, `../../${_img}/${folder}/${file}`, folder));
        fs.copyFileSync('./index.css', `./results/${folder}/${file}/index.css`);
        // fs.copyFileSync(`./result/${img}/${folder}/${file}`, `./result/${folder}/${file}/${file.split('.')[0]}_v3.png`);
        // fs.copyFileSync(`./result/${_img}/${folder}/${file}`, `./result/${folder}/${file}/${file.split('.')[0]}_v4.png`);
  
        console.log('------------------------------------------------------------------------------------')
        console.log("Execution finished. Check the report under the results folder")
        results.push(resultInfo);
      }
    }

    // for(b of browsers){
    //     if(!b in ['chromium', 'webkit', 'firefox']){
    //         return;
    //     }
    //     if (!fs.existsSync(`./results/${img}`)){
    //         fs.mkdirSync(`./results/${img}`, { recursive: true });
    //     }
    //     //Launch the current browser context
    //     /*const browser = await playwright[b].launch({headless: true, viewport: {width:viewportWidth, height:viewportHeight}});
    //     const context = await browser.newContext();
    //     const page = await context.newPage(); 
    //     await page.goto(config.url);
    //     await page.screenshot({ path: `./results/${datetime}/before-${b}.png` });
    //     await page.click('#generate');
    //     await page.screenshot({ path: `./results/${datetime}/after-${b}.png` });
    //     await browser.close();*/

    //     const data = await compareImages(
    //         fs.readFileSync(`./results/${img}/${img1}`),
    //         fs.readFileSync(`./results/${img}/${img2}`),
    //         //`http://localhost:8080/${img}.png`, 
    //         //`http://localhost:8081/${img}.png`,
    //         options
    //     );
    //     resultInfo[b] = {
    //         isSameDimensions: data.isSameDimensions,
    //         dimensionDifference: data.dimensionDifference,
    //         rawMisMatchPercentage: data.rawMisMatchPercentage,
    //         misMatchPercentage: data.misMatchPercentage,
    //         diffBounds: data.diffBounds,
    //         analysisTime: data.analysisTime
    //     }
    //     fs.writeFileSync(`./results/${img}/compare-${img}-${b}.png`, data.getBuffer());

    // }

    // fs.writeFileSync(`./results/${img}/report.html`, createReport(datetime, resultInfo));
    // fs.copyFileSync('./index.css', `./results/${img}/index.css`);

    // console.log('------------------------------------------------------------------------------------')
    // console.log("Execution finished. Check the report under the results folder")
    return results;  
  }
(async ()=>console.log(await executeTest()))();

function browser(b, info, _img1, _img2, name){
    return `<div class=" browser" id="test0">
    <div class=" btitle">
        <h2>Browser: ${b}</h2>
        <p>Data: ${JSON.stringify(info)}</p>
    </div>
    <div class="imgline">
      <div class="imgcontainer">
        <span class="imgname">Reference</span>
        <img class="img2" src=${_img1} id="refImage" label="Reference">
      </div>
      <div class="imgcontainer">
        <span class="imgname">Test</span>
        <img class="img2" src=${_img2} id="testImage" label="Test">
      </div>
    </div>
    <div class="imgline">
      <div class="imgcontainer">
        <span class="imgname">Diff</span>
        <img class="imgfull" src="./compare-${name}-${b}.png" id="diffImage" label="Diff">
      </div>
    </div>
  </div>`
}

function createReport(datetime, resInfo, _img1, _img2, name){
    return `
    <html>
        <head>
            <title> VRT Report </title>
            <link href="index.css" type="text/css" rel="stylesheet">
        </head>
        <body>
            <h1>Report for 
                 <a href="${config.url}"> ${config.url}</a>
            </h1>
            <p>Executed: ${datetime}</p>
            <div id="visualizer">
                ${config.browsers.map(b=>browser(b, resInfo[b], _img1, _img2, name))}
            </div>
        </body>
    </html>`
}