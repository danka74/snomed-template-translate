select c.id, c.fsn, c.semtag, r.relationshipGroup, r.typeId, r.destinationId, d.term, d.caseSignificanceId, 
  c.id in (select subtypeId from transitiveclosure where supertypeId = 763158003) as drug
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
order by c.id, r.relationshipGroup, r.typeId