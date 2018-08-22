var fetch = require("node-fetch");
const { JSDOM } = require("jsdom");
module.exports = class ShelterFormatter{
    constructor(URL,shelterApiId){
        this.URL = URL;
        this.shelterApiId = shelterApiId;
    }
    
    getCleanPage(){
        return new Promise((res,rej)=>{
            fetch(this.URL)
                .then(response=>response.text())
                .then(html=>{
                    const cleanDom = this.getPage(html);
                    res(cleanDom.serialize());
                })
        })
    }

    getPage(html){
        return this.sterilizeDomForm(new JSDOM(html));
    }

    sterilizeDomForm(dom){
        const old_form = dom.window.document.querySelector("form");
        var new_form = dom.window.document.createElement("form");
        while (old_form.childNodes.length > 0) {
            new_form.appendChild(old_form.childNodes[0]);
        }
        old_form.parentNode.replaceChild(new_form, old_form);
        new_form.action = `/shelters/id/${this.shelterApiId}`;
        new_form.method = "POST";

        const head = dom.window.document.querySelector("head");
        const script = dom.window.document.createElement("script");
        script.defer = true;
        script.src = "/static/client.js";
        head.appendChild(script);

        const body = dom.window.document.querySelector("body");
        body.style.display = "none";
        return dom;
    }
}