var fetch = require("node-fetch");
const { JSDOM } = require("jsdom");
const INJECTED_FORM_ACTION = "/shelters/?/formUrl";
class ShelterFormHandler{
    constructor(URL,shelterApiId){
        this.URL = URL;
        this.shelterApiId = shelterApiId; // Used to "Submit" form to update shelter form elements in DB

        const re = /\?/;
        this.formActionUrl = INJECTED_FORM_ACTION.replace(re,this.shelterApiId);
    }

    async getCleanPage(){
        const html = await new Promise((res,rej)=>{
            fetch(this.URL)
                    .then(response=>response.text())
                    .then(html=>res(html))
                    .catch(err=>rej(err))
        })

        this.dom = this.getSterilizedHTML(html);
        const form = this.dom.window.document.querySelector("form");
        const input = Array.from(form.querySelectorAll("input")).map(input=>{ return {"name":input.name,"type":input.type} });
        const select = Array.from(form.querySelectorAll("select")).map(select=>{ return {"name":select.name,"options":Array.from(select.querySelectorAll("option")).map(option=>{ return {"text":option.textContent, "value": option.value} })} });
        const textarea = Array.from(form.querySelectorAll("textarea")).map(textarea=>textarea.name);

        return {
            html:this.dom.serialize(),
            formData:{
                input    : input,
                select   : select,
                textarea : textarea
            }
        };
    }

    // Resolves issue where original form has attached event handlers.
    getSterilizedHTML(html){
        const dom = new JSDOM(html,{ includeNodeLocations: true });
        const old_form = dom.window.document.querySelector("form");
        const new_form = dom.window.document.createElement("form");
        while (old_form.childNodes.length > 0) {
            const child = old_form.childNodes[0];
            new_form.appendChild(child);
        }
        old_form.parentNode.replaceChild(new_form, old_form);
        new_form.action = this.formActionUrl;
        new_form.method = "POST";
        return dom;
    }

}
module.exports = ShelterFormHandler;