        const rows = require('./output.json');

        var missingCount = 0;

        // tranform SQL result rows to structured concept objects
        // there are one row per relationship
        const concepts = rows.reduce((concepts, row, index, array) => {
            // find concept by id if present
            const concept = concepts.find(c => c.sctid == row.id);
            
            // if not present push a new object
            if(!concept) {
                concepts.push({
                    sctid: row.id,
                    fsn: row.fsn,
                    semtag: row.semtag,
                    drug: row.drug,
                    groups: [ {
                        group: row.relationshipGroup,
                        rels: [ {
                            typeId: row.typeId,
                            destinationId: row.destinationId,
                            term: row.term,
                            caseSignificanceId: row.caseSignificanceId
                        }]
                    } ]
                });
            } else { // existing concept, update groupes and/or relationships
                if(row.relationshipGroup == 0) { // first, check if the relationship is in relationship group 0 (RG0)
                    concept.groups.push({ // push a new group object for each RG0 relationship (self-grouping)
                        group: 0,
                        rels: [ {
                            typeId: row.typeId,
                            destinationId: row.destinationId,
                            term: row.term,
                            caseSignificanceId: row.caseSignificanceId
                        }]
                    });
                } else { // not RG0
                    /// find group if present
                    const group = concept.groups.find(g => g.group === row.relationshipGroup);

                    // if not present push a new group
                    if(!group) {
                        concept.groups.push({
                            group: row.relationshipGroup,
                            rels: [ {
                                typeId: row.typeId,
                                destinationId: row.destinationId,
                                term: row.term,
                                caseSignificanceId: row.caseSignificanceId
                            }]
                        });
                    } else { // existing group, push relationship
                        group.rels.push({
                            typeId: row.typeId,
                            destinationId: row.destinationId,
                            term: row.term,
                            caseSignificanceId: row.caseSignificanceId
                        });
                    }
                    
                }    
                
            }
            
            return concepts;
        }, []);

        //console.log("Number of concepts found = " + concepts.length);

        const combineTerms = function(total, term, index, length) {
            if(index == 0) {
                return total + term;
            }
            if(index == length - 1) {
                return total + " och " + term;
            }
            return total + ", " + term;
        }

        const numerize = function(word) {
            if(word === "ett") {
            return "1";
            } 
            if(word === "två") {
                return "2";
            } else
            if(word === "tre") {
                return "3";766939001
            } else
            if(word === "fyra") {
                return "4";
            } else
            if(word === "fem") {
                return "5";
            }
            if(word === "sex") {
                return "6";
            } 
            if(word === "sju") {
                return "7";
            } else
            if(word === "åtta") {
                return "8";
            } else
            if(word === "nio") {
                return "9";
            } else
            if(word === "tio") {
                return "10";
            }
            return word;
        }

        // initially every term is considered case insensitive, the intial character is always case insensitive, iff there is a case sensitive term as part, then the intire term is "Only initial..."
        const aggregateCS = function(currentCS, newCS) {
            if(currentCS == 900000000000020002) { // | Only initial character case insensitive (core metadata concept) |
                return currentCS;
            }
            if(newCS == 900000000000020002 || newCS == 900000000000017005) { // | Entire term case sensitive (core metadata concept) |
                return 900000000000020002; // | Only initial character case insensitive (core metadata concept) |
            }
            return currentCS;
        }

        const doseFormPreposition = function(doseForm) {
            if(doseForm.indexOf("form") !== -1) {
                return "i";
            } else {
                return "som";
            }
        }

        // map concept objects to new term objects
        const newTerms = concepts.map(concept => {
            let term = "";
            if(concept.drug === 1) {
                term = "läkemedel "
            } else {
                term = "produkt "
            }
            let caseSignificanceId = 900000000000448009;

            // count number of "has active ingredient" or "has precise active ingredient" relationships
            const numberIngredients = concept.groups.reduce((total, group) => {
                 if(group.rels.find(r => r.typeId === 127489000 || r.typeId === 762949000)) {
                     return total + 1;
                 } else {
                     return total;
                 }
            }, 0);

            // extract the stated number of active ingredients
            const statedCount = concept.groups.reduce((total, group) => {
                let rel = group.rels.find(r => r.typeId === 766952006); // TODO: base active ingredient...
                if(rel) {
                    let term = numerize(rel.term);

                    return total + parseInt(term);
                }
                return total;   
            }, 0);

            // if(statedCount > 0 && numberIngredients != statedCount) {
            //     console.log(concept);
            // }

            if(concept.semtag === "medicinal product" || concept.semtag === "product") {
                const wordList = concept.groups.reduce((total, group) => {
                    let rel = group.rels.find(r => r.typeId === 127489000 || r.typeId === 762949000) // 127489000 | Has active ingredient (attribute) |, 762949000 | Has precise active ingredient (attribute) |
                    if(rel) {
                        total.push(rel.term);
                        caseSignificanceId = aggregateCS(caseSignificanceId, rel.caseSignificanceId);
                    }
                    return total;
                }, [])
                const words = wordList.reduce((total, word, index, wordList) => {
                    return combineTerms(total, word, index, wordList.length);
                }, "");
            
                // if stated ingredient count is not 0 and the numbers match, it is a "containing only" drug
                if(wordList.length > 0) {
                    if(statedCount != 0) { // && statedCount == numberIngredients) {
                        term += "som endast innehåller ";
                    } else {
                        term += "som innehåller ";
                    }
                }
                term += words;
            }

            if(concept.semtag === "medicinal product form") {
                const wordList = concept.groups.reduce((total, group) => {
                    let rel = group.rels.find(r => r.typeId === 127489000 || r.typeId === 762949000) // 127489000 | Has active ingredient (attribute) |, 762949000 | Has precise active ingredient (attribute) |
                    if(rel) {
                        total.push(rel.term);
                        caseSignificanceId = aggregateCS(caseSignificanceId, rel.caseSignificanceId);
                    }
                    return total;
                }, [])
                const words = wordList.reduce((total, word, index, wordList) => {
                    return combineTerms(total, word, index, wordList.length);
                }, "");
                // if stated ingredient count is not 0 and the numbers match, it is a "containing only" drug
                if(wordList.length > 0) {
                    if(statedCount != 0) { // && statedCount == numberIngredients) {
                        term += "som endast innehåller ";
                    } else {
                        term += "som innehåller ";
                    }
                }
                term += words;

                const form = concept.groups.reduce((total, group) => {
                    let rel = group.rels.find(r => r.typeId === 411116001) // 411116001 | Has manufactured dose form (attribute) |
                    if(rel) {
                        caseSignificanceId = aggregateCS(caseSignificanceId, rel.caseSignificanceId);
                        return rel.term;
                    }
                    return total;
                }, null);
                if(form) {
                    term += " " + doseFormPreposition(form) + " " + form;
                }
                
            }


            if(concept.semtag === "clinical drug") {
                const wordList = concept.groups.reduce((total, group) => {
                    const boss = group.rels.find(r => r.typeId === 732943007) // 732943007 | Has basis of strength substance (attribute) | 
                    //const rel = group.rels.find(r => r.typeId === 127489000) // 127489000 | Has active ingredient (attribute) |
                    const relPrecisely = group.rels.find(r => r.typeId === 762949000) // 762949000 | Has precise active ingredient (attribute) |
                    if(relPrecisely && boss) {
                        let phrase;

                        if(boss.destinationId !== relPrecisely.destinationId) {
                            phrase = boss.term + " (som " + relPrecisely.term + ")";
                            caseSignificanceId = aggregateCS(caseSignificanceId, boss.caseSignificanceId);
                            caseSignificanceId = aggregateCS(caseSignificanceId, relPrecisely.caseSignificanceId);
                        } else {
                            phrase = relPrecisely.term;
                        }

                        const numeratorVal = group.rels.find(r => r.typeId === 732944001 || r.typeId === 733724008);
                        const numeratorUnit = group.rels.find(r => r.typeId === 732945000 || r.typeId === 733725009);
                        const denominatorVal = group.rels.find(r => r.typeId === 732946004 || r.typeId === 733723002);
                        const denominatorUnit = group.rels.find(r => r.typeId === 732947008 || r.typeId === 733722007);

                        let pluralis = false;
                        if(numeratorVal) {
                            const num = numerize(numeratorVal.term.replace(/ /g, ''));
                            if(num > 1) {
                                pluralis = true;
                            }
                            phrase += " " + numerize(numeratorVal.term);
                        }
                        if(numeratorUnit) {
                            if(numeratorUnit.term === "enhet" && pluralis) {
                                phrase += " enheter";
                            } else {
                                phrase += " " +  numeratorUnit.term;
                            }
                            caseSignificanceId = aggregateCS(caseSignificanceId, numeratorUnit.caseSignificanceId);
                        }
                        if(denominatorVal && denominatorUnit && denominatorVal.term === "ett") {
                            phrase += "/" + denominatorUnit.term;
                        } else {
                            if(denominatorVal) {
                                phrase += "/" + numerize(denominatorVal.term);
                            }
                            if(denominatorUnit) {
                                phrase += " " + denominatorUnit.term;
                                caseSignificanceId = aggregateCS(caseSignificanceId, denominatorUnit.caseSignificanceId);
                            }
                        }

                        total.push(phrase);
                    }

                    return total;
                }, [])
                
                const words = wordList.reduce((total, word, index, wordList) => {
                    return combineTerms(total, word, index, wordList.length);
                }, "");
                // if stated ingredient count is not 0 and the numbers match, it is a "containing only" drug
                if(wordList.length > 0) {
                    term += "som endast innehåller exakt "
                    // if(statedCount != 0 && statedCount == numberIngredients) {
                    //     term += "som endast innehåller ";
                    // } else {
                    //     term += "som innehåller ";
                    // }
                }
                term += words;

                const form = concept.groups.reduce((total, group) => {
                    let rel = group.rels.find(r => r.typeId === 411116001)
                    if(rel) {
                        caseSignificanceId = aggregateCS(caseSignificanceId, rel.caseSignificanceId);
                        return rel.term;
                    }
                    return total;
                }, null);
                if(form) {
                    term += " " + doseFormPreposition(form) + " " + form;
                }
                
            }

            if(concept.semtag === "product") {
                const wordList = concept.groups.reduce((total, group) => {
                    let rel = group.rels.find(r => r.typeId === 766939001) // 766939001 | Plays role |
                    if(rel) {
                        total.push(rel.term);
                        caseSignificanceId = aggregateCS(caseSignificanceId, rel.caseSignificanceId);
                    }
                    return total;
                }, []);

                const words = wordList.reduce((total, word, index, wordList) => {
                    return combineTerms(total, word, index, wordList.length);
                }, "");

                if(wordList.length > 0) {
                    term += "med " + words;
                }

            }

            return { 
                        sctid: concept.sctid,
                        fsn: concept.fsn,
                        newTerm: term.trim(),
                        caseSignificanceId: caseSignificanceId
            };
        });

        console.log("Concept ID	GB/US FSN Term	Translated Term	Language Code	Case significance	Type	Language reference set	Acceptability");

        newTerms.forEach(element => {
            console.log(element.sctid + "\t" + element.fsn + " \t" + element.newTerm + "\tsv\t" + (element.caseSignificanceId === 900000000000448009 ? "ci" : "cI") + "\tSYNONYM\tSwedish\tPREFERRED");
        }); 
