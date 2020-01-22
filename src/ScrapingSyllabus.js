const puppeteer = require('puppeteer');
const fs = require('fs');
const SYLLABUS_URL = 'http://web-ext.u-aizu.ac.jp/official/curriculum/syllabus/1_J_000.html';
const SYLLABUS_DETAIL_URL = 'http://web-ext.u-aizu.ac.jp/official/curriculum/syllabus/2019_1_J_0';


const writeFile = (path, data) => {
    fs.writeFile(path, data, (err) => {
        if (err) {
            throw err;
        }
    });
};


async function getLatestDate(page, url) {
    await page.goto(url);
    console.log('go to => ' + url);
    return page.evaluate(() => {
        const boxElements = Array.from(document.querySelectorAll(".box"));
        const scrapingData = boxElements.map(el => {
            return {
                SubjectFieldName: el.querySelector(".daikbn").textContent.trim(),
                items: Array.from(el.querySelectorAll(".contents > .syllabus > tbody > tr > td > table > tbody > tr ")).map((element) => {
                    if (element.querySelector("td").textContent.length > 0) {
                        return {
                            itemTitle: element.querySelector("td").textContent.trim(),
                        }
                    } else {
                        return {
                            itemSubs: Array.from(element.querySelectorAll("td > a")).map(sub => {
                                return {
                                    subName: sub.textContent.trim(),
                                }
                            })
                        }
                    }
                })
            }
        });
        return scrapingData;
    });
}

async function getDetail(page, url, id, indexUrl) {
    console.log('go to => ' + `${url}${indexUrl}.html#${id}`);
    await page.goto(`${url}${indexUrl}.html#${id}`);
    return page.evaluate((indexUrl) => {
        //const subjectElements = document.querySelector(`#${id}`);
        const datas = Array.from(document.querySelectorAll('.sytab')).map((data, index) => {
            let subTitle = data.querySelector('.ui-state-default').textContent.trim();
            let detailData = Array.from(data.querySelectorAll('.syllabus-break-word')).filter((data, index) => {
                return index < 5
            }).map((data, index) => {
                return data.textContent.trim();
            });
            let detail = Array.from(data.querySelectorAll('.syllabus-html-break-word')).map(data => {
                return data.textContent.trim();
            });
            // return [subTitle, ...detailData, ...detail];
            return {
                title: subTitle,
                semester: detailData[0],
                courseFor: detailData[1],
                credits: detailData[2],
                instructor: detailData[4],
                update: detail[0],
                outline: detail[1],
                gradingMethod: detail[5],
                reference: detail[7]
            }
        });
        return datas
    }, indexUrl);
}

!(async () => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        const dataList = await getLatestDate(page, SYLLABUS_URL);
        console.log('finish!!');

        const subsFirstTitles =
            ["HS01", "PA01", "EN01", "EL102", "EL213", "EL314", "EG101", "JP01", "MA01", "NS01", "LI01", "PL01", "FU01", "SY02", "CN02"
                , "IT01", "SE01", "OT01-I", "IE01", "TE01", "OT03-001"];


        let subjectDetailData = [];

        for (let i = 0; i < subsFirstTitles.length; i++) {
            let tmp = await getDetail(page, SYLLABUS_DETAIL_URL, subsFirstTitles[i], ('00' + (i + 1)).slice(-2));
            console.log('finish!!');
            subjectDetailData.push(tmp);
        }

        let toJsonArray = dataList.map((el, elIndex) => {
            // Two-dimensional array with subject names
            let fieldSubjectNames = [];
            // Subjects name for each field
            let subjectsNames = [];

            // Variable to judge
            const subsFirstTitles = ["HS", "EN", "MA", "SY", "IE"];

            let judgeName = subsFirstTitles[elIndex];
            return {
                categoryName: el.SubjectFieldName,
                categoryId: ('000' + (elIndex)).slice(-2),
                fields: el.items.filter((item, index) => {
                    if (item.itemSubs) {
                        if (item.itemSubs[0].subName.substring(0, 2) === 'EL') {
                            if (item.itemSubs[0].subName.substring(0, 3) === judgeName && index + 1 < el.items.length) {
                                fieldSubjectNames.push(item.itemSubs[0].subName);
                            } else {
                                if (index + 1 === el.items.length) {
                                    fieldSubjectNames.push(item.itemSubs[0].subName);
                                }
                                subjectsNames.push(fieldSubjectNames);
                                fieldSubjectNames = new Array();
                                fieldSubjectNames.push(item.itemSubs[0].subName);
                                judgeName = item.itemSubs[0].subName.substring(0, 3);
                            }
                        } else {
                            if (item.itemSubs[0].subName.substring(0, 2) === judgeName && index + 1 < el.items.length) {
                                fieldSubjectNames.push(item.itemSubs[0].subName);
                            } else {
                                if (index + 1 === el.items.length) {
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
                }).map((item, index) => {
                    if (subjectsNames[index]) {
                        return {
                            fieldName: item.itemTitle,
                            fieldId: ('000' + (elIndex)).slice(-2) + ('000' + (index)).slice(-2),
                            subjects: subjectsNames[index].map((data, subIndex) => {
                                let filter = {};
                                subjectDetailData.forEach(dataList => {
                                    dataList.filter(judge => {
                                        return judge.title === data
                                    }).forEach((filterData) => {
                                        if (filterData.length !== 0) {
                                            filter = filterData;
                                        }
                                    })
                                });
                                return {
                                    subjectName: data,
                                    subjectId: ('000' + (elIndex)).slice(-2) + ('000' + (index)).slice(-2) + ('000' + (subIndex)).slice(-2),
                                    detail: filter
                                }
                            })
                        }
                    } else {
                        let filter = {};
                        subjectDetailData.forEach(dataList => {
                            dataList.filter(judge => {
                                return judge.title === item.itemTitle
                            }).forEach((filterData) => {
                                if (filterData.length !== 0) {
                                    filter = filterData;
                                }
                            })
                        });
                        return {
                            subjectName: item.itemTitle,
                            subjectId: ('000' + (elIndex)).slice(-2) + '00' + ('000' + (index)).slice(-2),
                            detail: filter
                        }
                    }
                })
            }
        });

        const dataJson = JSON.stringify(toJsonArray);
        writeFile("syllabus2019.json", dataJson);
        console.log('save ok  => syllabus2019.json !!');
        browser.close();
    } catch (e) {
        console.error(e);
    }
})();
