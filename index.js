import mysql from 'nodejs-mysql';

const db = mysql.getInstance({
  host: 'localhost',
  user: 'root',
  password: process.env.MYSQL_PASSWORD,
  database: 'snomed_full_20190131'
});

const sql = `select c.id, c.fsn, c.semtag, r.typeId, r.destinationId, d.term
from concepts_snap2 c
  join transitiveclosure t on c.id = t.subtypeId
  join relationships_snap r on c.id = r.sourceId
  left join xsnomed_full_SE1000052_20181130.descriptions_snap d on (r.destinationId = d.conceptId and d.active = 1 and d.languageCode = "sv")
  left join xsnomed_full_SE1000052_20181130.languagerefsets_snap l on (d.id = l.referencedComponentId  and l.active = 1 and l.refsetId = 46011000052107 and l.acceptabilityId = 900000000000548007) # preferred
where c.active = 1
  and r.active = 1
  and t.supertypeId = 373873005 #| Pharmaceutical / biologic product (product) |
  and c.effectiveTime = 20190131
  and c.id in (select id from concepts group by id having count(id) = 1)
  and c.definitionStatusId <> 900000000000074008
  and r.typeId <> 116680003
order by c.id, r.typeId`;

db.exec(sql)
    .then(rows => {
        for(row in rows) {
            console.log(row);
        }
    })
    .catch(error => {
        console.log(error);
        return;
    });