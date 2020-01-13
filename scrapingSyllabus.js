const puppeteer = require('puppeteer')
const fs = require('fs');

const writeFile = (path, data) => {
  fs.writeFile(path, data,  (err) => {
    if (err) {
        throw err;
    }
  });
}


async function getLatestDate(page, url){
  await page.goto(url) 
  return await page.evaluate(() => {
      const boxElements = Array.from(document.querySelectorAll(".box"));
      const scrapingData = boxElements.map(el => {
          return {
              SubjectFieldName: el.querySelector(".daikbn").textContent.trim(),
              items:  Array.from(el.querySelectorAll(".contents > .syllabus > tbody > tr > td > table > tbody > tr ")).map((element) => {
                if(element.querySelector("td").textContent.length > 0 ){
                  return {
                    itemTitle: element.querySelector("td").textContent.trim(),
                  }
                } else {
                  return {
                    itemSubs: Array.from(element.querySelectorAll("td > a")).map((sub) => {
                      return {
                        subName: sub.textContent.trim(),
                      }
                    })
                  }
                }
              })
          }
      })
      return scrapingData;
      })

}




!(async() => {
  try {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    const dataList = await getLatestDate(page, 'http://web-ext.u-aizu.ac.jp/official/curriculum/syllabus/1_J_000.html')
    let toJsonArray = dataList.map((el, elIndex) => {
        // Two-dimensional array with subject names
        let fieldSubjectNames = [];
        // Subjects name for each field
        let subjectsNames = [];

        // Variable to judge
        const subsFirstTitles = ["HS", "EN", "MA", "SY", "IE"];
        let judgeName = subsFirstTitles[elIndex]
        return {
          SubjectFieldName: el.SubjectFieldName,
          SubjectFields:  el.items.filter((item, index) => {
              if(item.itemSubs) {
                if(item.itemSubs[0].subName.substring(0, 2) === 'EL'){
                  if(item.itemSubs[0].subName.substring(0, 3) === judgeName && index+ 1 < el.items.length) {
                    fieldSubjectNames.push(item.itemSubs[0].subName);
                  } else {
                    if (index+ 1 === el.items.length) {
                      fieldSubjectNames.push(item.itemSubs[0].subName);
                    }
                    subjectsNames.push(fieldSubjectNames);
                    fieldSubjectNames = new Array();
                    fieldSubjectNames.push(item.itemSubs[0].subName);
                    judgeName = item.itemSubs[0].subName.substring(0, 3);
                  }
                } else {
                  if(item.itemSubs[0].subName.substring(0, 2) === judgeName && index+ 1 < el.items.length) {
                    fieldSubjectNames.push(item.itemSubs[0].subName);
                    
                  } else {
                    if (index+ 1 === el.items.length) {
                      fieldSubjectNames.push(item.itemSubs[0].subName);
                    }
                    subjectsNames.push(fieldSubjectNames);
                    fieldSubjectNames = new Array();
                    fieldSubjectNames.push(item.itemSubs[0].subName);
                    judgeName = item.itemSubs[0].subName.substring(0, 2);
                  }
                }
             }
              return (item.itemTitle)
            }).map((item, index )=> {
              if(item) {
                if(item.itemTitle){
                  return {
                    fieldName:item.itemTitle,
                    subjects: subjectsNames[index]
                  }
                }
                
              }
            })

          }
        
    })

    const dataJson = JSON.stringify(toJsonArray);
    writeFile("syllabus2019.json", dataJson);

    browser.close()
  } catch(e) {
    console.error(e)
  }
})()