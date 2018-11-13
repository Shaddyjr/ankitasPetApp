document.addEventListener("DOMContentLoaded",()=>{
    const items = ["reviewed","blacklist"];
    for(const item of items){
        const $item = $(`.${item}`);
        $item.click(e=>{
            const target = $(e.target);
            const url = target.attr("data-url");
            const oppValue = target.text() === "true" ? 0 : 1;
            fetch(`${url}?_method=PUT&${item}=${oppValue}`,{
                method:"POST"
            }).then(res=>{
                if(res.status===200){
                    const oppTextValue = !!oppValue ? "true" : "false"; 
                    target.text(oppTextValue);
                }else{
                    target.text("💀Error💀");
                }
            })
        })
    }
})