//색인 데이터의 양이 많을 경우 N개씩 나눠서 색인하는 샘플
/*********************** include *****************************/
const approot = require('app-root-path');
const moment = require('moment');
const config = require(approot + '/config/config');
const { now } = require('moment');
const util = require(approot + '/lib/util');
const sql = require(approot + '/sql/simple_sqldb_sample');//query
/**************************************************************/
// 데이터 양이 작은 쿼리 질의문을 수행한 후 데이터를 가공하여 Elastic인덱스에 색인하는 샘플이다.

let dataset = [];//색인 데이터 담아둘 Array
let datakeys = [];//Id Array
(async () => {
    const startdt = moment(moment(), "YY/MM/DD h:mm");
    const indexingDate = moment().format("YYYY-MM-DDTHH:mm:ss.SSSZ");

    try {
        knex = await config.getSqlDb();// Mysql Maria
        // knex = await config.getOracleDb();//oracle Db
        await Promise.all([knex.raw(sql.query)])
            .then(responses => {
                console.log('query complete')
                for (let response of responses) {
                    response = response[0];

                    for (let hit of response) {
                        let data = {...hit};
                        data.id = hit.svc_code;
                        data.indexing_date = indexingDate;//색인 시간 저장
                        datakeys.push(data.id);// 새로이 변경될 키값을 제외한 이전데이터를 지우기 위한 배열
                        dataset.push(data);//Db data 저장
                    }
                }
            })
    } catch (err) {
        throw err;
    } finally {
        if (knex) {
            knex.destroy();
        }
    }

   
    if (dataset.length > 0) {
        const body = dataset.flatMap(doc => [{ update: { _id: doc.id, _index: '{Elastic Index Name}', "retry_on_conflict": 3 } }, { doc: doc, doc_as_upsert: true }])

        await config.bulkElastic(body);

        await config.deleteElastic('{Elastic Index Name}', datakeys);

        // 색인 날짜 기준으로 새로이 변경될 키값을 제외한 이전데이터를 지우기
        // await config.deleteElasticByDate("{Elastic Index Name}", indexingDate);

    }

    const enddt = moment(moment(), "YY/MM/DD h:mm");
    console.log(util.durationTime(startdt, enddt))
})()