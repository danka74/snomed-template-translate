const mysql = require('nodejs-mysql').default;

const db = mysql.getInstance({
  host: '10.3.24.7',
  user: 'root',
  password: process.env.MYSQL_PASSWORD,
  database: 'snomed_full_20190131',
  supportBigNumbers: true,
  bigNumberStrings: true
});

const sql = `select c.id, c.fsn, c.semtag, r.relationshipGroup, r.typeId, r.destinationId, d.term
from concepts_snap2 c
  join transitiveclosure t on c.id = t.subtypeId
  join relationships_snap r on c.id = r.sourceId
  join descriptions_snap d on (r.destinationId = d.conceptId and d.active = 1 and d.languageCode = "sv")
  join languagerefsets_snap l on (d.id = l.referencedComponentId  and l.active = 1 and l.refsetId = 46011000052107 and l.acceptabilityId = 900000000000548007) # preferred
where c.active = 1
  and r.active = 1
  and t.supertypeId = 373873005 #| Pharmaceutical / biologic product (product) |
  and (c.effectiveTime = 20190131 or c.effectiveTime = 0)
  and c.id in (select id from concepts group by id having count(id) = 1)
  and c.definitionStatusId <> 900000000000074008
  and r.typeId <> 116680003
order by c.id, r.relationshipGroup, r.typeId`;

const neverGrouped = [

];

db.exec(sql)
    .then(rows => {
        
    })
    .catch(error => {
        console.log(error);
        return;
    });
