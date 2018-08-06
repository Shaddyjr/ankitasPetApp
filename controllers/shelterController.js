module.exports = function(app,fetch){
    const BASE_URL = "http://api.petfinder.com/";
    const API_KEY  = process.env.API_KEY;
    
    const getShelters = zipcode => {
        return new Promise((res,rej)=>{
            const URL = `${BASE_URL}shelter.find?key=${API_KEY}&format=json&location=${zipcode}`;
            fetch(URL)
                .then(res=>res.json())
                .then(json=>{
                    const status = Number(json.petfinder.header.status.code.$t);
                    if(status === 100){
                        const data = json.petfinder.shelters.shelter;
                        res(data);
                    }else{
                        const message = json.petfinder.header.status.message.$t;
                        rej(message);
                    }
                }, err=>rej(err));
        });
    }

    app.get("/shelters/:zip",(req,res)=>{
        const zip = Number(req.params.zip);
        getShelters(zip)
            .then(
                data=>res.render("shelters",{"shelters":data}),
                err =>res.render("error",{error:err})
        );
    });
    
    app.post("/shelters/zip",(req,res)=>{
        const zip = req.body.zip;
        res.redirect(`/shelters/${zip}`);
    });

    app.post("/shelters",(req,res)=>{

    });

    app.get("/shelter/:id",(req,res)=>{
        // params.id
    });
}