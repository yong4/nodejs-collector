/*********************** include *****************************/
const approot = require('app-root-path');
const moment = require('moment');
const config = require(approot + '/config/config');
const { now } = require('moment');
const util = require(approot + '/lib/util');
const sql = require(approot + '/sql/simple_oracle_sample');//query
/**************************************************************/

let dataset = [];//색인 데이터 담아둘 Array
let datakeys = [];//Id Array
(async () => {
    const startdt = moment(moment(), "YY/MM/DD h:mm");
    const indexingDate = moment().format("YYYY-MM-DDTHH:mm:ss.SSSZ");
    let pool;
    let conn;    
    try{
        // knex = await config.getSqlDb();// Mysql Maria
        knex = await config.getOracleDb();//oracle Db
        await Promise.all([knex.raw(sql.query)])
            .then(responses => {
                console.log('query complete')
                for (let response of responses) {//조회한 쿼리 반복문
                    for (let hit of response) {
                        let = data = {...hit};
                        data.indexing_date = indexingDate;//색인 시간 저장
                        console.log(data);
                        datakeys.push(data.c_id);// 새로이 변경될 키값을 제외한 이전데이터를 지우기 위한 배열
                        dataset.push(data);//Db data 저장
                    }
                }
            })
    }catch (err) {
        throw err;
    } finally {
        if (conn) {
            conn.close();
        }
        if (pool) {
            pool.close();
        }
    }

    if (dataset.length > 0) {
        const body = dataset.flatMap(doc => [{ update: { _id: doc.c_id, _index: '{Elastic index name}', "retry_on_conflict": 3 } },
        { doc: doc, doc_as_upsert: true }])//Elastic에 색인 할 JSON 가공

        await config.bulkElastic(body);//Elastic에 색인

        await config.deleteElastic('{Elastic index name}', datakeys);//기존 Elasctic에는 존재하고 DB에는 존재하지 않는 ID값 추출하여 Elasctic에서 삭제

        // 색인 날짜 기준으로 새로이 변경될 키값을 제외한 이전데이터를 지우기
        // await config.deleteElasticByDate("{Elastic Index Name}", indexingDate);
    }

    const enddt = moment(moment(), "YY/MM/DD h:mm");
    console.log(util.durationTime(startdt, enddt))
})()