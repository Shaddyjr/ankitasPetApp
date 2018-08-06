module.exports = class ShelterFormatter{

    constructor(fetch,URL){
        fetch(URL)
            .then(response=>response.text())
            .then(htmlText=>this.getForm(htmlText), err=>this.handleError(err))
            .then(formText=>this.visualizeForm(formText));
    }
    
    /**
     * Grabs the first form element from the given string and returns only form as a string.
     */
    getForm(htmlText){
        return new Promise((res, rej)=>{
            const start = htmlText.search(/<form/);
            const end = htmlText.search(/form>/);
            if(start < 0 || end < 0) rej("Could not find a form tag");
            res(htmlText.slice(start, end+1));
        });
    }
    
    /**
     * Removes all classes from the element and all of its children nodes.
     */
    removeClasses(element){
        const children = element.childNodes;
        if(children.length > 0){
            for(const child of children){
                child.className = "";
                this.removeClasses(child);
            }
        }
    }
    
    /**
     * Adds the text to the HTML.
     */
    visualizeForm(formText){
        console.log(formText);
        // const element = document.body;
        // element.innerHTML = formText;
        // this.removeClasses(element);
    }
    
    handleError(err){
        console.log(err);
    }
}