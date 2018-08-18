var fetch = require("node-fetch");
const { JSDOM } = require("jsdom");
module.exports = class ShelterFormatter{
    constructor(URL,id){
        this.URL = URL;
        this.shelterId = id;
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
        const dom = new JSDOM(html);
        return this.sterilizeDomForm(dom);
    }

    sterilizeDomForm(dom){
        const old_form = dom.window.document.querySelector("form");
        var new_form = dom.window.document.createElement("form");
        while (old_form.childNodes.length > 0) {
            new_form.appendChild(old_form.childNodes[0]);
        }
        old_form.parentNode.replaceChild(new_form, old_form);
        new_form.action = `/shelters/${this.shelterId}`
        new_form.method = "POST";
        return dom;
    }

    /**
     * Grabs the first form element from the given string and returns only form as a string.
     */
    // getForm(htmlText){
    //     return new Promise((res, rej)=>{
    //         const start = htmlText.search(/<form/);
    //         const end = htmlText.search(/form>/);
    //         if(start < 0 || end < 0) rej("Could not find a form tag");
    //         res(htmlText.slice(start, end+5));
    //     });
    // }
    
    /**
     * Removes all classes from the element and all of its children nodes.
     */
    // removeClasses(element){
    //     const children = element.childNodes;
    //     if(children.length > 0){
    //         for(const child of children){
    //             child.className = "";
    //             this.removeClasses(child);
    //         }
    //     }
    // }

    handleError(err){
        console.log(err);
    }
}