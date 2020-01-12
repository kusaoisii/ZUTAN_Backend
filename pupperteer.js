const puppeteer = require('puppeteer')
var fs = require('fs');

//ファイルの書き込み関数
function writeFile(path, data) {
  fs.writeFile(path, data,  (err) => {
    if (err) {
        throw err;
    }
  });
}


async function getLatestDate(page, url){
  await page.goto(url) // ページへ移動
  // 任意のJavaScriptを実行


  return await page.evaluate(() => {
      const list = Array.from(document.querySelectorAll(".box"));

      const listItem = list.map(el => {
          return {
              textContent: el.querySelector(".daikbn").textContent.trim(),
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

      return listItem;
      })

}




!(async() => {
  try {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    const dataList = await getLatestDate(page, 'http://web-ext.u-aizu.ac.jp/official/curriculum/syllabus/1_J_000.html')
    let toJsonArray = dataList.map(el => {
        //console.log("=== "+el.textContent+" ===");
        let itemsArray = [];
        let subsArray = [];
        let subsName = "HS";
        let count = 0;
        return {
          SubjectGroupName: el.textContent,
          SubjectField: {
            array: el.items.filter(item => {
              
              if(item.itemSubs) {
                //console.log(subsName);
                //console.log(item.itemSubs[0].subName.substring(0, 2));
                if(item.itemSubs[0].subName.substring(0, 2) === subsName) {
                  //console.log(item.itemSubs[0].subName);
                  itemsArray.push(item.itemSubs[0].subName);
                  
                } else {
                  //console.log(item.itemSubs[0].subName);
                  //console.log(itemsArray)
                  //console.log(itemsArray);
                  subsArray.push(itemsArray);
                  itemsArray = [];
                  itemsArray.push(item.itemSubs[0].subName);
                  subsName = item.itemSubs[0].subName.substring(0, 2);
                  //console.log('------------------------')
                }
             }
              return item.itemSubs? false: true
            }).map((item, index )=> {
              if(item) {
                if(item.itemTitle){
                  //console.log(itemsArray);
                  //console.log("- "+ item.itemTitle[0].subname)
                  //console.log(itemSubs)
                  //console.log(subsArray[index]);
                  console.log(index + "; "+subsArray[index]);
                  return {
                    name:item.itemTitle,
                    subs: subsArray[index]
                  }
                }
                
              }
            })

          }
        }
    })

    const dataJason = JSON.stringify(toJsonArray);
    //console.log(dataJason)
    writeFile("data.json", dataJason);

    browser.close()
  } catch(e) {
    console.error(e)
  }
})()