const fetch = require("node-fetch");
const BASE_URL = "http://api.petfinder.com/";
const API_KEY = process.env.API_KEY;
const API_VALID_RESPONSE_CODE = "100";

class ShelterController{
    mountDb(db){
        this.db = db;
    }

    validResponse(json){
        return json.petfinder.header.status.code.$t === API_VALID_RESPONSE_CODE;
    }

    _getSheltersFromAPI(zipcode){
        const url = `${BASE_URL}shelter.find?key=${API_KEY}&format=json&location=${zipcode}`;

        return new Promise((res, rej)=>{
            fetch(url)
                .then(res => res.json())
                .then(json => {
                    if (this.validResponse(json)) {
                        const data = json.petfinder.shelters.shelter;
                        res(data);
                    } else {
                        const message = json.petfinder.header.status.message.$t;
                        rej(`Problem accessing zipcode (${zipcode}) from API: ${message}`);
                    }
                })
                .catch(err => {
                    rej(`Problem accessing API: ${err}`);
                });
        })
    }

    getBlacklist(){
        return new Promise((res,rej)=>{
            const sql = "SELECT * FROM shelterBlacklist;";
            this.db.all(sql, function(err, rows){
                if(err) return rej(err);
                res(rows);
            });
        });
    }

    getSheltersFromAPI(zipcode){
        return new Promise((res,rej)=>{
            const apiPromise = this._getSheltersFromAPI(zipcode);
            const dbPromise = this.getBlacklist();

            Promise.all([apiPromise, dbPromise])
                .then(values=>{
                    let shelters, blacklist;
                    [shelters, blacklist] = values;
                    const blacklistIDs = blacklist.map(blacklistedShelter=>blacklistedShelter.api_id);
                    const filteredShelters = shelters.filter(shelter=>{
                        const shelterApiId = shelter.id.$t;
                        return !blacklistIDs.includes(shelterApiId);
                    });
                    res(filteredShelters.map(this.parseShelterFromAPI));
                }).catch(err=>{
                    rej(err);
                })
        })
    }

    getShelterFromAPI(shelterApiId){
        const url = `${BASE_URL}shelter.get?key=${API_KEY}&format=json&id=${shelterApiId}`;

        return new Promise((res, rej)=>{
            fetch(url)
                .then(res => res.json())
                .then(json => {
                    if (this.validResponse(json)) {
                        const shelter = json.petfinder.shelter;
                        res(this.parseShelterFromAPI(shelter));
                    } else {
                        const message = json.petfinder.header.status.message.$t;
                        rej(`Problem accessing zipcode (${zipcode}) from API: ${message}`);
                    }
                })
                .catch(err => {
                    rej(`Problem accessing API: ${err}`);
                });
        })
    }
    
    getSheltersFromDB(){
        return new Promise((res, rej)=>{
            const sql = "SELECT * FROM shelters;";
            this.db.all(sql, function(err, rows){
                if(err) return rej(err);
                res(rows);
            });
        });
    }

    getShelterFromDB(shelterApiId){
        return new Promise((res, rej)=>{
            const sql = "SELECT * FROM shelters WHERE api_id = ? LIMIT 1;";
            this.db.get(sql, shelterApiId, function(err, row){
                if(err) return rej(err);
                res(row);
            });
        });
    }

    getShelterById(shelterID){
        return new Promise((res, rej)=>{
            const sql = "SELECT * FROM shelters WHERE id = ? LIMIT 1;";
            this.db.get(sql, shelterID, function(err, row){
                if(err) return rej(err);
                res(row);
            });
        });
    }

    parseShelterFromAPI(shelter){
        return {
            api_id: shelter.id.$t,
            name: shelter.name.$t,
            location: `${shelter.zip.$t} ${shelter.city.$t}, ${shelter.state.$t}`,
            contact: shelter.email.$t
        }
    }

    insertShelterFromAPI(shelterApiId){
        return new Promise((res,rej)=>{
            this.getShelterFromAPI(shelterApiId)
                .then(APIshelter=>{
                    const shelter = this.parseShelterFromAPI(APIshelter);
                    let {api_id, name, location, contact} = shelter;
                    const sql = "INSERT INTO shelters (api_id, name, location, contact, url, formUrl) VALUES (?,?,?,?,?,?)";
                    this.db.run(sql, [api_id, name, location, contact], function(err){
                        if(err) return rej(err);
                        res(this.lastID); // ID of shelter (not api_id)
                    })
                })
                .catch(rej);
        })
    }

    async getOrCreateShelterFromDB(shelterApiId){
        let dbShelter;
        dbShelter = await this.getShelterFromDB(shelterApiId);
        if(dbShelter) return dbShelter;
        const dbShelterID = await this.insertShelterFromAPI(shelterApiId);
        dbShelter = await this.getShelterById(dbShelterID);
        return dbShelter;
    }
    
    removeShelter(shelterApiId){
        return new Promise((res, rej)=>{
            const sql = "DELETE FROM shelters WHERE api_id = ?;";
            this.db.run(sql, shelterApiId, function(err, row){
                if(err) return rej(err);
                res(row);
            });
        });
    }

    updateShelter({api_id, name, location, contact, url, formUrl, reviewed}){
        return new Promise((res, rej)=>{
            if(api_id===undefined) return rej("api_id missing");
            const updateParams = [name, location, contact, url, formUrl, reviewed];
            if(updateParams.every(item=>item===undefined)){
                return rej(`Shelter ${api_id} missing info to update`);
            }
    
            const sqlParams = [];
            let tempStr = [];
            if(name){
                sqlParams.push(name);
                tempStr.push("name");
            }
            if(location){
                sqlParams.push(location);
                tempStr.push("location");
            }
            if(contact){
                sqlParams.push(contact);
                tempStr.push("contact");
            }
            if(url){
                sqlParams.push(url);
                tempStr.push("url");
            }
            if(formUrl){
                sqlParams.push(formUrl);
                tempStr.push("formUrl");
            }
            if(reviewed){
                sqlParams.push(reviewed);
                tempStr.push("reviewed");
            }
            sqlParams.push(api_id);
            
            const sub = "=?";
            const sqlPlaceholders = tempStr.map(column=>column+sub).join(", ");
            const sql = `UPDATE shelters SET ${sqlPlaceholders} WHERE api_id=?;`;
            this.db.run(sql, sqlParams, function(err, row){
                if(err) return rej(err);
                res(this.changes); // returns number of rows changed
            });
        });
    }

    blacklistShelter(shelterApiId){
        // must remove from shelter
        return new Promise((res, rej)=>{
            this.db.run(sql, shelterApiId, function(err, row){
                if(err) return rej(err);
                res(row);
            });
        });
    }

}

module.exports = new ShelterController;