
/*********************** include *****************************/
const approot = require('app-root-path');
const moment = require('moment');
const config = require(approot + '/config/config');
const util = require(approot + '/lib/util');
const pLimit = require('p-limit');
const sql = require(approot + '/sql/large_data_sample');//query
const cheerio = require('cheerio');
/**************************************************************/
// 데이터 양이 많은 N개의 쿼리 질의문을 수행한 후 데이터를 가공하여 N개의 Elastic인덱스에 색인하는 샘플이다.


const limit = pLimit(100);//비동기식으로 처리할 count

let center_dataset = [];//색인 데이터 담아둘 Array
let center_datakeys = [];//Id Array

let store_dataset = [];//색인 데이터 담아둘 Array
let store_datakeys = [];//Id Array

(async () => {
    const startdt = moment(moment(), "YY/MM/DD h:mm");
    const indexingDate = moment().format("YYYY-MM-DDTHH:mm:ss.SSSZ");
    try {
        knex = await config.getSqlDb();// Mysql Maria
        //knex = await config.getOracleDb();//oracle Db
        let center_data = []
        let store_data = []
        await Promise.all([knex.raw(sql.center), knex.raw(sql.store)])
            .then(responses => {
                console.log('query complete')
                for (let response of responses) {//조회한 쿼리 반복문
                    response = response[0];

                    for (let hit of response) {//데이터 반복문
                        if (hit.query_type == "center") {
                            center_data = response;
                            break;
                        } else if (hit.query_type == "store") {
                            store_data = response;
                            break;
                        }

                    }
                }
            })
        /* 조회된 데이터를 위에서 선언한 limit count 만큼 나누어서 동기식으로 처리(처리속도 향상)*/
        await Promise.all(center_data.map(hit => {
            return limit(() => pageParsing(hit));
        }))
        .then(responses => {
            for (let response of responses) {
                response.id = response.svc_code;//Elastic ID값 세팅
                response.indexing_date = indexingDate;//색인 시간 저장
                console.log(response);
                center_dataset.push(response);//data 저장
                center_datakeys.push(response.seq);// 새로이 변경될 키값을 제외한 이전데이터를 지우기 위한 배열
            }
        })
    } catch (err) {
        throw err;
    } finally {
        if (knex) {
            knex.destroy();
        }
    }

    // if(center_dataset.length > 0){
    //     await indexing(center_dataset, center_datakeys, "center");
    // }
    // if( store_dataset.length > 0 ){
    //     await indexing(store_dataset, store_datakeys, "store");
    // }

   
    const enddt = moment(moment(), "YY/MM/DD h:mm");
    console.log(util.durationTime(startdt, enddt))
})()


async function pageParsing(hit) {//데이터 가공
    try {
        //데이터 가공부분
        /* 예시)
         * if (fs.existsSync(filepath)) {
         *  const xmlfile = await readFile(filepath, 'utf8')
         *  let $ = cheerio.load(xmlfile, { xmlMode: true });
         *  const content = $('Datum[ID=textBlockHeadline]').text() + ' ' + $('Datum[ID=textBlockBodyCopy]').text() + ' ' + $('Datum[ID=headline]').text() + ' ' + $('Datum[ID=bodyCopy]').text()
         *  hit.content = content;
         *  } else {
         *      hit.content = "";
         *  }
         */
        return hit;

    } catch (error) {
        console.error(error.message)
    }
}

async function chunk(arr, size) {//배열 쪼개는 함수
    let chunk = size;
    let i, j;
    let temp_array = [];

    for (i = 0, j = arr.length; i < j; i += chunk) {
        temp_array.push(arr.slice(i, i + chunk));
    }
    return temp_array;
}

async function indexing(dataset, datakeys, indexname){ //데이터 크기 확인 후 색인
    console.log(dataset.length);
    //색인 데이터양이 클경우 나눠서 색인
    if( dataset.length > 10000 ){
        let data_count = 100;///Elastic에 나눠서 색인할 개수
        let all_count = dataset.length;//색인 데이터 전체 개수

        division_data = await chunk(dataset, data_count);//배열 나누기
        let c = 1;
        for( let i in division_data ){//나눠진 DATA 반복문
            try {
                console.log(all_count + " / " +  data_count * c );
                await bulk(division_data[i], indexname);//Elastic에 색인
            } catch (error) {
                console.log("bulk error");
            }
            c++;
        }
    }else{
        const body = dataset.flatMap(doc => [{ update: { _id: doc.id, _index: indexname, "retry_on_conflict": 3 } }, { doc: doc, doc_as_upsert: true }])

        await config.bulkElastic(body);
    }

    // 새로이 변경될 키값을 제외한 이전데이터를 지우기
    try {
        await config.deleteElastic(indexname, datakeys);

        // 색인 날짜 기준으로 새로이 변경될 키값을 제외한 이전데이터를 지우기
        // await config.deleteElasticByDate("{Elastic Index Name}", indexingDate);
    } catch (error) {
        console.log("delete error");
    }
}

async function bulk(dataset, indexname) {// Elasctic Bulk 함수
    let body = dataset.flatMap(doc => [{ update: { _id: doc.id, _index: indexname, "retry_on_conflict": 3 } },
    { doc: doc, doc_as_upsert: true }])
    await config.bulkElastic(body);
}