const elasticsearch = require('elasticsearch');
const config = require('./config.json');
const knex = require('knex');


const Client = new elasticsearch.Client({
    host: config.elastic_host,
    requestTimeout: config.elastic_timeout,
    keepAlive: true
});

const Client2 = new elasticsearch.Client({
    host: config.elastic_host2,
    requestTimeout: config.elastic_timeout,
    keepAlive: true
});

module.exports = {
    getSqlDb: function () {// mysql, maria connection
        return knex({
            client: "mysql2",
            connection: {
                host: config.db_host,
                user: config.db_user,
                password: config.db_password,
                port: config.db_port,
                database: config.db_database,
                connectionLimit: 5,
                port: 3310
            }
        });
    },
    getOracleDb: function () { // oracle connection
        return knex({
            client: 'oracledb',
            connection: {
                user: config.oracle_user,
                password: config.oracle_password,
                connectString: config.oracle_connectString
            }
        })
    },
    getElasticclient: function () {
        return Client
    },
    getElasticclient2: function () {
        return Client2
    },
    bulkElastic: async function (body) {
        if (config.elastic_host === config.elastic_host2) {
            await Client.bulk({ body })
        } else {
            await Promise.all([Client.bulk({ body }), Client2.bulk({ body })])
        }
    },
    deleteElastic: async function (indexnm, keys) {
        if (config.elastic_host === config.elastic_host2) {
            await Client.deleteByQuery({
                index: indexnm,
                refresh: true,
                type: "_doc",
                body: {
                    "query": {
                        "bool": {
                            "filter": {
                                "bool": {
                                    "must": [
                                        {
                                            "ids": {
                                                "values": keys
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    }
                }
            });
        } else {
            await Promise.all([await Client.deleteByQuery({
                index: indexnm,
                refresh: true,
                type: "_doc",
                body: {
                    "query": {
                        "bool": {
                            "filter": {
                                "bool": {
                                    "must_not": [
                                        {
                                            "ids": {
                                                "values": keys
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    }
                }
            }), await Client2.deleteByQuery({
                index: indexnm,
                refresh: true,
                type: "_doc",
                body: {
                    "query": {
                        "bool": {
                            "filter": {
                                "bool": {
                                    "must_not": [
                                        {
                                            "ids": {
                                                "values": keys
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    }
                }
            })])
        }
    }, deleteElasticByDate: async function (indexnm, date) {
        if (config.elastic_host === config.elastic_host2) {
            await Client.deleteByQuery({
                index: indexnm,
                refresh: true,
                type: "_doc",
                body: {
                    "query": {
                        "range": {
                            "indexing_date": {
                                "lte": date
                            }
                        }
                    }
                }
            });
        } else {
            await Promise.all([await Client.deleteByQuery({
                index: indexnm,
                refresh: true,
                type: "_doc",
                body: {
                    "query": {
                        "range": {
                            "indexing_date": {
                                "lt": date
                            }
                        }
                    }
                }
            }), await Client2.deleteByQuery({
                index: indexnm,
                refresh: true,
                type: "_doc",
                body: {
                    "query": {
                        "range": {
                            "indexing_date": {
                                "lt": date
                            }
                        }
                    }
                }
            })])
        }
    },
    cmspath: config.cmspath
}

/******************************************
 * 수행 환경
 ******************************************/
console.log("*********************************** Configuration ***********************************");
console.log(` server is ${config.server}`);
console.log(` {elastic_search_host1=> ${config.elastic_host} {elastic_search_host2=> ${config.elastic_host2} elastic_timeout=> ${config.elastic_timeout}`);
console.log("*************************************************************************************");