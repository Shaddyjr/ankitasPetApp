const fetch = require("node-fetch");
const { JSDOM } = require("jsdom");
const KEY_ITERATION_SEPERATOR = "-!-";
const key_iteration_re = new RegExp(KEY_ITERATION_SEPERATOR);
module.exports = class ShelterFormatter{
    constructor(URL,shelterApiId){
        this.URL = URL;
        this.shelterApiId = shelterApiId;
    }
    
    async getCleanPage(){
        const html = await new Promise((res,rej)=>{
            fetch(this.URL)
                .then(response=>response.text())
                .then(html=>{
                    const cleanDom = this.getPage(html);
                    // ALSO SEND FORMS ACTIONS AS SHELTER DATA
                    // SHOULD PASS UP THE INPUT TYPES, TOO FOR EACH INPUT NAME
                    console.log("done cleaning DOM - going to serialize");
                    res(cleanDom.serialize());
                })
        });
        return html;
    }

    /**
     * Returns the page with metaAnswer drop downs for each input field.
     * @param {*} metaAnswers all metaAnswer names
     */
    getMetaAnswerPage(formIds, metaAnswers){
        console.log("Returning MetaAnswerPage");
        return new Promise((res,rej)=>{
            fetch(this.URL)
                .then(response=>response.text())
                .then(html=>this.addMetaAnswerPage(html, formIds, metaAnswers))
                .then(data=>res(data))
        })
    }

    /**
     * Adds the set of metaAnswers as options for drop down menus.
     */
    createDatalist(dom, metaAnswers){
        console.log("Creating Datalist");

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

    /**
     * Returns array with only original names.
     * @param {Array} formIds internally used formIds
     */
    cleanFormIds(formIds){
        console.log("Clearning formIds");

        const uniques = new Set;
        for(const formId of formIds){
            if(formId.match(key_iteration_re)){
                uniques.add(formId.split(KEY_ITERATION_SEPERATOR)[0]);
            }
        }
        return Array.from(uniques.values());
    }
    
    addMetaAnswerPage(html, uncleanFormIds, metaAnswers){
        console.log("Creating MetaAnswerPage");

        const formIds = this.cleanFormIds(uncleanFormIds);
        const dom = new JSDOM(html);
        dom.window.document.querySelector("body").appendChild(this.createDatalist(dom, metaAnswers));

        const old_form = dom.window.document.querySelector("form");
        var new_form = dom.window.document.createElement("form");
        while (old_form.childNodes.length > 0) {
            const child = old_form.childNodes[0];
            new_form.appendChild(child);
        }
        console.log("Done with while loop");

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
        console.log("Done with creating MetaAnswerPage")
        return dom;
    }

    /**
     * Returns the same html with updated form target and injecting script.
     */
    getPage(html){
        return this.sterilizeDomForm(new JSDOM(html));
    }

    /**
     * Updates form target and injects script.
     */
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