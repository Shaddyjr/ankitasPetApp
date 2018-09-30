const fetch = require("node-fetch");
const BASE_URL = "http://api.petfinder.com/";
const API_KEY = process.env.API_KEY;
const API_VALID_RESPONSE_CODE = "100";

class ShelterController{
    mountDb(db){
        this.db = db;
    }

    _getSheltersFromAPI(zipcode){
        const url = `${BASE_URL}shelter.find?key=${API_KEY}&format=json&location=${zipcode}`;
        
        const validResponse = json => {
            return json.petfinder.header.status.code.$t === API_VALID_RESPONSE_CODE;
        }

        return new Promise((res, rej)=>{
            fetch(url)
                .then(res => res.json())
                .then(json => {
                    if (validResponse(json)) {
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
                    res(filteredShelters);
                }).catch(err=>{
                    rej(err);
                })
        })
    }

    getShelterFromAPI(shelterApiId){
        return new Promise((res, rej)=>{

        });
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
                if(!row) return rej(`Shelter (${shelterApiId}) not found`);
                res(row);
            });
        });
    }

    getOrCreateShelterFromDB(shelterApiId){

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
            const sql = "";
            this.db.run(sql, shelterApiId, function(err, row){
                if(err) return rej(err);
                res(row);
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