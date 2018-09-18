// SHOULD INCLUDE PARAMS VALIDATION
module.exports = function (app, dbHandler) {

    app.route("/metaAnswers")
        .get((req,res)=>{
            dbHandler.getFullQuestions()
                .then(
                    questions=>{
                        res.render("metaAnswers",{
                            "questions":questions
                        }
                    )
                })
        })
        .post((req,res)=>{
            const params = req.params;
            console.log(params);
        })
    
    app.route("/metaAnswers/:id")
        .get((req,res)=>{
            const metaAnswerId = req.params.id;
            dbHandler.findById("metaAnswers",metaAnswerId)
                .then(metaAnswer=>{
                    res.render("metaAnswer",{
                        "metaAnswer": metaAnswer
                    })
                })
        })
}