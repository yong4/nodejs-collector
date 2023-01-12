# nodejs-collector
2021-03-29 nodejs elasticsearch indexing example

node로 RDBMS 질의문을 수행하여 데이터 가공 후 Elastic에 색인하는 샘플이다.

knex manual
1) https://www.npmjs.com/package/knex
2) http://knexjs.org/


oracledb
오라클은 질의문 수행 환경에 oracle client 설치되어 있어야함
-- windows
1) https://www.oracle.com/database/technologies/instant-client/downloads.html
2) 환경변수 세팅

-- centos 7
1) https://cofs.tistory.com/406 참고


문서파싱
-- cheerio
1) HTML파싱하는 cheerio https://www.npmjs.com/package/cheerio

실행시 데이터에 따라 max-old-space-size 설정해야함

/usr/bin/node --max-old-space-size=8192  ${path}/tag.js  > ${path}/tag.out 2>&1
