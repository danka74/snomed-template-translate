const rows = require('/home/dlkn02/output.json');

//console.log(rows[0]);
const concepts = rows.reduce((concepts, row) => {
    //console.log(concepts);
    const concept = concepts.find(c => c.sctid === row.id);
    
    if(!concept) {
        concepts.push({
            sctid: row.id,
            fsn: row.fsn,
            semtag: row.semtag,
            groups: [ {
                group: row.relationshipGroup,
                rels: [ {
                    typeId: row.typeId,
                    term: row.term
                }]
            } ]
        });
    } else {
        if(row.relationshipGroup == 0) {
            concept.groups.push({
                group: 0,
                rels: [ {
                    typeId: row.typeId,
                    term: row.term
                }]
            });
        } else {
            const group = concept.groups.find(g => g.group === row.relationshipGroup);

            if(!group) {
                concept.groups.push({
                    group: row.relationshipGroup,
                    rels: [ {
                        typeId: row.typeId,
                        term: row.term
                    }]
                });
            } else {
                group.rels.push({
                    typeId: row.typeId,
                    term: row.term
                });
            }
            
        }    
        
    }
    
    return concepts;
}, []);

console.log("Number of concepts found = " + concepts.length);

const newTerms = concepts.map(concept => {
    let term = "läkemedel som innehåller ";

    if(concept.semtag === "medicinal product") {
        term += concept.groups.reduce((total, group) => {
            let rel = group.rels.find(r => r.typeId == 127489000)
            return total + ", " + (rel ? rel.term : "error!")
        }, "")
    }

    return { 
                sctid: concepts.sctid,
                newTerm: term
    };
});

console.log(newTerms)