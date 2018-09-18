var fetch = require("node-fetch");
const { JSDOM } = require("jsdom");
const KEY_ITERATION_SEPERATOR = "-!-";
const key_iteration_re = new RegExp(KEY_ITERATION_SEPERATOR);
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
                    // ALSO SEND FORMS ACTIONS AS SHELTER DATA
                    // SHOULD PASS UP THE INPUT TYPES, TOO FOR EACH INPUT NAME
                    res(cleanDom.serialize());
                })
        })
    }

    getMetaAnswerPage(formIds, metaAnswers){
        return new Promise((res,rej)=>{
            fetch(this.URL)
                .then(response=>response.text())
                .then(html=>this.addMetaAnswerPage(html, formIds, metaAnswers))
        })
    }

    createDatalist(dom, metaAnswers){
        const datalist = dom.window.document.createElement("datalist");
        for(const metaAnswer of metaAnswers){
            const option = dom.window.document.createElement("option");
            option.value = metaAnswer.id;
            option.innerText = metaAnswer.name;
            datalist.appendChild(option); 
        }
        datalist.id = "metaAnswers";
        return datalist;
    }

    cleanFormId(formId){

    }
    
    addMetaAnswerPage(html, formIds, metaAnswers){
        const dom = new JSDOM(html);
        dom.window.document.querySelector("body").appendChild(this.createDatalist(dom, metaAnswers));

        const old_form = dom.window.document.querySelector("form");
        var new_form = dom.window.document.createElement("form");
        while (old_form.childNodes.length > 0) {
            const child = old_form.childNodes[0];
            new_form.appendChild(child);
        }
        old_form.parentNode.replaceChild(new_form, old_form);
        new_form.action = `/metaAnswers`;
        new_form.method = "POST";

        for(const formId of formIds){
            const input = dom.window.document.getElementsByName(formId)[0];
            const type = input.type;
            input.type = "text";
            input.list = "metaAnswers";
            input.dataset.type = type;
        }
        return dom;
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